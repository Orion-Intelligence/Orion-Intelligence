from __future__ import annotations

import asyncio
from types import SimpleNamespace

import pytest

from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator


def _model(matchtype="or", q="test"):
    return SimpleNamespace(matchtype=matchtype, q=q, must=False)


def test_build_ioc_filter_clauses_handles_search_all_and_specific_keys():
    clauses = elastic_request_generator.build_ioc_filter_clauses(
        {
            "m_search_all": ["exdsaample.com"],
            "m_email": ["a@examsadple.com"],
            "unknown": ["x"],
        }
    )

    assert isinstance(clauses, list)
    assert len(clauses) >= 2


def test_build_es_from_tagged_and_or_logic():
    parsed = {
        "AND": [
            {"tag": "m_email", "value": "a@example.com"},
            {"OR": [{"tag": "m_ip", "value": "1.1.1.1"}, {"tag": "m_ip", "value": "8.8.8.8"}]},
        ]
    }
    mapping = {"m_email": ["email.keyword"], "m_ip": ["ip.keyword"]}

    query = elastic_request_generator.build_es_from_tagged(parsed, mapping)
    assert "bool" in query
    assert "must" in query["bool"]


def test_build_query_block_non_semantic_contains_function_score_gauss():
    query = elastic_request_generator._build_query_block(
        p_query_model=_model(matchtype="or", q="alpha beta"),
        pfilter={"m_email": ["a@example.com"]},
        raw_query="alpha beta",
        quoted_value=False,
        exact_phrases=[],
        loose_terms=["alpha", "beta"],
        phrase_fields=[("m_title", 3), ("m_content", 1)],
        must_clauses=[],
        must_not_clause=[],
        m_page_number=1,
        date_field="m_leak_date",
    )

    fs = query["query"]["function_score"]
    assert fs["score_mode"] == "sum"
    assert fs.get("functions")
    assert "gauss" in fs["functions"][0]


def test_build_query_block_full_match_with_quoted_query():
    query = elastic_request_generator._build_query_block(
        p_query_model=_model(matchtype="full", q='"exact phrase"'),
        pfilter={},
        raw_query='"exact phrase"',
        quoted_value=True,
        exact_phrases=["exact phrase"],
        loose_terms=[],
        phrase_fields=[("m_title", 3), ("m_content", 1)],
        must_clauses=[],
        must_not_clause=[],
        m_page_number=1,
        date_field="m_leak_date",
    )

    bool_query = query["query"]["function_score"]["query"]["bool"]
    assert bool_query["must"]


def test_build_query_block_semantic_without_flag_falls_back_to_bool(monkeypatch):
    from orion.helper_manager.env_handler import env_handler

    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda *_: "0")))

    query = elastic_request_generator._build_query_block(
        p_query_model=_model(matchtype="semantic", q="semantic phrase"),
        pfilter={},
        raw_query="semantic phrase",
        quoted_value=False,
        exact_phrases=[],
        loose_terms=["semantic", "phrase"],
        phrase_fields=[("m_title", 3), ("m_content", 1)],
        must_clauses=[],
        must_not_clause=[],
        m_page_number=1,
        date_field="m_leak_date",
    )

    inner_query = query["query"]["function_score"]["query"]
    assert "bool" in inner_query


def test_build_ioc_filter_clauses_adds_prefix_for_very_long_values():
    long_value = "a" * 5111
    clauses = elastic_request_generator.build_ioc_filter_clauses({"m_email": [long_value]})
    shoulds = clauses[0]["bool"]["should"]
    assert any("prefix" in item for item in shoulds)


def test_build_query_block_url_filter_expands_url_variants():
    query = elastic_request_generator._build_query_block(
        p_query_model=_model(matchtype="or", q="url check"),
        pfilter={"m_url": ["example.com"]},
        raw_query="url check",
        quoted_value=False,
        exact_phrases=[],
        loose_terms=["url", "check"],
        phrase_fields=[("m_title", 3), ("m_content", 1)],
        must_clauses=[],
        must_not_clause=[],
        m_page_number=1,
        date_field="m_leak_date",
    )

    filters = query["query"]["function_score"]["query"]["bool"]["filter"]
    url_filter = filters[-1]["bool"]["should"]
    term_values = [list(item["term"].values())[0] for item in url_filter if "term" in item]
    assert "http://example.com" in term_values
    assert "https://example.com/" in term_values


def test_build_query_block_semantic_enabled_uses_knn(monkeypatch):
    from orion.helper_manager.env_handler import env_handler
    from orion.services.elastic_manager.elastic_semantic_controller import elastic_semantic_controller

    class _FakeSemantic:
        def embed_query_sync(self, _):
            return [0.1, 0.2, 0.3]

    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda *_: "1")))
    monkeypatch.setattr(elastic_semantic_controller, "get_instance", staticmethod(lambda: _FakeSemantic()))

    query = elastic_request_generator._build_query_block(
        p_query_model=_model(matchtype="semantic", q="semantic phrase"),
        pfilter={"m_email": ["a@example.com"]},
        raw_query="semantic phrase",
        quoted_value=False,
        exact_phrases=[],
        loose_terms=["semantic", "phrase"],
        phrase_fields=[("m_title", 3), ("m_content", 1)],
        must_clauses=[],
        must_not_clause=[],
        m_page_number=1,
        date_field="m_leak_date",
    )

    fs = query["query"]["function_score"]
    assert "knn" in fs["query"]
    assert "script_score" in fs
    assert query["min_score"] == 0.4


