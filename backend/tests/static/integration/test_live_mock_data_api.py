from __future__ import annotations

import json
import asyncio
from pathlib import Path
from io import BytesIO
from types import SimpleNamespace
from typing import cast

import pytest
from fastapi import UploadFile

from orion.constants import constant
from orion.api.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from orion.api.interactive.dump_manager.dump_shared_model.dump_param_model import dump_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import (
    search_consolidated_param_model,
)
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import (
    search_credential_param_model,
)
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import (
    search_dynamic_crypto_model,
    search_dynamic_crack_model,
    search_dynamic_param_model,
    search_dynamic_social_model,
)
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import DomainScanRequest
from orion.api.server.crawl_manager.class_model.ip_scan_request_model import IPScanRequest
from orion.api.server.crawl_manager.class_model.social_scrape_request_model import SocialScrapeRequest
from orion.api.server.entity_manager.modal.EntityQueryModel import EntityQueryModel
from routes import api_routes as ar
from routes.api_routes import api_routes
from routes import test_routes as tr


BACKEND_ROOT = Path(__file__).resolve().parents[3]
MOCKS_ROOT = BACKEND_ROOT / "static" / "test" / "mocks"
API_MOCKS = MOCKS_ROOT / "api"
ELASTIC_MOCKS = MOCKS_ROOT / "elastic"


def _clear_step_states(keys: list[str]) -> None:
    for key in keys:
        state_file = API_MOCKS / f".{key}.state"
        if state_file.exists():
            state_file.unlink()


async def _await_non_pending(coro_factory):
    for _ in range(3):
        data = await coro_factory()
        if not (isinstance(data, dict) and data.get("status") == "pending"):
            return data
    raise AssertionError("Mock endpoint stayed pending after retries")


