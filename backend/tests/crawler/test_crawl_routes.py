
from __future__ import annotations

from types import SimpleNamespace
from typing import Any, cast

import pytest
from fastapi import status

from configs import app_dependency
from configs import limiter_dependency as limiter_module
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from routes.crawl_routes import crawl_routes


async def _allow_role():
    return user_role.ADMIN


async def _allow_user():
    return SimpleNamespace(id="u1", tenant_uuid="t1", role="admin", licenses=["maintainer"])


async def _no_limit():
    yield


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


@pytest.fixture
def crawl_client(app_factory, client_factory):
    app = app_factory(crawl_routes)
    app_any = cast(Any, app)
    app_any.dependency_overrides[app_dependency.get_current_role] = _allow_role
    app_any.dependency_overrides[app_dependency.get_current_user] = _allow_user
    app_any.dependency_overrides[limiter_module.limiter_dependency] = _no_limit

    return client_factory(app)


@pytest.fixture(autouse=True)
def patch_singletons(monkeypatch):
    fake = FakeCrawl()
    monkeypatch.setattr(crawl_model, "getInstance", staticmethod(lambda: fake))
    monkeypatch.setattr(entity_manager, "get_instance", staticmethod(lambda: FakeEntityManager()))


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
def test_crawl_routes_happy_path(crawl_client, load_injection, method, path, payload_file, expected_route):
    payload = load_injection(payload_file) if payload_file else None

    if method == "get":
        response = crawl_client.get(path)
    else:
        response = crawl_client.post(path, json=payload)

    assert response.status_code == status.HTTP_200_OK, response.text

    body = response.json()
    if path == "/api/index/entity":
        assert isinstance(body, list)
        assert body[0]["ok"] is True
        assert body[0]["doc"] == "doc-entity-1"
        return

    if expected_route:
        assert body["route"] == expected_route


@pytest.mark.parametrize("payload_file", ["index_sanctions_chat.json", "index_sanctions_list.json", "index_sanctions_single.json"])
def test_sanctions_route_variants(crawl_client, load_injection, payload_file):
    response = crawl_client.post("/api/index/sanctions", json=load_injection(payload_file))
    assert response.status_code == 200
    assert response.json()["route"] == "index_sanctions"


def test_crawl_route_validation_error(crawl_client):
    response = crawl_client.post("/api/screenshot", json={"filename": "f.webp"})
    assert response.status_code == 422
