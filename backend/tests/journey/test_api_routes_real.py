from __future__ import annotations

import json
from contextlib import contextmanager
from pathlib import Path
from types import SimpleNamespace

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


@contextmanager
def _swap_attrs(*items):
    originals = []
    try:
        for owner, attr, value in items:
            originals.append((owner, attr, getattr(owner, attr)))
            setattr(owner, attr, value)
        yield
    finally:
        for owner, attr, value in reversed(originals):
            setattr(owner, attr, value)


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
        if screenshot_file.exists():
            assert response.headers.get("content-type", "").startswith("image/")
        else:
            assert response.json() in (
                {"error": "File not found"},
                {"error": "Failed to retrieve screenshot"},
            )
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


def test_api_routes_real_semantic_search_uses_embedding_controller(_main_app_client_session):
    from configs import app_dependency
    from orion.helper_manager.env_handler import env_handler
    from orion.services.elastic_manager.elastic_controller import elastic_controller
    import orion.services.elastic_manager.elastic_semantic_controller as semantic_module
    from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role

    app, client = _main_app_client_session
    dependency_overrides = dict(app.dependency_overrides)

    async def _role_ok():
        return user_role.ADMIN

    async def _status_ok():
        return UserStatus.ACTIVE

    async def _user_ok():
        return SimpleNamespace(
            id="6942fc487720aacfcdeb030d",
            username="admin",
            role=user_role.ADMIN,
            status=UserStatus.ACTIVE,
            tenant_uuid="6942fc487720aacfcdeb030b",
            licenses=["maintainer", "enterprise"],
            subscription=True,
        )

    class _EmbeddingResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"result": {"embeddings": [[0.1, 0.2, 0.3]]}}

    class _EmbeddingClient:
        def __init__(self, *args, **kwargs):
            self.calls = []

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, json):
            self.calls.append((url, json))
            return _EmbeddingResponse()

    class _FakeElastic:
        def __init__(self):
            self.queries = []

        async def search_consolidated_ranked_query(self, indices, query, indices_boost):
            self.queries.append({"indices": indices, "query": query, "indices_boost": indices_boost})
            return {
                "hits": {
                    "total": {"value": 1},
                    "hits": [
                        {
                            "_index": "generic_model",
                            "_score": 0.91,
                            "_source": {"m_hash": "semantic-doc", "m_title": "Semantic hit"},
                        }
                    ],
                }
            }

    fake_elastic = _FakeElastic()
    fake_env = SimpleNamespace(
        env=lambda key, default=None: {
            "SEMANTIC_ENABLED": "1",
            "EMBED_API_BASE": "http://semantic.test",
        }.get(key, default)
    )

    app.dependency_overrides[app_dependency.get_current_role] = _role_ok
    app.dependency_overrides[app_dependency.get_current_status] = _status_ok
    app.dependency_overrides[app_dependency.get_current_user] = _user_ok

    payload = _load_injection("search_consolidated.json")
    payload["matchtype"] = "semantic"

    try:
        with _swap_attrs(
            (elastic_controller, "_elastic_controller__instance", fake_elastic),
            (semantic_module.httpx, "Client", _EmbeddingClient),
            (env_handler, "_env_handler__instance", fake_env),
        ):
            response = client.post("/api/search/strategic", json=payload)
    finally:
        app.dependency_overrides = dependency_overrides

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["Total_Hits"] == 1
    assert fake_elastic.queries
    semantic_query = fake_elastic.queries[0]["query"]
    function_score = semantic_query["query"]["function_score"]
    assert "knn" in function_score["query"]
    assert function_score["query"]["knn"]["query_vector"] == [0.1, 0.2, 0.3]