def test_mock_search_routes_return_expected_payloads_direct():
    _clear_step_states(
        [
            "dynamic_user",
            "dynamic_cracked",
            "dynamic_software",
            "dynamic_social",
            "dynamic_wanted",
            "dynamic_national_identity",
            "urlscan_domain_basic",
            "urlscan_domain_subdomains",
            "urlscan_domain_wayback",
            "urlscan_ip",
            "social_recon",
            "social_recon_image",
            "social_profile",
            "social_online_images",
            "social_posts",
            "social_followers",
            "social_following",
            "social_entity",
            "social_session_upsert_social",
            "social_session_tab_add_social",
        ]
    )

    # API-backed mock routes
    assert asyncio.run(
        _await_non_pending(
            lambda: tr.test_search_dynamic_email(search_dynamic_param_model(text={"query": "alice@example.com"}))
        )
    ) == json.loads((API_MOCKS / "dynamic_user_done.json").read_text(encoding="utf-8"))

    assert asyncio.run(
        _await_non_pending(
            lambda: tr.test_search_dynamic_cracked(search_dynamic_crack_model(text={"query": "alice@example.com"}))
        )
    ) == json.loads((API_MOCKS / "dynamic_cracked.json").read_text(encoding="utf-8"))

    assert asyncio.run(
        _await_non_pending(
            lambda: tr.test_search_dynamic_software(search_dynamic_crack_model(text={"query": "vpn"}))
        )
    ) == json.loads((API_MOCKS / "dynamic_software.json").read_text(encoding="utf-8"))

    assert asyncio.run(
        _await_non_pending(
            lambda: tr.test_search_dynamic_social(search_dynamic_social_model(text={"query": "alice"}))
        )
    ) == json.loads((API_MOCKS / "dynamic_social.json").read_text(encoding="utf-8"))

    assert asyncio.run(
        _await_non_pending(
            lambda: tr.test_search_dynamic_wanted(search_dynamic_social_model(text={"query": "alice"}))
        )
    ) == json.loads((API_MOCKS / "dynamic_wanted.json").read_text(encoding="utf-8"))

    assert asyncio.run(
        _await_non_pending(
            lambda: tr.test_search_dynamic_national_identity(
                search_dynamic_crack_model(text={"query": "12345-1234567-1"})
            )
        )
    ) == json.loads((API_MOCKS / "dynamic_national_identity.json").read_text(encoding="utf-8"))

    assert asyncio.run(
        _await_non_pending(
            lambda: tr.test_parse_domain(DomainScanRequest(domain="example.com", scanType="basic", checkLive=False))
        )
    ) == json.loads((API_MOCKS / "urlscan_domain_basic.json").read_text(encoding="utf-8"))

    assert asyncio.run(
        _await_non_pending(
            lambda: tr.test_parse_subdomains(
                DomainScanRequest(domain="example.com", scanType="subdomains", checkLive=False)
            )
        )
    ) == json.loads((API_MOCKS / "urlscan_domain_subdomains.json").read_text(encoding="utf-8"))

    assert asyncio.run(
        _await_non_pending(
            lambda: tr.test_parse_wayback(DomainScanRequest(domain="example.com", scanType="wayback", checkLive=False))
        )
    ) == json.loads((API_MOCKS / "urlscan_domain_wayback.json").read_text(encoding="utf-8"))

    assert asyncio.run(
        _await_non_pending(
            lambda: tr.test_search_dynamic_ip_scan(
                DomainScanRequest(domain="example.com", scanType="dns", checkLive=False)
            )
        )
    ) == json.loads((API_MOCKS / "urlscan_domain_iplookup.json").read_text(encoding="utf-8"))

    # Elastic-backed mock routes
    assert asyncio.run(_await_non_pending(lambda: tr.test_social_recon({"query": "alice"}))) == json.loads(
        (ELASTIC_MOCKS / "social_recon.json").read_text(encoding="utf-8")
    )
    assert asyncio.run(_await_non_pending(lambda: tr.test_social_recon_image({"image_base64": "aGVsbG8="}))) == json.loads(
        (ELASTIC_MOCKS / "social_recon_image.json").read_text(encoding="utf-8")
    )
    assert asyncio.run(
        _await_non_pending(lambda: tr.test_social_profile({"platform": "x", "username": "alice"}))
    ) == json.loads(
        (ELASTIC_MOCKS / "social_profile.json").read_text(encoding="utf-8")
    )
    assert asyncio.run(
        _await_non_pending(lambda: tr.test_social_online_images({"platform": "x", "username": "alice"}))
    ) == json.loads(
        (ELASTIC_MOCKS / "social_online_images.json").read_text(encoding="utf-8")
    )
    assert asyncio.run(_await_non_pending(lambda: tr.test_social_posts({"platform": "x", "username": "alice"}))) == json.loads(
        (ELASTIC_MOCKS / "social_posts.json").read_text(encoding="utf-8")
    )
    assert asyncio.run(
        _await_non_pending(lambda: tr.test_social_followers({"platform": "x", "username": "alice", "max_followers": 10}))
    ) == json.loads((ELASTIC_MOCKS / "social_followers.json").read_text(encoding="utf-8"))
    assert asyncio.run(
        _await_non_pending(lambda: tr.test_social_following({"platform": "x", "username": "alice", "max_following": 10}))
    ) == json.loads((ELASTIC_MOCKS / "social_following.json").read_text(encoding="utf-8"))
    assert asyncio.run(_await_non_pending(lambda: tr.test_social_entity({"platform": "x", "username": "alice"}))) == json.loads(
        (ELASTIC_MOCKS / "social_entity.json").read_text(encoding="utf-8")
    )

    # Session graph/social helper mock routes
    upsert = asyncio.run(_await_non_pending(lambda: tr.test_social_session_upsert({"tabs": []}, graph_type="social")))
    assert upsert == json.loads((ELASTIC_MOCKS / "social_session_upsert.json").read_text(encoding="utf-8"))

    tabs = asyncio.run(tr.test_social_session_tabs(graph_type="social"))
    assert tabs == json.loads((ELASTIC_MOCKS / "social_session_tabs_social.json").read_text(encoding="utf-8"))

    tab_add = asyncio.run(_await_non_pending(lambda: tr.test_social_session_tab_add({"label": "tab-1"}, graph_type="social")))
    assert tab_add == json.loads((ELASTIC_MOCKS / "social_session_tab_add.json").read_text(encoding="utf-8"))


class _FakeSearchModel:
    async def search_consolidated_ranked_result(self, *args, **kwargs):
        return {"Result": [], "Page_Count": 0, "Total_Hits": 0}

    async def search_consolidated_result(self, *args, **kwargs):
        return {"Result": [], "Page_Count": 0, "Total_Hits": 0}

    async def search_consolidated_iocs(self, *args, **kwargs):
        return {"Result": [], "Page_Count": 0, "Total_Hits": 0}

    async def search_stealerlogs_result(self, *args, **kwargs):
        return {"Result": [], "Page_Count": 0}

    async def search_stealer_iocs(self, *args, **kwargs):
        return {"Result": [], "Page_Count": 0}

    async def dynamic_search(self, *args, **kwargs):
        return {"ok": True}

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

    async def get_country_specific_insights_paginated(self, **kwargs):
        return {"items": [], "page": kwargs.get("page", 1), "limit": kwargs.get("limit", 20), "total": 0}


