from __future__ import annotations

import asyncio
import json
from types import SimpleNamespace

import pytest
from cryptography.fernet import Fernet
from fastapi import HTTPException

from orion.api.interactive.account_manager.account_manager import AccountManager
from orion.api.interactive.hompage_manager.homepage_model import homepage_model
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.management.jobs.insight_job import insight_job
from orion.management.models.insight_model import InsightData
from orion.management.models.insight_model_comparison import InsightComparisonModel
from orion.constants.constant import CONSTANTS


def test_tenant_manager_validators_and_helpers():
    assert TenantManager.get_email_domain("A@Example.COM") == "example.com"
    assert TenantManager.get_company_from_email("john@genesis.org") == "genesis"

    TenantManager.validate_signup_username("AlphaUser_1")
    TenantManager.validate_tenant_username("team_12")
    TenantManager.validate_signup_email("a@example.com")
    TenantManager.validate_tenant_email("a@example.com", role="member")

    with pytest.raises(HTTPException):
        TenantManager.validate_signup_username("x")
    with pytest.raises(HTTPException):
        TenantManager.validate_tenant_email("bad-email", role="member")


def test_account_manager_safe_decrypt_and_create_tenant_user():
    mgr = object.__new__(AccountManager)
    key = Fernet.generate_key()
    enc = Fernet(key)
    cipher = enc.encrypt(b"hello").decode()
    assert mgr.safe_decrypt(enc, cipher) == "hello"
    assert mgr.safe_decrypt(enc, "broken") == ""
    assert mgr.safe_decrypt(enc, None) == ""

    plain = asyncio.run(mgr.create_tenant_user(existing_user=None, existing_mail=None, password="StrongPass123!"))
    assert plain
    assert plain != "StrongPass123!"

    already_hash = CONSTANTS.S_AUTH_PWD_CONTEXT.hash("AlreadyHashed123!")
    out = asyncio.run(mgr.create_tenant_user(existing_user=None, existing_mail=None, password=already_hash))
    assert out == already_hash

    with pytest.raises(HTTPException):
        asyncio.run(mgr.create_tenant_user(existing_user=True, existing_mail=None, password="x"))


def test_homepage_static_helpers_and_country_paths(monkeypatch):
    assert homepage_model.parse_date_fallback("2026-01-10") == "January 10, 2026"
    assert homepage_model.parse_date_fallback("bad") is None
    assert homepage_model._country_matches(["US, CA", "PK"], "ca") is True
    assert homepage_model._country_matches("PK,IN", "pk") is True
    assert homepage_model._country_only_payload({"m_country": "US", "m_hash": "h1"}) == {"m_country": ["US"], "m_hash": "h1"}

    fake_insights = {
        "leak": [{"m_hash": "h1", "m_country": ["US"]}],
        "generic": [],
        "exploit": [],
        "chat": [],
        "social": [],
        "defacement": [],
    }
    monkeypatch.setattr(homepage_model, "get_country_specific_insights", staticmethod(lambda: asyncio.sleep(0, result=fake_insights)))
    out = asyncio.run(homepage_model.get_country_specific_insights_paginated("leak", "us", page=1, limit=10))
    assert out["total"] == 1
    assert out["items"]


def test_insight_job_population_math():
    old_daily = InsightData()
    old_weekly = InsightData()
    new_data = InsightData()

    comparison = insight_job.populate_comparison_model(old_daily, new_data, old_weekly)
    assert isinstance(comparison, InsightComparisonModel)
    assert comparison.general.document_count.key


def test_crawl_model_http_paths(monkeypatch):
    class _Resp:
        def __init__(self, status_code=200, payload=None):
            self.status_code = status_code
            self._payload = payload or {"ok": True}

        def json(self):
            return self._payload

        def raise_for_status(self):
            if self.status_code >= 400:
                raise RuntimeError("bad")

    class _Client:
        def __init__(self, *_args, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        async def post(self, *_args, **_kwargs):
            return _Resp(200, {"status": "ok"})

    import httpx

    monkeypatch.setattr(httpx, "AsyncClient", _Client)

    m = SimpleNamespace(model_dump=lambda: {"x": 1}, data="abc")
    assert asyncio.run(crawl_model.scan_domain(m))["status"] == "ok"
    assert asyncio.run(crawl_model.scan_ip(m))["status"] == "ok"
    assert asyncio.run(crawl_model.scrape_social(m))["status"] == "ok"
    assert asyncio.run(crawl_model.ioc_extract(m))["status"] == "ok"
    assert asyncio.run(crawl_model.parse_chat(m))["status"] == "ok"
    assert asyncio.run(crawl_model.parse_summarize_ai(m))["status"] == "ok"

    report = SimpleNamespace(model_dump=lambda: {"text": "x"})
    assert asyncio.run(crawl_model.parse_chat_ai(report))["status"] == "ok"


def test_homepage_invoke_analytics_and_country_cache(monkeypatch):
    from orion.services.redis_manager import redis_controller as rc
    from orion.services.elastic_manager import elastic_controller as ec
    from orion.services.elastic_manager.elastic_insight_generator import elastic_insight_generator

    insight_json = InsightComparisonModel().model_dump_json()

    class _Redis:
        async def invoke_trigger(self, command, payload):
            if "country_v1" in payload[0]:
                return json.dumps({"leak": [], "generic": [], "exploit": [], "chat": [], "social": [], "defacement": []})
            return insight_json

    class _Elastic:
        async def search_consolidated_queries(self, *_):
            return []

    class _Gen:
        def on_insight_consolidated_country(self):
            return [], {}

    monkeypatch.setattr(rc.redis_controller, "getInstance", staticmethod(lambda: _Redis()))
    monkeypatch.setattr(ec.elastic_controller, "get_instance", staticmethod(lambda: _Elastic()))
    monkeypatch.setattr(elastic_insight_generator, "__call__", lambda self: self)
    monkeypatch.setattr(elastic_insight_generator, "on_insight_consolidated_country", _Gen.on_insight_consolidated_country)

    out = asyncio.run(homepage_model.invoke_analytics())
    assert out is not None
    grouped = asyncio.run(homepage_model.get_country_specific_insights())
    assert "leak" in grouped
