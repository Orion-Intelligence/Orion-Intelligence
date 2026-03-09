from __future__ import annotations

from types import SimpleNamespace

from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import (
    search_consolidated_param_model,
)
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import (
    search_credential_param_model,
)
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator


def test_consolidated_ranked_data_and_iocs_queries_smoke():
    gen = elastic_request_generator()
    model = search_consolidated_param_model(
        q='("alpha" AND beta) OR gamma',
        category="all",
        page=2,
        network="all",
        content="all",
    )

    indices, query, boosts = gen.on_search_consolidated_ranked_data(
        model,
        pfilter={"m_email": ["a@example.com"], "m_url": ["example.com"]},
        base_index=["generic_model", "leak_model"],
        blocked_categories=["tracking"],
        allowed_categories=["leaks", "news"],
    )
    assert indices
    assert isinstance(query, dict)
    assert isinstance(boosts, list)
    assert "query" in query

    indices2, query2, boosts2 = gen.on_search_consolidated_iocs(
        model,
        pfilter={"m_ip": ["1.1.1.1"], "m_domain": ["example.org"]},
        base_index=["generic_model", "social_model"],
    )
    assert indices2
    assert isinstance(query2, dict)
    assert isinstance(boosts2, list)


def test_stealer_query_builders_cover_match_all_and_tagged_logic():
    q_all = search_credential_param_model(ioc="", page=1)
    index_all, body_all = elastic_request_generator.on_search_stealer_iocs(q_all)
    assert index_all
    assert body_all["query"]["bool"]["must"][0] == {"match_all": {}}

    q_tagged = search_credential_param_model(ioc="m_email:test@example.com", page=1, daterange="2026-01-01,2026-01-31")
    index_tagged, body_tagged = elastic_request_generator.on_search_stealer_iocs(q_tagged)
    assert index_tagged
    assert body_tagged["query"]["bool"]["must"]
    assert body_tagged["query"]["bool"]["filter"]

    index_logs, body_logs = elastic_request_generator.on_search_stealerlogs_data(
        search_credential_param_model(q="alice", type="c", page=1),
        pFilter={"m_email": ["alice@example.com"]},
        consolidated=False,
        alert=False,
    )
    assert index_logs
    assert isinstance(body_logs, dict)
    assert "query" in body_logs


def test_index_query_helpers_cover_all_major_indexers():
    now_general = elastic_request_generator.index_query_general(
        {"m_important_content": "imp", "m_title": "title", "m_url": "https://x"}
    )
    assert len(now_general) == 1

    chat_bulk = elastic_request_generator.index_query_chat({"m_chat_data": [{"m_message_id": "m1"}]})
    assert len(chat_bulk) == 1

    social_bulk = elastic_request_generator.index_query_social({"cards_data": [{"m_message_id": "s1", "m_channel_url": "https://x"}]})
    assert len(social_bulk) == 1

    sanctions_bulk = elastic_request_generator.index_query_sanctions([{"id": "1", "schema_name": "Person"}])
    assert len(sanctions_bulk) == 1

    stealer_bulk = elastic_request_generator.index_query_stealerlog({"logs": [{"m_hash": "h1", "raw": "x"}]})
    assert len(stealer_bulk) == 2

    defacement_bulk = elastic_request_generator.index_query_defacement({"cards_data": [{"m_url": "https://x"}]})
    assert len(defacement_bulk) == 1

    leak_bulk = elastic_request_generator.index_query_leak({"contact_link": "", "cards_data": [{"m_url": "https://x", "m_title": "t", "m_base_url": "https://x"}]})
    assert len(leak_bulk) == 1

    exploit_bulk = elastic_request_generator.index_query_exploit({"contact_link": "", "cards_data": [{"m_url": "https://x", "m_title": "t", "m_base_url": "https://x"}]})
    assert len(exploit_bulk) == 1


def test_misc_generators_and_lookup_queries():
    m = SimpleNamespace(q="example.com test.org", daterange="")
    index, query = elastic_request_generator.on_bulk_domain_lookup(m, {"m_url": ["site.com"]})
    assert index
    assert isinstance(query, dict)

    expire_query = elastic_request_generator.clear_expire_index()
    assert "query" in expire_query

    assert isinstance(elastic_request_generator.generate_graph_queries(), list)
    assert isinstance(elastic_request_generator.generate_insight_queries(), list)
