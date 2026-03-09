from __future__ import annotations

import asyncio
import json
from types import SimpleNamespace
from typing import Any

import pytest
from fastapi import Request

import routes.crawl_routes as cr
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.services.session_manager.session_manager import session_manager


class FakeCrawl:
    async def invoke_fetch_feeder(self, index_type):
        return {"ok": True, "route": "feeder", "index_type": index_type}

    async def invoke_fetch_parser(self):
        return {"ok": True, "route": "parser"}

    async def invoke_leak_index(self, model):
        return {"ok": True, "route": "index_leak", "count": len(model.cards_data)}

    async def invoke_news_index(self, model):
        return {"ok": True, "route": "index_news", "count": len(model.cards_data)}

    async def invoke_tracking_index(self, model):
        return {"ok": True, "route": "index_tracking", "count": len(model.cards_data)}

    async def invoke_exploit_index(self, model):
        return {"ok": True, "route": "index_exploit", "count": len(model.cards_data)}

    async def invoke_defacement_index(self, model):
        return {"ok": True, "route": "index_defacement", "count": len(model.cards_data)}

    async def invoke_file_upload(self, payload):
        return {"ok": True, "route": "screenshot", "filename": payload.filename}

    async def invoke_generic_index(self, model):
        return {"ok": True, "route": "index_generic", "url": model.m_url}

    async def parse_chat(self, model):
        return {"ok": True, "route": "nlp_parse", "items": len(model.data)}

    async def parse_chat_ai(self, model):
        key = "session_id" if hasattr(model, "session_id") else "data"
        return {"ok": True, "route": "nlp_parse_ai", "kind": key}

    async def parse_summarize_ai(self, model):
        return {"ok": True, "route": "nlp_summarize_ai", "items": len(model.data)}

    async def invoke_chat_index(self, model):
        return {"ok": True, "route": "index_chat", "count": len(model.m_chat_data)}

    async def invoke_social_index(self, model):
        return {"ok": True, "route": "index_social", "count": len(model.cards_data)}

    async def invoke_sanctions_index(self, payload):
        if isinstance(payload, list):
            return {"ok": True, "route": "index_sanctions", "count": len(payload)}
        return {"ok": True, "route": "index_sanctions", "count": 1}

    async def invoke_dump_index(self, model):
        return {"ok": True, "route": "index_dump", "id": model.id, "count": len(model.leak_url)}

    async def invoke_stealerlog_index(self, model):
        return {"ok": True, "route": "index_stealerlog", "count": len(model.logs)}


class FakeEntityManager:
    async def create_or_update_entity_nodes(self, entity):
        data = entity.model_dump()
        return {"ok": True, "doc": data.get("m_document_id")}


class _FakeSessionManager:
    async def get_current_role(self, _token):
        return user_role.ADMIN

    async def get_current_user(self, _token):
        return SimpleNamespace(id="u1", tenant_uuid="t1", role=user_role.ADMIN, licenses=["maintainer"])


def _json_request(payload: Any) -> Request:
    body = json.dumps(payload).encode("utf-8")

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(
        {"type": "http", "method": "POST", "path": "/", "headers": [(b"content-type", b"application/json")]},
        receive=receive,
    )


@pytest.fixture(autouse=True)
def patch_singletons(monkeypatch):
    fake = FakeCrawl()
    monkeypatch.setattr(crawl_model, "getInstance", staticmethod(lambda: fake))
    monkeypatch.setattr(entity_manager, "get_instance", staticmethod(lambda: FakeEntityManager()))
    monkeypatch.setattr(session_manager, "get_instance", staticmethod(lambda: _FakeSessionManager()))


