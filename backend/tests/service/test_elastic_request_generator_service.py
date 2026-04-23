from __future__ import annotations

from types import SimpleNamespace

from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_KEYS
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator


def test_build_es_from_tagged_and_ioc_filters_cover_domain_and_match_none():
    query = elastic_request_generator.build_es_from_tagged(
        {"OR": [{"tag": "m_domain", "value": "example.com"}, {"tag": "unknown", "value": "x"}]},
        {"m_domain": ["m_domain"], "source_domain": ["source_domain"]},
    )
    filters = elastic_request_generator.build_ioc_filter_clauses(
        {"m_email": ["alice@example.com"], "m_search_all": ["example.com"]}
    )

    assert "should" in query["bool"]
    assert {"match_none": {}} in query["bool"]["should"]
    assert filters


def test_query_block_supports_match_all_and_semantic_knn(monkeypatch):
    semantic = SimpleNamespace(embed_query_sync=lambda _query: [0.1, 0.2, 0.3])
    monkeypatch.setattr(
        "orion.services.elastic_manager.elastic_request_generator.env_handler.get_instance",
        staticmethod(lambda: SimpleNamespace(env=lambda key, default=None: "1" if key == "SEMANTIC_ENABLED" else default)),
    )
    monkeypatch.setattr(
        "orion.services.elastic_manager.elastic_request_generator.elastic_semantic_controller.get_instance",
        staticmethod(lambda: semantic),
    )

    match_all_query = elastic_request_generator._build_query_block(
        p_query_model=SimpleNamespace(matchtype="or", q="*", must=False),
        pfilter={},
        raw_query="*",
        quoted_value=False,
        exact_phrases=[],
        loose_terms=[],
        phrase_fields=[("m_title", 3)],
        must_clauses=[],
        must_not_clause=[],
        m_page_number=1,
        date_boost_fields=[("m_creation_date", 0.1)],
    )
    semantic_query = elastic_request_generator._build_query_block(
        p_query_model=SimpleNamespace(matchtype="semantic", q="alpha beta", must=False),
        pfilter={"m_email": ["alice@example.com"]},
        raw_query="alpha beta",
        quoted_value=False,
        exact_phrases=[],
        loose_terms=["alpha", "beta"],
        phrase_fields=[("m_title", 3)],
        must_clauses=[],
        must_not_clause=[],
        m_page_number=1,
        date_boost_fields=[("m_creation_date", 0.1)],
    )

    assert match_all_query["query"]["function_score"]["query"]["bool"]["must"][0] == {"match_all": {}}
    assert "knn" in semantic_query["query"]["function_score"]["query"]


def test_date_filters_and_bulk_lookup_include_expected_ranges():
    date_filter = elastic_request_generator.build_date_filter("2026-01-01", "2026-01-31", ["m_leak_date"])
    priority_filter = elastic_request_generator.build_date_priority_filter(
        "2026-01-01T00:00:00+00:00",
        "2026-01-31T23:59:59+00:00",
        ["m_leak_date", "m_update_date"],
    )
    index_name, query = elastic_request_generator.on_bulk_domain_lookup(
        SimpleNamespace(q="visit example.com", daterange="2026-01-01,2026-01-02"),
        {"m_domain": ["alpha.test"]},
    )

    assert date_filter["bool"]["should"][0]["bool"]["filter"][1]["range"]["m_leak_date"]["gte"] == "2026-01-01"
    assert priority_filter["bool"]["should"][1]["bool"]["must_not"]
    assert index_name == ELASTIC_INDEX.S_DEFACEMENT_INDEX
    assert "domain_0" in query["aggs"]


def test_consolidated_and_stealer_queries_build_clean_outputs():
    generator = elastic_request_generator()
    ranked = generator.on_search_consolidated_ranked_data(
        SimpleNamespace(
            q="alpha beta",
            matchtype="full",
            daterange="2026-01-01,2026-01-31",
            network="telegram",
            page=2,
            content="all",
            platform="",
            safe=True,
            category="leaks",
            must=False,
        ),
        {"m_url": ["example.com"]},
        [ELASTIC_INDEX.S_LEAK_INDEX],
        blocked_categories=["adult"],
        allowed_categories=["leaks"],
    )
    stealer_doc, stealer_query = elastic_request_generator.on_search_stealerlogs_data(
        SimpleNamespace(q="alice@example.com example.com", user=None, url=None, page=1, size=10, category="logs", entity_filter={}),
        {"m_username": ["alice"], "m_domain": ["example.com"]},
    )
    ioc_doc, ioc_query = elastic_request_generator.on_search_stealer_iocs(
        SimpleNamespace(ioc="m_email:alice@example.com", daterange="2026-01-01,2026-01-10", page=1, size=None)
    )

    assert ranked[0] == [ELASTIC_INDEX.S_LEAK_INDEX]
    assert ranked[1]["from"] == 15
    assert stealer_doc == ELASTIC_INDEX.S_STEALERLOGS_INDEX
    assert stealer_query["query"]["bool"]["must"]
    assert ioc_doc == ELASTIC_INDEX.S_STEALERLOGS_INDEX
    assert ioc_query["query"]["bool"]["filter"]


def test_index_queries_and_summary_queries_return_entries():
    general_entries = elastic_request_generator.index_query_general(
        {"m_important_content": "important", "m_title": "Doc", "m_url": "https://example.com"}
    )
    sanctions_entries = elastic_request_generator.index_query_sanctions({"id": "entity-1", "schema_name": "Person"})
    social_entries = elastic_request_generator.index_query_social({"cards_data": [{"m_title": "Post", "m_channel_url": "https://t.me/x"}]})
    graph_queries = elastic_request_generator.generate_graph_queries()
    insight_queries = elastic_request_generator.generate_insight_queries()
    expired_query = elastic_request_generator.clear_expire_index()

    assert general_entries[0][ELASTIC_KEYS.S_DOCUMENT] == ELASTIC_INDEX.S_GENERIC_INDEX
    assert sanctions_entries[0][ELASTIC_KEYS.S_VALUE]["schema"] == "Person"
    assert social_entries[0][ELASTIC_KEYS.S_DOCUMENT] == ELASTIC_INDEX.S_SOCIAL_INDEX
    assert graph_queries and insight_queries
    assert "m_update_date" in expired_query["query"]["range"]
