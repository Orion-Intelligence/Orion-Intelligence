from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import (
    search_consolidated_param_model,
)
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import (
    PasswordFilterModel,
    search_credential_param_model,
)
from orion.api.interactive.search_manager.search_model import search_model
from orion.helper_manager.env_handler import env_handler
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from tests.fake_model.fakes import FakeElastic


def _run(coro):
    return asyncio.run(coro)


def _hit(source: dict, *, index: str = "test-index", score: float = 1.0, doc_id: str = "doc-1") -> dict:
    return {
        "_id": doc_id,
        "_index": index,
        "_score": score,
        "_source": source,
    }


def _search_response(*hits: dict, total: int | None = None) -> dict:
    return {
        "hits": {
            "hits": list(hits),
            "total": {"value": len(hits) if total is None else total},
        }
    }


@pytest.fixture
def fake_elastic(monkeypatch):
    fake = FakeElastic()
    monkeypatch.setattr(
        "orion.services.elastic_manager.elastic_controller.elastic_controller.get_instance",
        staticmethod(lambda: fake),
    )
    monkeypatch.setattr(
        env_handler,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(env=lambda key, default=None: "0" if key == "SEMANTIC_ENABLED" else default)),
    )
    return fake


def test_search_wanted_list_builds_query_and_returns_cards(fake_elastic):
    fake_elastic.search_query_result = (
        True,
        _search_response(
            _hit({"name": "John Doe", "caption": "listed target"}, index=ELASTIC_INDEX.S_OPENSANCTIONS_INDEX),
            total=1,
        ),
    )
    payload = SimpleNamespace(text={"query": "John Doe"})

    result = _run(search_model.search_wanted_list(payload))

    assert result == {
        "cards_data": [{"name": "John Doe", "caption": "listed target"}],
        "total": 1,
    }
    document, query = fake_elastic.search_query_calls[0]
    assert document == ELASTIC_INDEX.S_OPENSANCTIONS_INDEX
    should = query["query"]["bool"]["should"]
    assert any("caption" in clause["match"] for clause in should)
    assert any("name" in clause["match"] for clause in should)
    assert query["sort"][0] == {"_score": {"order": "desc"}}


def test_request_general_doc_fetches_document_and_translates_selected_fields(fake_elastic, monkeypatch):
    fake_elastic.get_doc_result = [{
        "m_title": "Doc",
        "m_url": "https://example.com/",
        "m_base_url": "https://example.com/",
        "m_content": "content",
        "m_important_content": "important",
        "m_content_type": "general",
        "m_update_date": datetime.now(timezone.utc),
        "m_creation_date": datetime.now(timezone.utc),
        "m_embedding": [1, 2, 3],
    }]
    translations = []
    monkeypatch.setattr(
        "orion.helper_manager.helper_controller.helper_controller.detect_and_translate",
        staticmethod(lambda text, target_lang: translations.append((text, target_lang)) or f"{target_lang}:{text}"),
    )

    result = _run(search_model().request_general_doc("doc-1", "ur"))

    assert fake_elastic.get_doc_calls == [(ELASTIC_INDEX.S_GENERIC_INDEX, "doc-1")]
    assert result["m_content"] == "ur:content"
    assert result["m_important_content"] == "ur:important"
    assert "m_embedding" not in result
    assert translations == [("content", "ur"), ("important", "ur")]