@pytest.mark.parametrize(
    "method,path,payload_file,expected_route",
    [
        ("get", "/api/feeder/leak", None, "feeder"),
        ("get", "/api/parser", None, "parser"),
        ("post", "/api/index/leak", "index_leak.json", "index_leak"),
        ("post", "/api/index/news", "index_news.json", "index_news"),
        ("post", "/api/index/tracking", "index_tracking.json", "index_tracking"),
        ("post", "/api/index/exploit", "index_exploit.json", "index_exploit"),
        ("post", "/api/index/defacement", "index_defacement.json", "index_defacement"),
        ("post", "/api/screenshot", "screenshot_upload.json", "screenshot"),
        ("post", "/api/index/generic", "index_generic.json", "index_generic"),
        ("post", "/api/nlp/parse", "nlp_parse.json", "nlp_parse"),
        ("post", "/api/nlp/parse/ai", "nlp_parse_ai.json", "nlp_parse_ai"),
        ("post", "/api/nlp/summarize/ai", "nlp_summarize_ai.json", "nlp_summarize_ai"),
        ("post", "/api/index/chat", "index_chat.json", "index_chat"),
        ("post", "/api/index/social", "index_social.json", "index_social"),
        ("post", "/api/index/sanctions", "index_sanctions.json", "index_sanctions"),
        ("post", "/api/index/entity", "index_entity.json", None),
        ("post", "/api/index/dump", "index_dump.json", "index_dump"),
        ("post", "/api/index/stealerlog", "index_stealerlog.json", "index_stealerlog"),
    ],
)
def test_crawl_routes_happy_path(load_injection, method, path, payload_file, expected_route):
    payload = load_injection(payload_file) if payload_file else None
    routes = {
        ("get", "/api/feeder/leak"): lambda _p: cr.feeder("leak"),
        ("get", "/api/parser"): lambda _p: cr.parser(),
        ("post", "/api/index/leak"): lambda p: cr.index_leak_data(_json_request(p)),
        ("post", "/api/index/news"): lambda p: cr.index_news_data(_json_request(p)),
        ("post", "/api/index/tracking"): lambda p: cr.index_tracking_data(_json_request(p)),
        ("post", "/api/index/exploit"): lambda p: cr.index_exploit_data(_json_request(p)),
        ("post", "/api/index/defacement"): lambda p: cr.index_defacement_data(_json_request(p)),
        ("post", "/api/screenshot"): lambda p: cr.screenshot(cr.ScreenshotPayload(**p)),
        ("post", "/api/index/generic"): lambda p: cr.index_generic(_json_request(p)),
        ("post", "/api/nlp/parse"): lambda p: cr.parse_text(cr.nlp_data_model(**p)),
        ("post", "/api/nlp/parse/ai"): lambda p: cr.parse_ai(cr.nlp_data_model(**p)),
        ("post", "/api/nlp/summarize/ai"): lambda p: cr.summarize_ai(cr.nlp_data_model(**p)),
        ("post", "/api/index/chat"): lambda p: cr.index_chat_data(_json_request(p)),
        ("post", "/api/index/social"): lambda p: cr.index_social_data(_json_request(p)),
        ("post", "/api/index/sanctions"): lambda p: cr.index_sanctions_data(_json_request(p)),
        ("post", "/api/index/entity"): lambda p: cr.index_entities(_json_request(p), [cr.entity_model(**item) for item in p]),
        ("post", "/api/index/dump"): lambda p: cr.index_dump(_json_request(p)),
        ("post", "/api/index/stealerlog"): lambda p: cr.index_stealerlog(cr.LogBatchModel(**p)),
    }

    body = asyncio.run(routes[(method, path)](payload))

    if path == "/api/index/entity":
        assert isinstance(body, list)
        assert body[0]["ok"] is True
        assert body[0]["doc"] == "doc-entity-1"
        return

    if expected_route:
        assert body["route"] == expected_route


@pytest.mark.parametrize("payload_file", ["index_sanctions_chat.json", "index_sanctions_list.json", "index_sanctions_single.json"])
def test_sanctions_route_variants(load_injection, payload_file):
    body = asyncio.run(cr.index_sanctions_data(_json_request(load_injection(payload_file))))
    assert body["route"] == "index_sanctions"


def test_crawl_route_validation_error():
    with pytest.raises(Exception):
        asyncio.run(cr.screenshot(cr.ScreenshotPayload(filename="f.webp")))
