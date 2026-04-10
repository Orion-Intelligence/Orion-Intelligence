"""Coverage map: checklist items 62-125 (public + major API route contracts)."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any, cast

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
        return {"Result": [], "Page_Count": 0}

    async def search_stealer_iocs(self, *args, **kwargs):
        return {"Result": [], "Page_Count": 0}

    async def search_stealerlogs_persona_breach(self, *args, **kwargs):
        return {"Result": [], "Page_Count": 0}

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

    async def network_intel(self, param, route_name, user_id=None):
        result = {"ok": True, "route": route_name, "user_id": user_id}
        if hasattr(param, "domain"):
            result.update({"domain": param.domain, "ips": ["1.1.1.1"]})
        if hasattr(param, "ip"):
            result.update({"ip": param.ip})
        if hasattr(param, "coordinates"):
            result.update({"query": {"coordinates": param.coordinates}})
        if hasattr(param, "ip_ranges"):
            result.update({"query": {"ip_ranges": param.ip_ranges}})
        return result


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
    app_any = cast(Any, app)
    app_any.dependency_overrides[app_dependency.get_current_role] = _role_ok
    app_any.dependency_overrides[app_dependency.get_current_status] = _status_ok
    app_any.dependency_overrides[app_dependency.get_current_user] = _user_ok
    app_any.dependency_overrides[limiter_module.limiter_dependency] = _no_limit

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
        ("post", "/api/netintel/resolve_ip", {"domain": "example.com"}),
        ("post", "/api/netintel/ipscanner", {"ip": "8.8.8.8"}),
        ("post", "/api/netintel/url_vulnerability_scan", {"domain": "example.com"}),
        ("post", "/api/netintel/iot_detect", {"coordinates": "24.8607,67.0011", "radius_km": 25, "max_ips": 200}),
        ("post", "/api/netintel/camera_detect_ranges", {"ip_ranges": ["192.168.1.0/24"], "max_ips": 200}),
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


def test_public_system_non_default_is_public(api_public_client):
    resp = api_public_client.get("/api/s/static/system/private-logo.png")
    assert resp.status_code == 200


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


def test_onion_search_route(api_public_client):
    payload = {"text": {"query": "hacking"}}
    resp = api_public_client.post("/api/onion/search", json=payload)
    assert resp.status_code == 200


def test_network_intel_routes(api_public_client):
    assert api_public_client.post("/api/netintel/resolve_ip", json={"domain": "example.com"}).status_code == 200
    assert api_public_client.post("/api/netintel/ipscanner", json={"ip": "8.8.8.8"}).status_code == 200
    assert api_public_client.post("/api/netintel/url_vulnerability_scan", json={"domain": "example.com"}).status_code == 200
    assert api_public_client.post(
        "/api/netintel/iot_detect",
        json={"coordinates": "24.8607,67.0011", "radius_km": 25, "max_ips": 200},
    ).status_code == 200
    assert api_public_client.post(
        "/api/netintel/camera_detect_ranges",
        json={"ip_ranges": ["192.168.1.0/24"], "max_ips": 200},
    ).status_code == 200


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


@pytest.fixture
def api_journey_client(monkeypatch):
    from orion.api.interactive.directory_manager.directory_model import directory_model
    from orion.api.interactive.dump_manager.dump_model import dump_model
    from orion.api.interactive.hompage_manager.homepage_model import homepage_model
    from orion.api.interactive.resource_manager.resource_manager import ResourceManager
    from orion.api.interactive.search_manager.search_model import search_model
    from orion.api.server.config_manager.config_controller import config_controller
    from orion.api.server.crawl_manager.crawl_model import crawl_model
    from orion.api.server.entity_manager.entity_manager import entity_manager
    from orion.services.stix_manager.stix_manager import stix_manager

    calls: dict[str, list[dict[str, Any]]] = {
        "ranked": [],
        "dynamic": [],
        "domain": [],
        "ip": [],
        "network_intel": [],
        "social_scrape": [],
        "extract_ioc": [],
        "scan_apk": [],
    }

    class _JourneySearchModel(_FakeSearchModel):
        async def search_consolidated_ranked_result(self, param, base_index, excluded, categories):
            calls["ranked"].append(
                {
                    "category": getattr(param, "category", None),
                    "content": getattr(param, "content", None),
                    "platform": getattr(param, "platform", None),
                    "base_index": [str(v) for v in base_index],
                    "excluded": list(excluded),
                    "categories": list(categories),
                }
            )
            return {
                "route": "ranked",
                "category": getattr(param, "category", None),
                "content": getattr(param, "content", None),
                "platform": getattr(param, "platform", None),
                "base_index": [str(v) for v in base_index],
                "excluded": list(excluded),
                "categories": list(categories),
            }

        async def dynamic_search(self, param, mode, user_id=None):
            calls["dynamic"].append({"mode": mode, "user_id": user_id, "query": getattr(param, "text", {})})
            return {"ok": True, "mode": mode, "user_id": user_id}

        async def extract_ioc_from_file(self, file_content, filename, user_id=None):
            calls["extract_ioc"].append({"filename": filename, "bytes": len(file_content), "user_id": user_id})
            return {"ok": True, "filename": filename, "size": len(file_content), "user_id": user_id}

        async def scan_apk(self, file_content, filename, user_id=None):
            calls["scan_apk"].append({"filename": filename, "bytes": len(file_content), "user_id": user_id})
            return {"ok": True, "filename": filename, "size": len(file_content), "user_id": user_id}

        async def network_intel(self, param, route_name, user_id=None):
            entry = {"route": route_name, "user_id": user_id}
            if hasattr(param, "domain"):
                entry["domain"] = param.domain
            if hasattr(param, "ip"):
                entry["ip"] = param.ip
            if hasattr(param, "coordinates"):
                entry["coordinates"] = param.coordinates
                entry["radius_km"] = param.radius_km
                entry["max_ips"] = param.max_ips
            if hasattr(param, "ip_ranges"):
                entry["ip_ranges"] = param.ip_ranges
                entry["max_ips"] = param.max_ips
            calls["network_intel"].append(entry)
            return {"ok": True, **entry}

    class _JourneyCrawlModel(_FakeCrawlModel):
        async def scan_domain(self, payload, user_id=None):
            calls["domain"].append({"scanType": payload.scanType, "domain": payload.domain, "user_id": user_id})
            return {"ok": True, "scanType": payload.scanType, "domain": payload.domain, "user_id": user_id}

        async def scan_ip(self, payload, user_id=None):
            calls["ip"].append({"ip": payload.ip, "user_id": user_id})
            return {"ok": True, "ip": payload.ip, "user_id": user_id}

        async def scrape_social(self, payload, user_id=None):
            calls["social_scrape"].append(
                {"platform": payload.platform, "usernames": payload.usernames, "user_id": user_id}
            )
            return {"ok": True, "platform": payload.platform, "usernames": payload.usernames, "user_id": user_id}

    monkeypatch.setattr(search_model, "getInstance", staticmethod(lambda: _JourneySearchModel()))
    monkeypatch.setattr(crawl_model, "getInstance", staticmethod(lambda: _JourneyCrawlModel()))
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
    app_any = cast(Any, app)
    app_any.dependency_overrides[app_dependency.get_current_role] = _role_ok
    app_any.dependency_overrides[app_dependency.get_current_status] = _status_ok
    app_any.dependency_overrides[app_dependency.get_current_user] = _user_ok
    app_any.dependency_overrides[limiter_module.limiter_dependency] = _no_limit
    return TestClient(app), calls


def test_user_journey_search_category_branching(api_journey_client):
    client, calls = api_journey_client

    breach = client.post(
        "/api/search/breach",
        json={"q": "corp", "page": 1, "network": "all", "category": "databases", "content": "all"},
    )
    assert breach.status_code == 200
    assert breach.json()["categories"] == ["leaks"]
    assert breach.json()["category"] == "leaks"

    social_telegram = client.post(
        "/api/search/social",
        json={"q": "actor", "page": 1, "network": "all", "category": "telegram", "content": "all"},
    )
    assert social_telegram.status_code == 200
    assert len(social_telegram.json()["base_index"]) == 1

    social_x = client.post(
        "/api/search/social",
        json={"q": "actor", "page": 1, "network": "all", "category": "x", "content": "all"},
    )
    assert social_x.status_code == 200
    assert social_x.json()["platform"] == "x"


def test_user_journey_scan_sequence_and_identity(api_journey_client):
    client, calls = api_journey_client

    assert client.post(
        "/api/urlscan/domain",
        json={"domain": "example.com", "scanType": "basic", "checkLive": False},
    ).status_code == 200
    assert client.post(
        "/api/urlscan/subdomains",
        json={"domain": "example.com", "scanType": "basic", "checkLive": False},
    ).status_code == 200
    assert client.post(
        "/api/urlscan/dns",
        json={"domain": "example.com", "scanType": "basic", "checkLive": False},
    ).status_code == 200
    assert client.post(
        "/api/urlscan/wayback",
        json={"domain": "example.com", "scanType": "basic", "checkLive": False},
    ).status_code == 200
    assert client.post("/api/urlscan/ip", json={"ip": "8.8.8.8"}).status_code == 200
    assert client.post("/api/social/scrape", json={"usernames": ["alice"], "platform": "instagram"}).status_code == 200

    assert [d["scanType"] for d in calls["domain"]] == ["basic", "subdomains", "dns", "wayback"]
    assert all(d["user_id"] == "u1" for d in calls["domain"])
    assert calls["ip"][0]["ip"] == "8.8.8.8"
    assert calls["ip"][0]["user_id"] == "u1"
    assert calls["social_scrape"][0]["platform"] == "instagram"
    assert calls["social_scrape"][0]["user_id"] == "u1"


def test_user_journey_file_crypto_and_stix_validation(api_journey_client):
    client, calls = api_journey_client

    ioc = client.post("/api/ioc/extract", files={"file": ("case.txt", b"ioc body", "text/plain")})
    apk = client.post("/api/apk/scan", files={"file": ("mobile.apk", b"apk-data", "application/octet-stream")})
    crypto = client.post("/api/crypto/scan", json={"text": {"query": "0xabc"}})

    assert ioc.status_code == 200
    assert apk.status_code == 200
    assert crypto.status_code == 200
    assert ioc.json()["filename"] == "case.txt"
    assert apk.json()["filename"] == "mobile.apk"
    assert crypto.json()["mode"] == "crypto"
    assert crypto.json()["user_id"] == "u1"

    assert calls["extract_ioc"][0]["user_id"] == "u1"
    assert calls["scan_apk"][0]["user_id"] == "u1"
    assert calls["dynamic"][-1]["mode"] == "crypto"

    bad_single = client.post("/api/stix/convert/not-a-kind", json={"m_hash": "1"})
    bad_batch = client.post("/api/stix/convert/not-a-kind/batch", json=[{"m_hash": "1"}])
    assert bad_single.status_code == 200
    assert bad_batch.status_code == 200
    assert bad_single.json()["error"] == "Unsupported STIX kind"
    assert bad_batch.json()["error"] == "Unsupported STIX kind"
    assert "general" in bad_single.json()["supported_kinds"]


def test_user_journey_network_intel_routes(api_journey_client):
    client, calls = api_journey_client

    resolve_ip = client.post("/api/netintel/resolve_ip", json={"domain": "example.com"})
    vuln = client.post("/api/netintel/url_vulnerability_scan", json={"domain": "example.com"})
    geo = client.post("/api/netintel/iot_detect", json={"coordinates": "24.8607,67.0011", "radius_km": 25, "max_ips": 200})
    geo_ranges = client.post("/api/netintel/camera_detect_ranges", json={"ip_ranges": ["192.168.1.0/24"], "max_ips": 200})

    assert resolve_ip.status_code == 200
    assert vuln.status_code == 200
    assert geo.status_code == 200
    assert geo_ranges.status_code == 200
    assert [call["route"] for call in calls["network_intel"]] == [
        "resolve_ip",
        "url_vulnerability_scan",
        "iot_detect",
        "camera_detect_ranges",
    ]
    assert all(call["user_id"] == "u1" for call in calls["network_intel"])
