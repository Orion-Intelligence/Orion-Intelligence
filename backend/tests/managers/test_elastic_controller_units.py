from __future__ import annotations

import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_KEYS


class _FakeConn:
    def __init__(self, search_result=None, exists_result=False, raise_on_search=False, get_result=None, raise_on_bulk=False):
        self.search_result = search_result if search_result is not None else {"hits": {"hits": []}}
        self.exists_result = exists_result
        self.raise_on_search = raise_on_search
        self.raise_on_bulk = raise_on_bulk
        self.get_result = get_result if get_result is not None else {"_source": {"m_hash": "x"}}
        self.search_calls = []
        self.update_calls = []
        self.get_calls = []
        self.bulk_calls = []

    async def search(self, **kwargs):
        self.search_calls.append(kwargs)
        if self.raise_on_search:
            raise RuntimeError("search failed")
        return self.search_result

    async def exists(self, **kwargs):
        return self.exists_result

    async def update(self, **kwargs):
        self.update_calls.append(kwargs)
        return {"result": "updated"}

    async def get(self, **kwargs):
        self.get_calls.append(kwargs)
        return self.get_result

    async def bulk(self, **kwargs):
        self.bulk_calls.append(kwargs)
        if self.raise_on_bulk:
            raise RuntimeError("bulk failed")
        return {"errors": False}


def _set_connections(ctrl, core, dump):
    ctrl._elastic_controller__m_core_connection = core
    ctrl._elastic_controller__m_dump_connection = dump


def test_read_index_maps_stealer_alias():
    assert elastic_controller._read_index(ELASTIC_INDEX.S_STEALERLOGS_INDEX) == "stealer_model,stealer_model-*"
    assert elastic_controller._read_index(ELASTIC_INDEX.S_LEAK_INDEX) == ELASTIC_INDEX.S_LEAK_INDEX


def test_search_consolidated_ranked_query_applies_case_insensitive_and_routes_to_dump():
    controller = elastic_controller()
    core = _FakeConn()
    dump = _FakeConn(search_result={"hits": {"hits": [{"_score": 1.5}]}})
    _set_connections(controller, core, dump)

    query = {"query": {"bool": {"filter": [{"term": {"m_email": "A@EXAMPLE.COM"}}]}}}
    result = asyncio.run(
        controller.search_consolidated_ranked_query([ELASTIC_INDEX.S_STEALERLOGS_INDEX], query, indices_boost=[{"x": 1}])
    )

    assert result["hits"]["hits"][0]["_score"] == 1.5
    sent_query = dump.search_calls[0]["body"]
    term_spec = sent_query["query"]["bool"]["filter"][0]["term"]["m_email"]
    assert term_spec["value"] == "A@EXAMPLE.COM"
    assert term_spec["case_insensitive"] is True
    assert sent_query["indices_boost"] == [{"x": 1}]


def test_search_consolidated_ranked_query_merges_mixed_indices_by_score():
    controller = elastic_controller()
    core = _FakeConn(search_result={"hits": {"hits": [{"_id": "core", "_score": 0.5}]}})
    dump = _FakeConn(search_result={"hits": {"hits": [{"_id": "dump", "_score": 0.9}]}})
    _set_connections(controller, core, dump)

    query = {"query": {"match_all": {}}}
    result = asyncio.run(
        controller.search_consolidated_ranked_query([ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_INDEX.S_STEALERLOGS_INDEX], query)
    )

    hits = result["hits"]["hits"]
    assert [h["_id"] for h in hits] == ["dump", "core"]
    assert core.search_calls and dump.search_calls


def test_search_consolidated_ranked_query_returns_none_on_exception():
    controller = elastic_controller()
    core = _FakeConn()
    dump = _FakeConn(raise_on_search=True)
    _set_connections(controller, core, dump)

    query = {"query": {"match_all": {}}}
    result = asyncio.run(controller.search_consolidated_ranked_query([ELASTIC_INDEX.S_STEALERLOGS_INDEX], query))
    assert result is None


def test_index_data_single_missing_embedding_rejected_for_new_non_chat(monkeypatch):
    from orion.helper_manager.env_handler import env_handler

    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda *_: "1")))

    controller = elastic_controller()
    core = _FakeConn(exists_result=False)
    dump = _FakeConn()
    _set_connections(controller, core, dump)

    ok, err = asyncio.run(
        controller.index_data(
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_VALUE: {"m_hash": "h1", "m_title": "x"},
            }
        )
    )
    assert ok is False
    assert "m_embedding" in err


def test_index_data_single_chat_allows_missing_embedding(monkeypatch):
    from orion.helper_manager.env_handler import env_handler

    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda *_: "1")))

    controller = elastic_controller()
    core = _FakeConn(exists_result=False)
    dump = _FakeConn()
    _set_connections(controller, core, dump)

    ok, err = asyncio.run(
        controller.index_data(
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX,
                ELASTIC_KEYS.S_VALUE: {"m_hash": "h2", "m_title": "chat"},
            }
        )
    )
    assert ok is True
    assert err is None
    assert core.update_calls


