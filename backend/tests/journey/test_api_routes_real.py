from __future__ import annotations

import json
from pathlib import Path

import pytest


BACKEND_ROOT = Path(__file__).resolve().parents[2]
INJECTIONS_DIR = Path(__file__).resolve().parent / "api_injections"
ELASTIC_MOCKS_DIR = BACKEND_ROOT / "static" / "test" / "mocks" / "elastic"

LEAK_DOC_ID = "d7f2abeb2a0129e439d3cb08b548409eed47229c3e8d7332b20fffd582188eb0"
GENERIC_DOC_ID = "95ea5a84efb9891764ee3cda517ee6e6c46723c74d94d87ab9575593546ad972"
EXPLOIT_DOC_ID = "42367d92b6881a5831e1334feba9081dd51050e9bd6f842b752ab272bceb6c52"
DEFACEMENT_DOC_ID = "69d3cce5ded4358905a671b20fd4aa4d6280ea38bd313b331e83f72a4783a3a6"
CHAT_DOC_ID = "d80b6c7d1b6e31e05c7f8596bbdc1f51fc5257e0692ca5742a9cbc6914b53b12"
SOCIAL_DOC_ID = "f6b55f94e88d9bcc86b12c2922557d857cbd400667ab19f22bdb564f8dc185dd"
LEAK_SCREENSHOT_ID = "93074471199547614717582421012685"


def _load_injection(name: str):
    return json.loads((INJECTIONS_DIR / name).read_text(encoding="utf-8"))


def _load_seeded_doc(index_name: str):
    with (ELASTIC_MOCKS_DIR / f"{index_name}.data.ndjson").open(encoding="utf-8") as handle:
        first = json.loads(next(line for line in handle if line.strip()))
    return first.get("_source", first)


def _assert_response_body(path: str, response):
    assert response.content

    if path == f"/api/search/breach/screenshot/{LEAK_SCREENSHOT_ID}":
        screenshot_file = BACKEND_ROOT / "static" / "resource" / "screenshot" / "breach" / f"{LEAK_SCREENSHOT_ID}.webp"
        assert screenshot_file.exists()
        assert response.headers.get("content-type", "").startswith("image/")
        return

    assert response.json() is not None


@pytest.mark.parametrize(
    "method,path,payload_file",
    [
        ("GET", "/api/directory", None),
        ("GET", "/api/dumps", None),
        ("GET", "/api/insight", None),
        ("GET", "/api/insight/country?category=defacement&country=India&page=1&limit=20", None),
        ("GET", "/api/graph?data_point_type=m_email&model_type=entity&query_value=e2%40dnmx.cc&edge=all&depth=1", None),
        ("POST", "/api/search/strategic", "search_consolidated.json"),
        ("POST", "/api/search/breach", "search_consolidated.json"),
        ("POST", "/api/search/social", "search_consolidated.json"),
        ("POST", "/api/search/exploit", "search_consolidated.json"),
        ("POST", "/api/search/defacement", "search_consolidated.json"),
        ("POST", "/api/search/consolidated", "search_consolidated.json"),
        ("POST", "/api/search/consolidated/ioc", "search_consolidated_ioc.json"),
        ("POST", "/api/search/stealerlogs", "search_stealerlogs.json"),
        ("POST", "/api/search/stealer/ioc", "search_stealerlogs.json"),
        ("POST", "/api/dynamic/user", "dynamic_user.json"),
        ("POST", "/api/dynamic/cracked", "dynamic_cracked.json"),
        ("POST", "/api/dynamic/software", "dynamic_software.json"),
        ("POST", "/api/dynamic/social", "dynamic_social.json"),
        ("POST", "/api/dynamic/wanted", "dynamic_wanted.json"),
        ("POST", "/api/dynamic/national-identity", "dynamic_national_identity.json"),
        ("POST", "/api/urlscan/domain", "urlscan_domain.json"),
        ("POST", "/api/urlscan/subdomains", "urlscan_subdomains.json"),
        ("POST", "/api/urlscan/dns", "urlscan_dns.json"),
        ("POST", "/api/urlscan/wayback", "urlscan_wayback.json"),
        ("POST", "/api/urlscan/ip", "urlscan_ip.json"),
        ("POST", "/api/social/scrape", "social_scrape.json"),
        ("GET", f"/api/search/breach/{LEAK_DOC_ID}", None),
        ("GET", f"/api/search/news/{LEAK_DOC_ID}", None),
        ("GET", f"/api/search/strategic/{GENERIC_DOC_ID}", None),
        ("GET", f"/api/search/exploit/{EXPLOIT_DOC_ID}", None),
        ("GET", f"/api/search/defacement/{DEFACEMENT_DOC_ID}", None),
        ("GET", f"/api/search/chat/{CHAT_DOC_ID}", None),
        ("GET", f"/api/search/social/{SOCIAL_DOC_ID}", None),
        ("GET", f"/api/search/breach/stix/{LEAK_DOC_ID}", None),
        ("GET", f"/api/search/news/stix/{LEAK_DOC_ID}", None),
        ("GET", f"/api/search/strategic/stix/{GENERIC_DOC_ID}", None),
        ("GET", f"/api/search/exploit/stix/{EXPLOIT_DOC_ID}", None),
        ("GET", f"/api/search/defacement/stix/{DEFACEMENT_DOC_ID}", None),
        ("GET", f"/api/search/chat/stix/{CHAT_DOC_ID}", None),
        ("GET", f"/api/search/social/stix/{SOCIAL_DOC_ID}", None),
        ("GET", f"/api/search/breach/screenshot/{LEAK_SCREENSHOT_ID}", None),
        ("POST", "/api/crypto/scan", "crypto_scan.json"),
    ],
)
def test_api_routes_real_smoke(main_app_client, method: str, path: str, payload_file: str | None):
    payload = _load_injection(payload_file) if payload_file else None
    response = main_app_client.request(method, path, json=payload)
    assert response.status_code == 200, response.text
    _assert_response_body(path, response)


@pytest.mark.parametrize(
    "path,filename,content_type",
    [
        ("/api/ioc/extract", "sample.txt", "text/plain"),
        ("/api/apk/scan", "sample.apk", "application/octet-stream"),
    ],
)
def test_api_routes_real_file_smoke(main_app_client, path: str, filename: str, content_type: str):
    response = main_app_client.post(path, files={"file": (filename, b"journey-test-file", content_type)})
    assert response.status_code == 200, response.text
    assert response.json() is not None


@pytest.mark.parametrize(
    "kind,index_name",
    [
        ("leak", "leak_model"),
        ("general", "generic_model"),
        ("exploit", "exploit_model"),
        ("defacement", "defacement_model"),
        ("chat", "chat_model"),
        ("social", "social_model"),
    ],
)
def test_api_routes_real_stix_convert_single(main_app_client, kind: str, index_name: str):
    payload = _load_seeded_doc(index_name)
    response = main_app_client.post(f"/api/stix/convert/{kind}", json=payload)
    assert response.status_code == 200, response.text
    assert response.json() is not None


@pytest.mark.parametrize(
    "kind,index_name",
    [
        ("leak", "leak_model"),
        ("general", "generic_model"),
        ("exploit", "exploit_model"),
        ("defacement", "defacement_model"),
        ("chat", "chat_model"),
        ("social", "social_model"),
    ],
)
def test_api_routes_real_stix_convert_batch(main_app_client, kind: str, index_name: str):
    payload = _load_seeded_doc(index_name)
    response = main_app_client.post(f"/api/stix/convert/{kind}/batch", json=[payload, payload])
    assert response.status_code == 200, response.text
    assert response.json() is not None
