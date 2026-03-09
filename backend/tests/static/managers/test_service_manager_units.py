"""Coverage map: checklist items 151-168, 174-176."""

from __future__ import annotations

from dataclasses import replace
from types import SimpleNamespace
import asyncio
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator
from orion.services.stix_manager.stix_manager import stix_manager
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.management.managers.test_manager import test_manager


def test_search_build_ranked_response_has_page_and_scores():
    response = {
        "hits": {
            "total": {"value": 2},
            "hits": [
                {"_index": "leak_model", "_score": 1.1, "_source": {"m_hash": "a", "m_embedding": [1]}},
                {"_index": "social_model", "_score": 0.9, "_source": {"m_hash": "b"}},
            ],
        }
    }
    out = search_model._build_ranked_response(response, {"size": 1}, 10)
    assert out["Total_Hits"] == 2
    assert out["Page_Count"] == 2
    assert out["Result"][0]["_score"] == 1.1


def test_elastic_request_generator_tagged_logic_builds_query():
    parsed = helper_controller.parse_tagged_logic_query_for_iocs("m_email:test@example.com AND m_ip:1.1.1.1")
    query = elastic_request_generator.build_es_from_tagged(parsed, {"m_email": ["email.keyword"], "m_ip": ["ip.keyword"]})
    assert isinstance(query, dict)


def test_elastic_request_generator_match_modes_query_transform():
    assert helper_controller.transform_query_match("a b", "or") == "a b"
    assert helper_controller.transform_query_match("a b", "and") == '"a" "b"'
    assert helper_controller.transform_query_match("a b", "full") == '"a b"'


def test_entity_manager_normalize_and_sanitize_helpers():
    assert entity_manager._normalize_key("A B") == "a_b"
    assert entity_manager._sanitize("A/B C") == "ab_c"


def test_alert_manager_filter_alerts_by_license(monkeypatch):
    manager = AlertManager.getInstance()

    user = SimpleNamespace(licenses=["free"])
    alerts = [SimpleNamespace(type="breach"), SimpleNamespace(type="social")]

    # keep this deterministic for the unit-level behavior
    monkeypatch.setattr(AlertManager, "get_allowed_alert_types", staticmethod(lambda _: {"breach"}))

    filtered = manager.filter_alerts_by_license(alerts, user)
    assert len(filtered) == 1
    assert filtered[0].type == "breach"


def test_stix_manager_delegates_to_converter(monkeypatch):
    class _FakeSearch:
        async def request_leak_doc(self, doc_id, lang=None):
            return {"m_hash": "x", "m_title": "title", "m_url": "https://example.com", "m_content": "body", "m_content_type": ["news"]}

    class _FakeConverter:
        def convert(self, model):
            return {"type": "bundle", "id": "bundle--1"}

    sm = stix_manager.get_instance()
    monkeypatch.setattr(sm, "_search_model", _FakeSearch())
    monkeypatch.setitem(
        sm._SPECS,
        "leak",
        replace(
            sm._SPECS["leak"],
            fetch_method="request_leak_doc",
            converter_cls=_FakeConverter,
            missing_error="No leak document found",
            accepts_lang=True,
        ),
    )

    out = asyncio.run(sm.get_leak_stix("doc1"))
    assert out["type"] == "bundle"


def test_test_manager_fix_oid_and_date():
    tm = test_manager.get_instance()
    payload = {"_id": {"$oid": "507f1f77bcf86cd799439011"}, "ts": {"$date": "2026-03-01T00:00:00Z"}}
    fixed = tm._fix(payload)
    assert "_id" in fixed and "ts" in fixed


def test_test_manager_load_mocks_dirs_exist():
    from pathlib import Path

    base = Path(__file__).resolve().parents[3] / "static" / "test" / "mocks"
    assert (base / "mongo").exists()
    assert (base / "elastic").exists()
    assert (base / "arango").exists()