class _FakeEntityManager:
    async def get_entity_relations(self, *_):
        return {"results": []}


@pytest.fixture
def mock_api_routes_backends(monkeypatch):
    from orion.api.interactive.directory_manager.directory_model import directory_model
    from orion.api.interactive.dump_manager.dump_model import dump_model
    from orion.api.interactive.hompage_manager.homepage_model import homepage_model
    from orion.api.interactive.search_manager.search_model import search_model
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

    constant.license_rules = {
        "maintainer": {
            "modules": "all",
            "cti_graph": True,
            "mapping": True,
            "scanning": True,
            "maintainer": True,
        }
    }


def _run(coro):
    return asyncio.run(asyncio.wait_for(coro, timeout=10))


class _InlineUpload:
    def __init__(self, filename: str, data: bytes):
        self.filename = filename
        self._buffer = BytesIO(data)

    async def read(self) -> bytes:
        return self._buffer.getvalue()


def test_live_mock_data_api_routes_cover_all_handlers(mock_api_routes_backends):
    user = SimpleNamespace(id="u1")
    consolidated = search_consolidated_param_model(
        q="test", page=1, network="all", category="all", content="all"
    )
    credential = search_credential_param_model(q="ioc", type="c", page=1)

    assert isinstance(_run(ar.search_general(consolidated)), dict)
    assert isinstance(_run(ar.search_leak(consolidated)), dict)
    assert isinstance(_run(ar.search_social(consolidated)), dict)
    assert isinstance(_run(ar.search_exploit(consolidated)), dict)
    assert isinstance(_run(ar.search_defacement(consolidated)), dict)

    assert isinstance(_run(ar.get_directory(directory_param_model(page=1))), dict)
    assert isinstance(_run(ar.get_dumps(dump_param_model(page=1))), dict)
    assert isinstance(_run(ar.get_insight()), dict)
    assert isinstance(_run(ar.get_country_insight(category="breach", country="US", page=1, limit=20)), dict)

    assert isinstance(_run(ar.search_stealerlog(credential)), dict)
    assert isinstance(_run(ar.search_stealer_iocs(credential)), dict)
    assert isinstance(_run(ar.search_consolidated(consolidated)), dict)
    assert isinstance(_run(ar.search_consolidated_iocs(consolidated)), dict)

    assert isinstance(_run(ar.get_defacement_document("doc1")), dict)
    assert isinstance(_run(ar.get_leak_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_news_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_exploit_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_general_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_chat_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_social_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_screenshot("sample")), dict)

    assert isinstance(_run(ar.search_dynamic_email(search_dynamic_param_model(text={"query": "alice@example.com"}), current_user=user)), dict)
    assert isinstance(_run(ar.search_dynamic_cracked(search_dynamic_crack_model(text={"query": "alice@example.com"}), current_user=user)), dict)
    assert isinstance(_run(ar.search_dynamic_software(search_dynamic_crack_model(text={"query": "vpn"}), current_user=user)), dict)

    assert isinstance(_run(ar.parse_domain_scan(DomainScanRequest(domain="example.com", scanType="basic", checkLive=False), current_user=user)), dict)
    assert isinstance(_run(ar.parse_subdomain_scan(DomainScanRequest(domain="example.com", scanType="subdomains", checkLive=False), current_user=user)), dict)
    assert isinstance(_run(ar.parse_dns_scan(DomainScanRequest(domain="example.com", scanType="dns", checkLive=False), current_user=user)), dict)
    assert isinstance(_run(ar.parse_wayback_scan(DomainScanRequest(domain="example.com", scanType="wayback", checkLive=False), current_user=user)), dict)
    assert isinstance(_run(ar.parse_ip(IPScanRequest(ip="8.8.8.8"), current_user=user)), dict)
    assert isinstance(_run(ar.scrape_social(SocialScrapeRequest(usernames=["alice"], platform="instagram"), current_user=user)), dict)

    assert isinstance(_run(ar.search_dynamic_social(search_dynamic_social_model(text={"query": "alice"}), current_user=user)), dict)
    assert isinstance(_run(ar.search_dynamic_wanted(search_dynamic_social_model(text={"query": "alice"}))), dict)
    assert isinstance(_run(ar.search_dynamic_national_identity(search_dynamic_crack_model(text={"query": "12345-1234567-1"}), current_user=user)), dict)

    assert isinstance(_run(ar.get_breach_stix_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_strategic_stix_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_defacement_stix_document("doc1")), dict)
    assert isinstance(_run(ar.get_exploit_stix_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_social_stix_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_chat_stix_document("doc1", lang=None)), dict)
    assert isinstance(_run(ar.get_entity_relations(EntityQueryModel(data_point_type="m_email", model_type="entity", query_value="test@example.com", edge="all", depth="1"))), dict)
    assert isinstance(_run(ar.get_news_stix_document("doc1", lang=None)), dict)

    stix_payload = {
        "m_hash": "abc123",
        "m_title": "Leak from forum",
        "m_content": "Contains IOC indicators",
        "m_important_content": "high signal",
        "m_url": "https://example.org/post/1",
        "m_base_url": "https://example.org",
        "m_domain": ["example.org"],
        "m_ip": ["1.2.3.4", "2001:db8::1"],
        "m_email": ["a@example.org"],
        "m_cve": ["CVE-2023-1234"],
        "m_cwe": ["CWE-79"],
        "m_team": "Threat Group",
        "m_author": "Analyst",
        "m_network": "onion",
        "m_platform": "telegram",
        "m_content_type": ["news", "leak"],
        "m_hashtag": ["#breach"],
        "m_mention": ["@actor"],
        "m_creation_date": "2026-03-01T10:00:00Z",
        "m_update_date": "2026-03-02T10:00:00Z",
    }
    assert isinstance(_run(ar.convert_stix_single("leak", stix_payload)), dict)
    assert isinstance(_run(ar.convert_stix_batch("social", [stix_payload, stix_payload])), dict)

    ioc_file = cast(UploadFile, _InlineUpload("sample.txt", b"ioc content"))
    apk_file = cast(UploadFile, _InlineUpload("sample.apk", b"apk"))
    assert isinstance(_run(ar.extract_ioc(ioc_file, current_user=user)), dict)
    assert isinstance(_run(ar.scan_apk(apk_file, current_user=user)), dict)
    assert isinstance(_run(ar.crypto_scan(search_dynamic_crypto_model(text={"query": "0xabc"}), current_user=user)), dict)


