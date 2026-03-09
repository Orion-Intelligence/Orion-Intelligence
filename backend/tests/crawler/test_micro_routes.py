from __future__ import annotations

import asyncio
from types import SimpleNamespace
import routes.api_micros as micros
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


def test_micro_cti_fetch(load_injection, monkeypatch):
    monkeypatch.setattr(crawl_model, "fetch_cti_label", staticmethod(_fake_cti_label))
    payload = micros.CTITextRequest(**load_injection("cti_fetch.json"))
    response = asyncio.run(micros.fetch_cti_label(payload))
    assert response["route"] == "cti_fetch"


def test_micro_nlp_chat_report(load_injection, monkeypatch):
    monkeypatch.setattr(crawl_model, "getInstance", staticmethod(lambda: FakeMicroCrawl()))
    payload = micros.ReportChatRequest(**load_injection("nlp_chat_report.json"))
    body = asyncio.run(micros.chat_report(payload))
    assert body["route"] == "nlp_chat_report"
    assert body["session_id"] == "session-001"