def test_semantic_controller_init_embed_and_enrich_paths(monkeypatch):
    import orion.services.elastic_manager.elastic_semantic_controller as semantic_module
    from orion.helper_manager.env_handler import env_handler
    from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_SEMANTIC
    from orion.services.elastic_manager.elastic_semantic_controller import elastic_semantic_controller

    class _Indices:
        def __init__(self):
            self.put_calls = []

        async def get_mapping(self, index):
            if index == "already-indexed":
                return {index: {"mappings": {"properties": {ELASTIC_SEMANTIC.S_EMBED_FIELD: {"type": "dense_vector"}}}}}
            return {index: {"mappings": {"properties": {}}}}

        async def put_mapping(self, index, body):
            self.put_calls.append((index, body))

    class _Conn:
        def __init__(self):
            self.indices = _Indices()
            self.closed = False

        async def close(self):
            self.closed = True

    class _AsyncResp:
        def raise_for_status(self):
            return None

        def json(self):
            return {"result": {"embeddings": [[0.1, 0.2, 0.3], [0.9, 0.8, 0.7]]}}

    class _AsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json):
            return _AsyncResp()

    class _SyncResp(_AsyncResp):
        def json(self):
            return {"result": {"embedding": [0.4, 0.5, 0.6]}}

    class _SyncClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, json):
            return _SyncResp()

    conn = _Conn()
    ctrl = elastic_semantic_controller()

    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda *_: "http://embed.test")))
    monkeypatch.setattr(semantic_module.httpx, "AsyncClient", _AsyncClient)
    monkeypatch.setattr(semantic_module.httpx, "Client", _SyncClient)

    asyncio.run(ctrl.init(conn, ["already-indexed", "needs-index"]))
    assert ctrl.get_connection() is conn
    assert len(conn.indices.put_calls) == 1
    assert conn.indices.put_calls[0][0] == "needs-index"

    assert asyncio.run(ctrl.embed_query("hello")) == [0.1, 0.2, 0.3]
    assert elastic_semantic_controller.embed_query_sync("hello") == [0.4, 0.5, 0.6]
    assert asyncio.run(ctrl.compute_vec({"m_title": "A", "m_important_content": "B", "m_content": "C"})) == [0.1, 0.2, 0.3]
    assert asyncio.run(ctrl.compute_vec({"m_title": " ", "m_content": ""})) is None

    single = {ELASTIC_KEYS.S_VALUE: {"m_title": "Doc"}}
    enriched_single = asyncio.run(ctrl.enrich_for_semantic(single))
    assert ELASTIC_SEMANTIC.S_EMBED_FIELD in enriched_single[ELASTIC_KEYS.S_VALUE]

    batch = [{ELASTIC_KEYS.S_VALUE: {"m_title": "One"}}, {ELASTIC_KEYS.S_VALUE: {"m_title": "Two"}}]
    enriched_batch = asyncio.run(ctrl.enrich_for_semantic(batch))
    assert all(ELASTIC_SEMANTIC.S_EMBED_FIELD in item[ELASTIC_KEYS.S_VALUE] for item in enriched_batch)

    asyncio.run(ctrl.close())
    assert conn.closed is True


def test_semantic_controller_embed_and_enrich_raise_on_bad_payload(monkeypatch):
    import orion.services.elastic_manager.elastic_semantic_controller as semantic_module
    from orion.helper_manager.env_handler import env_handler
    from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS
    from orion.services.elastic_manager.elastic_semantic_controller import elastic_semantic_controller

    class _BadAsyncResp:
        def raise_for_status(self):
            return None

        def json(self):
            return {"result": {}}

    class _BadAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json):
            return _BadAsyncResp()

    class _BadSyncResp(_BadAsyncResp):
        pass

    class _BadSyncClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, json):
            return _BadSyncResp()

    ctrl = elastic_semantic_controller()
    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda *_: "http://embed.test")))
    monkeypatch.setattr(semantic_module.httpx, "AsyncClient", _BadAsyncClient)
    monkeypatch.setattr(semantic_module.httpx, "Client", _BadSyncClient)

    with pytest.raises(Exception):
        asyncio.run(ctrl.embed_query("hello"))
    with pytest.raises(Exception):
        elastic_semantic_controller.embed_query_sync("hello")

    async def _explode(_doc):
        raise RuntimeError("boom")

    monkeypatch.setattr(ctrl, "compute_vec", _explode)
    with pytest.raises(RuntimeError):
        asyncio.run(ctrl.enrich_for_semantic({ELASTIC_KEYS.S_VALUE: {"m_title": "Doc"}}))