def test_live_mock_data_api_route_list_stays_complete():
    expected = {
        ("POST", "/api/search/strategic"),
        ("POST", "/api/search/breach"),
        ("POST", "/api/search/social"),
        ("POST", "/api/search/exploit"),
        ("POST", "/api/search/defacement"),
        ("GET", "/api/directory"),
        ("GET", "/api/dumps"),
        ("GET", "/api/insight"),
        ("GET", "/api/insight/country"),
        ("POST", "/api/search/stealerlogs"),
        ("POST", "/api/search/stealer/ioc"),
        ("POST", "/api/search/consolidated"),
        ("POST", "/api/search/consolidated/ioc"),
        ("GET", "/api/search/defacement/{doc_id}"),
        ("GET", "/api/search/breach/{doc_id}"),
        ("GET", "/api/search/news/{doc_id}"),
        ("GET", "/api/search/exploit/{doc_id}"),
        ("GET", "/api/search/strategic/{doc_id}"),
        ("GET", "/api/search/chat/{doc_id}"),
        ("GET", "/api/search/social/{doc_id}"),
        ("GET", "/api/search/breach/screenshot/{filename}"),
        ("POST", "/api/dynamic/user"),
        ("POST", "/api/dynamic/cracked"),
        ("POST", "/api/dynamic/software"),
        ("POST", "/api/urlscan/domain"),
        ("POST", "/api/urlscan/subdomains"),
        ("POST", "/api/urlscan/dns"),
        ("POST", "/api/urlscan/wayback"),
        ("POST", "/api/urlscan/ip"),
        ("POST", "/api/social/scrape"),
        ("POST", "/api/dynamic/social"),
        ("POST", "/api/dynamic/wanted"),
        ("POST", "/api/dynamic/national-identity"),
        ("GET", "/api/search/breach/stix/{doc_id}"),
        ("GET", "/api/search/strategic/stix/{doc_id}"),
        ("GET", "/api/search/defacement/stix/{doc_id}"),
        ("GET", "/api/search/exploit/stix/{doc_id}"),
        ("GET", "/api/search/social/stix/{doc_id}"),
        ("GET", "/api/search/chat/stix/{doc_id}"),
        ("GET", "/api/graph"),
        ("GET", "/api/search/news/stix/{doc_id}"),
        ("POST", "/api/stix/convert/{kind}"),
        ("POST", "/api/stix/convert/{kind}/batch"),
        ("POST", "/api/ioc/extract"),
        ("POST", "/api/apk/scan"),
        ("POST", "/api/crypto/scan"),
    }

    actual = set()
    for route in api_routes.routes:
        methods = route.methods or set()
        for method in methods:
            if method in {"GET", "POST"}:
                actual.add((method, route.path))

    assert actual == expected
