"""Coverage map: checklist items 62-125 (public + major API route contracts)."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from configs import app_dependency
from configs import limiter_dependency as limiter_module
from orion.constants import constant
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role
from routes.api_routes import api_routes
from routes.public_api_routes import public_routes


async def _role_ok():
    return user_role.ADMIN


async def _status_ok():
    return UserStatus.ACTIVE


async def _user_ok():
    return SimpleNamespace(
        id="u1",
        tenant_uuid="t1",
        role=user_role.ADMIN,
        licenses=["maintainer"],
        status=UserStatus.ACTIVE,
    )


async def _no_limit():
    yield


class _FakeSearchModel:
    async def search_consolidated_ranked_result(self, *args, **kwargs):
        return {"Result": [], "Page_Count": 0, "Total_Hits": 0}

    async def search_consolidated_result(self, *args, **kwargs):
        return {"leak_model": {"Result": []}}

    async def search_consolidated_iocs(self, *args, **kwargs):
        return {"Result": [], "Page_Count": 0, "Total_Hits": 0}

    async def search_stealerlogs_result(self, *args, **kwargs):
        return {"Result": [], "Suggestions": [], "Page_Count": 0}

    async def search_stealer_iocs(self, *args, **kwargs):
        return {"Result": [], "Suggestions": [], "Page_Count": 0}

    async def search_stealerlogs_persona_breach(self, *args, **kwargs):
        return {"Result": [], "Suggestions": [], "Page_Count": 0}

    async def dynamic_search(self, *args, **kwargs):
        return {"ok": True, "route": "dynamic"}

    async def search_wanted_list(self, *args, **kwargs):
        return {"cards_data": [], "total": 0}

    async def request_defacement_doc(self, *_):
        return {"m_hash": "1", "m_title": "doc"}

    async def request_leak_doc(self, *_):
        return {"m_hash": "1", "m_title": "doc"}

    async def request_exploit_doc(self, *_):
        return {"m_hash": "1", "m_title": "doc"}

    async def request_general_doc(self, *_):
        return {"m_hash": "1", "m_title": "doc"}

    async def request_chat_doc(self, *_):
        return {"m_hash": "1", "m_title": "doc"}

    async def request_social_doc(self, *_):
        return {"m_hash": "1", "m_title": "doc"}

    async def social_search(self, *args, **kwargs):
        return {"ok": True, "social": True}

    async def extract_ioc_from_file(self, *args, **kwargs):
        return {"ok": True, "ioc": []}

    async def scan_apk(self, *args, **kwargs):
        return {"ok": True, "apk": {}}


class _FakeCrawlModel:
    async def scan_domain(self, *args, **kwargs):
        return {"ok": True, "domain": True}

    async def scan_ip(self, *args, **kwargs):
        return {"ok": True, "ip": True}

    async def scrape_social(self, *args, **kwargs):
        return {"ok": True, "scrape": True}

    async def get_screenshot_file(self, *args, **kwargs):
        return {"ok": True, "screenshot": True}


class _FakeStixManager:
    async def get_leak_stix(self, *args, **kwargs):
        return {"type": "bundle"}

    async def get_general_stix(self, *args, **kwargs):
        return {"type": "bundle"}

    async def get_defacement_stix(self, *args, **kwargs):
        return {"type": "bundle"}

    async def get_exploit_stix(self, *args, **kwargs):
        return {"type": "bundle"}

    async def get_social_stix(self, *args, **kwargs):
        return {"type": "bundle"}

    async def get_chat_stix(self, *args, **kwargs):
        return {"type": "bundle"}


class _FakeDirectoryModel:
    async def invoke_directory(self, *_):
        return {"total_count": 0, "page": 1, "mDirectoryCallbackLinks": []}


class _FakeDumpModel:
    async def invoke_dump(self, *_):
        return {"total_count": 0, "page": 1, "mDumpCallbackLinks": []}


class _FakeHomepageModel:
    async def invoke_analytics(self):
        return {"k": 1}

    async def insight_consolidated_result(self):
        return []

    async def get_country_specific_insights(self):
        return []


class _FakeEntityManager:
    async def get_entity_relations(self, *_):
        return {"results": []}


class _FakeConfigController:
    async def get_system_info(self):
        return {"settings": {"ai_endpoint": "1"}}


class _FakeResourceManager:
    async def get_tenant_image(self, _):
        return {"ok": True}

    async def get_user_image(self, _):
        return {"ok": True}

    async def get_favicon(self):
        return {"ok": True}

    async def get_system_image(self, _):
        return {"ok": True}

    async def get_robots_txt(self):
        return {"ok": True}


@pytest.fixture
def api_public_client(monkeypatch):
    from orion.api.interactive.directory_manager.directory_model import directory_model
    from orion.api.interactive.dump_manager.dump_model import dump_model
    from orion.api.interactive.hompage_manager.homepage_model import homepage_model
    from orion.api.interactive.resource_manager.resource_manager import ResourceManager
    from orion.api.interactive.search_manager.search_model import search_model
    from orion.api.server.config_manager.config_controller import config_controller
    from orion.api.server.crawl_manager.crawl_model import crawl_model
    from orion.api.server.entity_manager.entity_manager import entity_manager
    from orion.services.stix_manager.stix_manager import stix_manager

    monkeypatch.setattr(search_model, "getInstance", staticmethod(lambda: _FakeSearchModel()))
    monkeypatch.setattr(crawl_model, "getInstance", staticmethod(lambda: _FakeCrawlModel()))
    monkeypatch.setattr(stix_manager, "get_instance", staticmethod(lambda: _FakeStixManager()))
    monkeypatch.setattr(directory_model, "getInstance", staticmethod(lambda: _FakeDirectoryModel()))
    monkeypatch.setattr(dump_model, "getInstance", staticmethod(lambda: _FakeDumpModel()))
    monkeypatch.setattr(homepage_model, "getInstance", staticmethod(lambda: _FakeHomepageModel()))
    monkeypatch.setattr(entity_manager, "get_instance", staticmethod(lambda: _FakeEntityManager()))
    monkeypatch.setattr(config_controller, "getInstance", staticmethod(lambda: _FakeConfigController()))
    monkeypatch.setattr(ResourceManager, "get_instance", staticmethod(lambda: _FakeResourceManager()))

    constant.license_rules = {
        "maintainer": {
            "modules": "all",
            "cti_graph": True,
            "mapping": True,
            "scanning": True,
            "maintainer": True,
        }
    }

    app = FastAPI()
    app.include_router(api_routes)
    app.include_router(public_routes)

    app.dependency_overrides[app_dependency.get_current_role] = _role_ok
    app.dependency_overrides[app_dependency.get_current_status] = _status_ok
    app.dependency_overrides[app_dependency.get_current_user] = _user_ok
    app.dependency_overrides[limiter_module.limiter_dependency] = _no_limit

    return TestClient(app)


@pytest.mark.parametrize(
    "method,path,body",
    [
        ("get", "/api/public", None),
        ("get", "/api/directory", None),
        ("get", "/api/dumps", None),
        ("get", "/api/insight", None),
        ("get", "/api/graph?data_point_type=m_email&model_type=entity&query_value=test%40example.com&edge=all&depth=1", None),
        ("get", "/robots.txt", None),
        ("post", "/api/search/strategic", {"q": "test", "page": 1, "network": "all", "category": "all", "content": "all"}),
        ("post", "/api/search/breach", {"q": "test", "page": 1, "network": "all", "category": "all", "content": "all"}),
        ("post", "/api/search/social", {"q": "test", "page": 1, "network": "all", "category": "all", "content": "all"}),
        ("post", "/api/search/exploit", {"q": "test", "page": 1, "network": "all", "category": "all", "content": "all"}),
        ("post", "/api/search/defacement", {"q": "test", "page": 1, "network": "all", "category": "all", "content": "all"}),
        ("post", "/api/search/consolidated", {"q": "test", "page": 1, "network": "all", "category": "all", "content": "all"}),
        ("post", "/api/search/consolidated/ioc", {"q": "test", "page": 1, "network": "all", "category": "all", "content": "all", "ioc": "m_email:test@example.com"}),
        ("post", "/api/search/stealerlogs", {"q": "ioc", "type": "c", "page": 1}),
        ("post", "/api/search/stealer/ioc", {"q": "ioc", "type": "c", "page": 1}),
        ("post", "/api/dynamic/user", {"text": {"query": "alice@example.com"}}),
        ("post", "/api/dynamic/cracked", {"text": {"query": "alice@example.com"}}),
        ("post", "/api/dynamic/software", {"text": {"query": "vpn"}}),
        ("post", "/api/dynamic/social", {"text": {"query": "alice"}}),
        ("post", "/api/dynamic/wanted", {"text": {"query": "alice"}}),
        ("post", "/api/dynamic/national-identity", {"text": {"query": "12345-1234567-1"}}),
        ("post", "/api/urlscan/domain", {"domain": "example.com", "scanType": "basic", "checkLive": False}),
        ("post", "/api/urlscan/subdomains", {"domain": "example.com", "scanType": "subdomains", "checkLive": False}),
        ("post", "/api/urlscan/dns", {"domain": "example.com", "scanType": "dns", "checkLive": False}),
        ("post", "/api/urlscan/wayback", {"domain": "example.com", "scanType": "wayback", "checkLive": False}),
        ("post", "/api/urlscan/ip", {"ip": "8.8.8.8"}),
        ("post", "/api/social/scrape", {"usernames": ["alice"], "platform": "instagram"}),
        ("get", "/api/search/breach/stix/doc1", None),
        ("get", "/api/search/breach/doc1", None),
        ("get", "/api/search/breach/screenshot/sample", None),
        ("get", "/api/search/strategic/stix/doc1", None),
        ("get", "/api/search/strategic/doc1", None),
        ("get", "/api/search/defacement/stix/doc1", None),
        ("get", "/api/search/defacement/doc1", None),
        ("get", "/api/search/exploit/stix/doc1", None),
        ("get", "/api/search/exploit/doc1", None),
        ("get", "/api/search/social/stix/doc1", None),
        ("get", "/api/search/social/doc1", None),
        ("get", "/api/search/chat/stix/doc1", None),
        ("get", "/api/search/chat/doc1", None),
        ("get", "/api/search/news/stix/doc1", None),
        ("get", "/api/search/news/doc1", None),
        ("get", "/api/search/stealerlogs?q=example", None),
    ],
)
def test_api_public_routes_contracts(api_public_client, method, path, body):
    if method == "get":
        resp = api_public_client.get(path)
    else:
        resp = api_public_client.post(path, json=body)

    assert resp.status_code == 200


def test_public_cookie_gated_assets_require_cookie(api_public_client):
    no_cookie = api_public_client.get("/api/s/static/tenant/abc")
    assert no_cookie.status_code == 401


def test_public_system_logo_default_allowed_without_cookie(api_public_client):
    resp = api_public_client.get("/api/s/static/system/logo_url_default.png")
    assert resp.status_code == 200


def test_public_user_asset_requires_cookie(api_public_client):
    resp = api_public_client.get("/api/s/static/user/abc")
    assert resp.status_code == 401


def test_public_favicon_route(api_public_client):
    resp = api_public_client.get("/api/s/static/favicon")
    assert resp.status_code == 200


def test_public_system_non_default_requires_cookie(api_public_client):
    resp = api_public_client.get("/api/s/static/system/private-logo.png")
    assert resp.status_code == 401


def test_ioc_extract_and_apk_routes(api_public_client):
    files = {"file": ("sample.txt", b"ioc content", "text/plain")}
    ioc = api_public_client.post("/api/ioc/extract", files=files)
    assert ioc.status_code == 200

    apk = api_public_client.post("/api/apk/scan", files={"file": ("sample.apk", b"apk", "application/octet-stream")})
    assert apk.status_code == 200


def test_crypto_scan_route(api_public_client):
    payload = {"text": {"query": "0xabc"}}
    resp = api_public_client.post("/api/crypto/scan", json=payload)
    assert resp.status_code == 200


def test_system_info_endpoints(api_public_client):
    assert api_public_client.get("/api/directory").status_code == 200
    assert api_public_client.get("/api/dumps").status_code == 200
    assert api_public_client.get("/api/insight").status_code == 200
    assert api_public_client.get("/api/graph", params={"data_point_type": "m_email", "model_type": "entity", "query_value": "a@b.com", "edge": "all", "depth": "1"}).status_code == 200


def test_report_document_endpoints(api_public_client):
    assert api_public_client.get("/api/search/breach/doc1").status_code == 200
    assert api_public_client.get("/api/search/strategic/doc1").status_code == 200
    assert api_public_client.get("/api/search/news/doc1").status_code == 200
    assert api_public_client.get("/api/search/exploit/doc1").status_code == 200
    assert api_public_client.get("/api/search/defacement/doc1").status_code == 200
    assert api_public_client.get("/api/search/chat/doc1").status_code == 200
    assert api_public_client.get("/api/search/social/doc1").status_code == 200


def test_stix_news_and_screenshot_endpoints(api_public_client):
    assert api_public_client.get("/api/search/news/stix/doc1").status_code == 200
    assert api_public_client.get("/api/search/breach/screenshot/sample").status_code == 200
