from __future__ import annotations

from types import SimpleNamespace

from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator


def _model(matchtype="or", q="test"):
    return SimpleNamespace(matchtype=matchtype, q=q, must=False)


def test_build_ioc_filter_clauses_handles_search_all_and_specific_keys():
    clauses = elastic_request_generator.build_ioc_filter_clauses(
        {
            "m_search_all": ["example.com"],
            "m_email": ["a@example.com"],
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
