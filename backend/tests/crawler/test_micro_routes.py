from __future__ import annotations

from types import SimpleNamespace
from typing import Any, cast

from configs import app_dependency
from configs import limiter_dependency as limiter_module
from routes.api_micros import micro_routes
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.services.mongo_manager.shared_model.db_auth_models import user_role


async def _allow_role():
    return user_role.ADMIN


async def _allow_user():
    return SimpleNamespace(id="u1", tenant_uuid="t1", role="admin", licenses=["maintainer"]) 


async def _no_limit():
    yield


class FakeMicroCrawl:
    async def parse_chat_ai(self, payload):
        return {"ok": True, "route": "nlp_chat_report", "session_id": payload.session_id}


async def _fake_cti_label(payload):
    return {"ok": True, "route": "cti_fetch", "data": payload.data}


def test_micro_cti_fetch(app_factory, client_factory, load_injection, monkeypatch):
    app = app_factory(micro_routes)
    app_any = cast(Any, app)
    app_any.dependency_overrides[app_dependency.get_current_role] = _allow_role
    app_any.dependency_overrides[app_dependency.get_current_user] = _allow_user
    app_any.dependency_overrides[limiter_module.limiter_dependency] = _no_limit

    monkeypatch.setattr(crawl_model, "fetch_cti_label", staticmethod(_fake_cti_label))

    client = client_factory(app)
    response = client.post("/api/cti/fetch", json=load_injection("cti_fetch.json"))
    assert response.status_code == 200
    assert response.json()["route"] == "cti_fetch"


def test_micro_nlp_chat_report(app_factory, client_factory, load_injection, monkeypatch):
    app = app_factory(micro_routes)
    app_any = cast(Any, app)
    app_any.dependency_overrides[app_dependency.get_current_role] = _allow_role
    app_any.dependency_overrides[app_dependency.get_current_user] = _allow_user
    app_any.dependency_overrides[limiter_module.limiter_dependency] = _no_limit

    monkeypatch.setattr(crawl_model, "getInstance", staticmethod(lambda: FakeMicroCrawl()))

    client = client_factory(app)
    response = client.post("/api/nlp/chat/report", json=load_injection("nlp_chat_report.json"))
    assert response.status_code == 200
    body = response.json()
    assert body["route"] == "nlp_chat_report"
    assert body["session_id"] == "session-001"