def test_get_doc_returns_empty_when_source_missing():
    controller = elastic_controller()
    core = _FakeConn(get_result={})
    dump = _FakeConn()
    _set_connections(controller, core, dump)

    out = asyncio.run(controller.get_doc(ELASTIC_INDEX.S_LEAK_INDEX, "doc-1"))
    assert out == []


def test_search_query_returns_false_on_exception():
    controller = elastic_controller()
    core = _FakeConn(raise_on_search=True)
    dump = _FakeConn()
    _set_connections(controller, core, dump)

    ok, err = asyncio.run(controller.search_query(ELASTIC_INDEX.S_LEAK_INDEX, {"query": {"match_all": {}}}))
    assert ok is False
    assert "search failed" in err


def test_search_consolidated_queries_keeps_position_on_partial_failure(monkeypatch):
    from orion.helper_manager.env_handler import env_handler

    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda *_: "1")))
    controller = elastic_controller()
    core = _FakeConn(search_result={"hits": {"hits": [{"_id": "ok"}]}})
    dump = _FakeConn(raise_on_search=True)
    _set_connections(controller, core, dump)

    indices = [ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_INDEX.S_STEALERLOGS_INDEX]
    queries = [{"query": {"match_all": {}}}, {"query": {"match_all": {}}}]
    out = asyncio.run(controller.search_consolidated_queries(indices, queries))

    assert out[0]["hits"]["hits"][0]["_id"] == "ok"
    assert out[1] is None


def test_index_data_list_skips_missing_hash_and_empty_embedding(monkeypatch):
    from orion.helper_manager.env_handler import env_handler

    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda *_: "1")))
    controller = elastic_controller()
    core = _FakeConn(exists_result=False)
    dump = _FakeConn()
    _set_connections(controller, core, dump)

    ok, err = asyncio.run(
        controller.index_data(
            [
                {
                    ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                    ELASTIC_KEYS.S_VALUE: {"m_title": "no hash"},
                },
                {
                    ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                    ELASTIC_KEYS.S_VALUE: {"m_hash": "h-empty", "m_embedding": []},
                },
                {
                    ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                    ELASTIC_KEYS.S_VALUE: {"m_hash": "h-ok", "m_embedding": [0.1], "m_tags": ["a", "null"]},
                },
            ]
        )
    )

    assert ok is True
    assert err is None
    assert len(core.update_calls) == 1
    saved_doc = core.update_calls[0]["body"]["doc"]
    assert saved_doc["m_hash"] == "h-ok"
    assert saved_doc["m_tags"] == ["a"]


def test_get_insight_maps_aggregations():
    controller = elastic_controller()

    class _FakeInsightGen:
        @staticmethod
        def generate_insight_queries():
            return [
                {
                    ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                    ELASTIC_KEYS.S_FILTER: {"query": {"match_all": {}}},
                },
                {
                    ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                    ELASTIC_KEYS.S_FILTER: {"query": {"match_all": {}}},
                },
            ]

    class _FakeInsightConn(_FakeConn):
        async def search(self, **kwargs):
            idx = kwargs.get("index")
            if idx == ELASTIC_INDEX.S_GENERIC_INDEX:
                return {
                    "aggregations": {
                        "Document Count": {"value": 3},
                        "Average Score": {"value": 1.2345},
                        "Common Type": {"buckets": [{"key": "news"}]},
                    }
                }
            return {
                "aggregations": {
                    "Document Count": {"value": 2},
                    "Most Recent": {"value": 1000},
                }
            }

    core = _FakeInsightConn()
    dump = _FakeInsightConn()
    _set_connections(controller, core, dump)
    controller._elastic_controller__m_elastic_request_generator = _FakeInsightGen()

    ok, data = asyncio.run(controller.get_insight())
    assert ok is True
    assert data.general.document_count == 3
    assert data.general.average_score == 1.23
    assert data.general.common_types == "News"
    assert data.leak.document_count == 2
    assert data.leak.most_recent == "01 Jan"


def test_index_dump_success():
    controller = elastic_controller()
    core = _FakeConn()
    dump = _FakeConn()
    _set_connections(controller, core, dump)

    payload = [{"index": {"_index": ELASTIC_INDEX.S_STEALERLOGS_INDEX}}, {"field": "value"}]
    out = asyncio.run(controller.index_dump(payload))
    assert out["errors"] is False
    assert dump.bulk_calls


def test_index_dump_raises_http_exception_on_failure():
    controller = elastic_controller()
    core = _FakeConn()
    dump = _FakeConn(raise_on_bulk=True)
    _set_connections(controller, core, dump)

    with pytest.raises(HTTPException) as ex:
        asyncio.run(controller.index_dump([{"index": {"_index": ELASTIC_INDEX.S_STEALERLOGS_INDEX}}]))
    assert ex.value.status_code == 500