def test_search_consolidated_ranked_result_uses_real_generator_and_passes_built_query(fake_elastic):
    fake_elastic.search_consolidated_result = _search_response(
        _hit({"m_title": "Leak", "m_content": "body", "m_content_type": ["leaks"]}, index=ELASTIC_INDEX.S_LEAK_INDEX, score=5.0),
        total=1,
    )
    param = search_consolidated_param_model(
        q="alpha beta",
        matchtype="full",
        page=2,
        network="telegram",
        safe=True,
        daterange="2026-01-01,2026-01-31",
        entity_filter={"m_url": ["example.com"]},
    )

    result = _run(
        search_model.search_consolidated_ranked_result(
            param,
            [ELASTIC_INDEX.S_LEAK_INDEX],
            blocked_categories=["news"],
            allowed_categories=["leaks"],
        )
    )

    assert result["Total_Hits"] == 1
    assert result["Page_Count"] == 1
    assert result["Result"][0]["rank_index"] == ELASTIC_INDEX.S_LEAK_INDEX

    indices, query, indices_boost = fake_elastic.search_consolidated_calls[0]
    assert indices == [ELASTIC_INDEX.S_LEAK_INDEX]
    assert indices_boost == [{ELASTIC_INDEX.S_LEAK_INDEX: 2}]
    filters = query["query"]["function_score"]["query"]["bool"]["filter"]
    assert any("range" in clause["bool"]["should"][0]["bool"]["filter"][1] for clause in filters if "bool" in clause and "should" in clause["bool"])
    assert any(clause == {"term": {"m_network": "telegram"}} for clause in filters)
    assert any("m_url.raw" in str(clause) for clause in filters)
    must_not = query["query"]["function_score"]["query"]["bool"]["must_not"]
    assert {"term": {"m_content_type": "adult"}} in must_not
    assert query["from"] == 15
    assert query["size"] == 15


def test_search_consolidated_iocs_builds_ioc_logic_and_returns_ranked_results(fake_elastic):
    fake_elastic.search_consolidated_result = _search_response(
        _hit({"m_title": "IOC", "m_content": "body", "m_content_type": ["leaks"]}, index=ELASTIC_INDEX.S_LEAK_INDEX),
        total=3,
    )
    param = search_consolidated_param_model(
        ioc="m_email:test@example.com AND m_domain:example.com",
        daterange="2026-02-01,2026-02-10",
        page=1,
    )

    result = _run(search_model.search_consolidated_iocs(param, [ELASTIC_INDEX.S_LEAK_INDEX]))

    assert result["Total_Hits"] == 3
    indices, query, _indices_boost = fake_elastic.search_consolidated_calls[0]
    assert indices == [ELASTIC_INDEX.S_LEAK_INDEX]
    filters = query["query"]["function_score"]["query"]["bool"]["filter"]
    assert any("m_email" in str(clause) and "m_domain" in str(clause) for clause in filters)
    assert any("m_message_date" in str(clause) or "m_leak_date" in str(clause) for clause in filters)


def test_search_stealerlogs_result_normalizes_mapping_and_preserves_page(fake_elastic):
    fake_elastic.search_query_result = (
        True,
        _search_response(
            _hit(
                {
                    "type": "credential",
                    "channel": "telegram",
                    "mapping": ["email:foo{}", "domain:bar{}"],
                },
                index=ELASTIC_INDEX.S_STEALERLOGS_INDEX,
                doc_id="cred-1",
            ),
            total=1,
        ),
    )
    model = search_model()
    param = search_credential_param_model(q="alice@example.com", category="all", page=2)

    result = _run(model.search_stealerlogs_result(param))

    assert result.Result[0].model_dump()["_id"] == "cred-1"
    assert result.Result[0].mapping == ["email", "domain"]
    assert result.Page_Count == 2
    document, query = fake_elastic.search_query_calls[0]
    assert document == ELASTIC_INDEX.S_STEALERLOGS_INDEX
    assert query["size"] >= 1


def test_search_stealer_iocs_applies_password_schema_after_real_query_build(fake_elastic):
    fake_elastic.search_query_result = (
        True,
        _search_response(
            _hit({"password": "abc123!", "channel": "telegram"}, index=ELASTIC_INDEX.S_STEALERLOGS_INDEX, doc_id="good"),
            _hit({"password": "abcdef", "channel": "telegram"}, index=ELASTIC_INDEX.S_STEALERLOGS_INDEX, doc_id="bad"),
            total=2,
        ),
    )
    model = search_model()
    param = search_credential_param_model(
        ioc="m_email:test@example.com",
        page=1,
        password_schema=PasswordFilterModel(
            minLength=6,
            hasNumbers=True,
            hasSpecialChars=True,
        ),
    )

    result = _run(model.search_stealer_iocs(param))

    assert [item.model_dump()["password"] for item in result.Result] == ["abc123!"]
    assert result.Page_Count == 1
    document, query = fake_elastic.search_query_calls[0]
    assert document == ELASTIC_INDEX.S_STEALERLOGS_INDEX
    assert "m_emails" in str(query) or "email" in str(query)