def test_api_routes_real_insight_route_uses_insight_generator_queries(_main_app_client_session):
    from configs import app_dependency
    from orion.management.models.insight_model_comparison import InsightComparisonModel
    import orion.api.interactive.hompage_manager.homepage_model as homepage_module
    from orion.services.elastic_manager.elastic_controller import elastic_controller
    from orion.services.redis_manager.redis_controller import redis_controller
    from orion.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
    from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role

    app, client = _main_app_client_session
    dependency_overrides = dict(app.dependency_overrides)

    async def _role_ok():
        return user_role.ADMIN

    async def _status_ok():
        return UserStatus.ACTIVE

    async def _user_ok():
        return SimpleNamespace(
            id="6942fc487720aacfcdeb030d",
            username="admin",
            role=user_role.ADMIN,
            status=UserStatus.ACTIVE,
            tenant_uuid="6942fc487720aacfcdeb030b",
            licenses=["maintainer", "enterprise"],
            subscription=True,
        )

    class _FakeRedis:
        def __init__(self):
            self.state = {REDIS_KEYS.INSIGHT_STAT: InsightComparisonModel().model_dump_json()}
            self.calls = []

        async def invoke_trigger(self, command, payload):
            self.calls.append((command, payload))
            if command == REDIS_COMMANDS.S_GET_STRING:
                return self.state.get(payload[0], payload[1])
            if command == REDIS_COMMANDS.S_SET_STRING:
                self.state[payload[0]] = payload[1]
                return True
            return None

    class _FakeElastic:
        def __init__(self):
            self.calls = []

        async def search_consolidated_queries(self, indices, queries):
            self.calls.append((indices, queries))
            if len(indices) == 3:
                return [
                    {"hits": {"hits": [{"_source": {"m_hash": "leak-1", "m_title": "Leak title", "m_content_type": ["leaks"]}}]}},
                    {"hits": {"hits": [{"_source": {"m_hash": "generic-1", "m_title": "General title", "m_content_type": ["report"]}}]}},
                    {"hits": {"hits": [{"_source": {"m_hash": "def-1", "m_title": "Defacement title", "m_content_type": ["mirror"]}}]}},
                ]
            return [
                {"hits": {"hits": [{"_source": {"m_hash": "leak-country", "m_country": ["India"]}}]}},
                {"hits": {"hits": [{"_source": {"m_hash": "generic-country", "m_country": ["Pakistan"]}}]}},
                {"hits": {"hits": [{"_source": {"m_hash": "exploit-country", "m_country": ["Germany"]}}]}},
                {"hits": {"hits": [{"_source": {"m_hash": "chat-country", "m_country": ["Brazil"]}}]}},
                {"hits": {"hits": [{"_source": {"m_hash": "social-country", "m_country": ["Japan"]}}]}},
                {"hits": {"hits": [{"_source": {"m_hash": "def-country", "m_country": ["India"]}}]}},
            ]

    fake_redis = _FakeRedis()
    fake_elastic = _FakeElastic()

    app.dependency_overrides[app_dependency.get_current_role] = _role_ok
    app.dependency_overrides[app_dependency.get_current_status] = _status_ok
    app.dependency_overrides[app_dependency.get_current_user] = _user_ok

    try:
        with _swap_attrs(
            (homepage_module.homepage_model, "invoke_analytics", staticmethod(homepage_module.homepage_model.invoke_analytics)),
            (
                homepage_module.homepage_model,
                "insight_consolidated_result",
                staticmethod(homepage_module.homepage_model.insight_consolidated_result),
            ),
            (
                homepage_module.homepage_model,
                "get_country_specific_insights",
                staticmethod(homepage_module.homepage_model.get_country_specific_insights),
            ),
            (redis_controller, "_redis_controller__instance", fake_redis),
            (elastic_controller, "_elastic_controller__instance", fake_elastic),
        ):
            response = client.get("/api/insight")
    finally:
        app.dependency_overrides = dependency_overrides

    assert response.status_code == 200, response.text
    body = response.json()
    assert "insights" in body
    assert "latestDocument" in body
    assert "country_insight" in body
    assert len(fake_elastic.calls) == 2

    consolidated_indices, consolidated_queries = fake_elastic.calls[0]
    assert consolidated_indices == ["leak_model", "generic_model", "defacement_model"]
    assert all(query.get("size") == 4 for query in consolidated_queries)

    country_indices, country_queries = fake_elastic.calls[1]
    assert country_indices == [
        "leak_model",
        "generic_model",
        "exploit_model",
        "chat_model",
        "social_model",
        "defacement_model",
    ]
    assert len(country_queries) == 6
    assert all(query.get("_source") == ["m_country", "m_hash"] for query in country_queries)
