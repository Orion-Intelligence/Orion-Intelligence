from __future__ import annotations

import asyncio
import json
import logging
import re
import shutil
import sys
import warnings
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Ensure backend package imports resolve when running tests from repo root.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

warnings.filterwarnings(
    "ignore",
    message=r"The 'http_auth' parameter is deprecated\..*",
    category=DeprecationWarning,
)
warnings.filterwarnings(
    "ignore",
    message=r"Passing transport options in the API method is deprecated\..*",
    category=DeprecationWarning,
)
warnings.filterwarnings(
    "ignore",
    message=r"datetime\.datetime\.utcnow\(\) is deprecated.*",
    category=DeprecationWarning,
)
warnings.filterwarnings(
    "ignore",
    message=r"The `dict` method is deprecated; use `model_dump` instead\..*",
    category=DeprecationWarning,
)
logging.getLogger("passlib.handlers.bcrypt").setLevel(logging.ERROR)


def pytest_configure(config):
    config.addinivalue_line(
        "filterwarnings",
        r"ignore:The 'http_auth' parameter is deprecated\..*:DeprecationWarning",
    )
    config.addinivalue_line(
        "filterwarnings",
        r"ignore:Passing transport options in the API method is deprecated\..*:DeprecationWarning",
    )
    config.addinivalue_line(
        "filterwarnings",
        r"ignore:datetime\.datetime\.utcnow\(\) is deprecated.*:DeprecationWarning",
    )
    config.addinivalue_line(
        "filterwarnings",
        r"ignore:The `dict` method is deprecated; use `model_dump` instead\..*:DeprecationWarning",
    )


def pytest_collection_modifyitems(items):
    for item in items:
        path_parts = Path(str(item.fspath)).parts
        if "tests" not in path_parts:
            continue
        if "static" in path_parts:
            item.add_marker(pytest.mark.static)
        if "journey" in path_parts:
            item.add_marker(pytest.mark.journey)


@pytest.fixture
def fake_user():
    return SimpleNamespace(
        id="507f1f77bcf86cd799439011",
        username="admin_test",
        role="admin",
        status="active",
        tenant_uuid="507f1f77bcf86cd799439012",
        licenses=["maintainer", "free"],
        subscription=True,
        account_verify_at=None,
        preferences={"theme": "dark-theme"},
        twofa_enabled=False,
        email="admin@example.com",
    )


@pytest.fixture
def injections_dir() -> Path:
    return BACKEND_ROOT / "tests" / "crawler" / "injections"


@pytest.fixture
def load_injection(injections_dir):
    def _loader(name: str):
        return json.loads((injections_dir / name).read_text(encoding="utf-8"))

    return _loader


@pytest.fixture
def app_factory():
    def _factory(*routers):
        app = FastAPI()
        for router in routers:
            app.include_router(router)
        return app

    return _factory


@pytest.fixture
def client_factory():
    clients: list[TestClient] = []

    def _factory(app: FastAPI):
        client = TestClient(app)
        client.__enter__()
        clients.append(client)
        return client

    yield _factory

    for client in reversed(clients):
        client.__exit__(None, None, None)


def _shared_test_user() -> SimpleNamespace:
    from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName

    return SimpleNamespace(
        id="6942fc487720aacfcdeb030d",
        username="admin",
        role="admin",
        status="active",
        tenant_uuid="6942fc487720aacfcdeb030b",
        licenses=[LicenseName.MAINTAINER, LicenseName.ENTERPRISE],
        subscription=True,
        account_verify_at=None,
        preferences={"theme": "dark-theme"},
        twofa_enabled=False,
        email="",
    )


@pytest.fixture(scope="session")
def _main_app_client_session(tmp_path_factory):
    from main import app
    from routes import test_routes as test_routes_module
    from orion.constants import constant
    from orion.api.server.crawl_manager.crawl_enums import CRAWL_PATHS
    from orion.management.managers.service_manager import service_manager
    from orion.management.managers.test_manager import test_manager
    from orion.services.arango_manager.arango_controller import arango_controller
    from orion.services.arango_manager.arango_enums import ARANGO_CONNECTIONS
    from orion.services.elastic_manager.elastic_controller import elastic_controller
    from orion.services.elastic_manager.elastic_enums import ELASTIC_CONNECTIONS
    from orion.services.mongo_manager.mongo_controller import mongo_controller
    from orion.services.mongo_manager.mongo_enums import MONGO_CONNECTIONS

    original_elastic_ip = ELASTIC_CONNECTIONS.S_DATABASE_IP
    original_stealer_ip = ELASTIC_CONNECTIONS.S_STEALER_IP
    original_mongo_ip = MONGO_CONNECTIONS.S_MONGO_DATABASE_IP
    original_mongo_port = MONGO_CONNECTIONS.S_MONGO_DATABASE_PORT
    original_arango_url = ARANGO_CONNECTIONS.ARANGO_URL
    original_parser_path = CRAWL_PATHS.M_PARSER_FILE_PATH
    original_feeder_path = CRAWL_PATHS.M_FEEDER_FILE_PATH
    original_screenshot_path = CRAWL_PATHS.M_SCREENSHOT
    original_license_rules = constant.license_rules
    original_init_services = service_manager.init_services
    original_test_mocks_dir = test_routes_module._MOCKS_DIR

    test_mocks_dir = tmp_path_factory.mktemp("api-mocks")
    for mock_file in original_test_mocks_dir.glob("*.json"):
        shutil.copy2(mock_file, test_mocks_dir / mock_file.name)

    running_in_container = Path("/.dockerenv").exists()
    if running_in_container:
        elastic_host = original_elastic_ip or "elasticsearch"
        elastic_port = int(ELASTIC_CONNECTIONS.S_DATABASE_PORT or 9400)
        mongo_host = original_mongo_ip or "mongo"
        mongo_port = int(original_mongo_port or 27017)
        arango_url = original_arango_url or "http://trusted-web-arangodb:8529"
    else:
        elastic_host = "127.0.0.1"
        elastic_port = 9400
        mongo_host = "127.0.0.1"
        mongo_port = 27020
        arango_url = "http://127.0.0.1:8529"

    ELASTIC_CONNECTIONS.S_DATABASE_IP = elastic_host
    ELASTIC_CONNECTIONS.S_STEALER_IP = elastic_host
    MONGO_CONNECTIONS.S_MONGO_DATABASE_IP = mongo_host
    MONGO_CONNECTIONS.S_MONGO_DATABASE_PORT = mongo_port
    ARANGO_CONNECTIONS.ARANGO_URL = arango_url
    CRAWL_PATHS.M_PARSER_FILE_PATH = str(BACKEND_ROOT / "static" / ".well-known" / "parser_files.zip")
    CRAWL_PATHS.M_FEEDER_FILE_PATH = str(BACKEND_ROOT / "static" / ".well-known" / "feeder") + "/"
    CRAWL_PATHS.M_SCREENSHOT = str(BACKEND_ROOT / "static" / "resource" / "screenshot" / "breach") + "/"
    test_routes_module._MOCKS_DIR = test_mocks_dir
    constant.license_rules = {
        "maintainer": {
            "modules": "all",
            "cti_graph": True,
            "mapping": True,
            "scanning": True,
            "maintainer": True,
        }
    }

    async def _init_services_for_tests(self):
        if self._is_available:
            return True

        last_error = None
        for _ in range(30):
            try:
                _, writer = await asyncio.open_connection(elastic_host, elastic_port)
                writer.close()
                await writer.wait_closed()
                break
            except (OSError, ConnectionRefusedError) as exc:
                last_error = exc
                await asyncio.sleep(1)
        else:
            raise RuntimeError(
                f"Elasticsearch test service is not reachable on {elastic_host}:{elastic_port}"
            ) from last_error

        await elastic_controller.get_instance().initialize()
        await mongo_controller.get_instance().link_connection()
        await test_manager.get_instance().reset_test_mongo_and_import_mocks()
        await mongo_controller.get_instance().ensure_indexes()
        await mongo_controller.get_instance().initialize()
        await test_manager.get_instance().reset_test_elastic_and_import_mocks()
        await arango_controller.get_instance().link_connection()
        await arango_controller.get_instance().initialize()
        await test_manager.get_instance().reset_test_arango_and_import_mocks()

        self._is_available = True
        return True

    service_manager.init_services = _init_services_for_tests
    service_manager.get_instance()._is_available = False

    client = TestClient(app)
    client.__enter__()
    app.state.test_current_user = None
    try:
        yield app, client
    finally:
        client.__exit__(None, None, None)
        controller = elastic_controller.get_instance()

        async def _close_elastic_clients():
            seen = set()
            for attr in ("_elastic_controller__m_core_connection", "_elastic_controller__m_dump_connection"):
                conn = getattr(controller, attr, None)
                if conn is None or id(conn) in seen:
                    continue
                seen.add(id(conn))
                close = getattr(conn, "close", None)
                if close is not None:
                    await close()
                setattr(controller, attr, None)

        asyncio.run(_close_elastic_clients())
        service_manager.init_services = original_init_services
        service_manager.get_instance()._is_available = False
        ELASTIC_CONNECTIONS.S_DATABASE_IP = original_elastic_ip
        ELASTIC_CONNECTIONS.S_STEALER_IP = original_stealer_ip
        MONGO_CONNECTIONS.S_MONGO_DATABASE_IP = original_mongo_ip
        MONGO_CONNECTIONS.S_MONGO_DATABASE_PORT = original_mongo_port
        ARANGO_CONNECTIONS.ARANGO_URL = original_arango_url
        CRAWL_PATHS.M_PARSER_FILE_PATH = original_parser_path
        CRAWL_PATHS.M_FEEDER_FILE_PATH = original_feeder_path
        CRAWL_PATHS.M_SCREENSHOT = original_screenshot_path
        test_routes_module._MOCKS_DIR = original_test_mocks_dir
        if hasattr(app.state, "test_current_user"):
            delattr(app.state, "test_current_user")
        constant.license_rules = original_license_rules


@pytest.fixture
def main_app_client(_main_app_client_session):
    from configs import app_dependency
    from configs import limiter_dependency as limiter_module
    from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
    from orion.api.interactive.hompage_manager.homepage_model import homepage_model
    from orion.api.interactive.search_manager.search_model import search_model
    from orion.api.server.crawl_manager.crawl_model import crawl_model
    from orion.services.mail_manager.mail_manager import mail_manager
    from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role
    from orion.services.redis_manager.redis_controller import redis_controller
    from orion.services.redis_manager.redis_enums import REDIS_COMMANDS
    from orion.services.session_manager.session_manager import session_manager

    app, client = _main_app_client_session
    test_user = _shared_test_user()
    dependency_overrides = dict(app.dependency_overrides)
    redis_state: dict[str, int] = {}
    sent_mailbox: list[dict[str, str]] = []
    verification_token_state = {"value": 0}
    audit_entries: list[dict[str, str]] = []

    original_audit_get_instance = AuditLogManager.get_instance
    original_social_search = search_model.social_search
    original_scrape_social = crawl_model.scrape_social
    original_invoke_analytics = homepage_model.invoke_analytics
    original_insight_consolidated_result = homepage_model.insight_consolidated_result
    original_get_country_specific_insights = homepage_model.get_country_specific_insights
    original_get_country_specific_insights_paginated = homepage_model.get_country_specific_insights_paginated
    original_send_verification_mail = mail_manager.send_verification_mail
    original_redis_invoke_trigger = redis_controller.invoke_trigger
    original_generate_verification_token = session_manager.generate_verification_token

    async def _role_ok():
        current = getattr(app.state, "test_current_user", None)
        if current is not None:
            return current.role
        return user_role.ADMIN

    async def _status_ok():
        current = getattr(app.state, "test_current_user", None)
        if current is not None:
            return current.status
        return UserStatus.ACTIVE

    async def _user_ok():
        current = getattr(app.state, "test_current_user", None)
        if current is not None:
            return current
        return test_user

    async def _no_limit():
        yield

    async def _social_search_for_tests(model, key):
        if key == "phone":
            payload = model.model_dump() if hasattr(model, "model_dump") else dict(model)
            return {
                "job_id": "mock-social-phone-recon",
                "result": [{"phone": payload.get("query"), "platform": "whatsapp", "status": "active"}],
            }
        if key == "metadata":
            payload = model.model_dump() if hasattr(model, "model_dump") else dict(model)
            return {
                "job_id": "mock-social-metadata",
                "result": {
                    "username": payload.get("username"),
                    "platform": payload.get("platform"),
                    "tokens": payload.get("tokens", []),
                },
            }
        return await original_social_search(model, key)

    async def _scrape_social_for_tests(model, user_id: str = "system"):
        payload = model.model_dump() if hasattr(model, "model_dump") else dict(model)
        return {"job_id": "mock-social-scrape", "user_id": user_id, "result": payload}

    async def _invoke_analytics_for_tests(self):
        return {"total_documents": 1, "total_sources": 1}

    async def _insight_consolidated_result_for_tests(self):
        return []

    async def _get_country_specific_insights_for_tests(self):
        return {"defacement": [{"m_hash": "69d3cce5ded4358905a671b20fd4aa4d6280ea38bd313b331e83f72a4783a3a6", "m_country": ["India"]}]}

    async def _get_country_specific_insights_paginated_for_tests(self, category: str, country: str, page: int = 1, limit: int = 20):
        items = []
        if (category or "").strip().lower() == "defacement" and (country or "").strip().lower() == "india":
            items = [{"m_hash": "69d3cce5ded4358905a671b20fd4aa4d6280ea38bd313b331e83f72a4783a3a6", "m_country": ["India"]}]
        return {"items": items[:limit], "total": len(items), "page": page, "limit": limit, "has_more": False}

    async def _send_verification_mail_for_tests(self, to: str, subject: str, body: str):
        token_match = re.search(r"/welcome/([^\"'\\s<]+)", body)
        sent_mailbox.append({"to": to, "subject": subject, "body": body, "token": token_match.group(1) if token_match else ""})
        return {"to": to, "subject": subject, "body": body}

    async def _redis_invoke_trigger_for_tests(self, p_commands, p_data=None):
        if p_commands == REDIS_COMMANDS.S_GET_INT:
            key, default, _expiry = p_data
            return str(redis_state.get(key, default))
        if p_commands == REDIS_COMMANDS.S_SET_INT:
            key, value, _expiry = p_data
            redis_state[key] = int(value)
            return True
        return None

    def _generate_verification_token_for_tests():
        verification_token_state["value"] += 1
        return f"journey-verification-token-{verification_token_state['value']:04d}"

    class _AuditManagerForTests:
        async def register(self, tenant_id: str, user_id: str, action: str):
            audit_entries.append({"tenant_id": tenant_id, "user_id": user_id, "action": action})

        async def search_audit(self, current_user, search_type: str, q: str):
            await self.register(
                str(current_user.tenant_uuid),
                str(current_user.id),
                json.dumps({"search_type": search_type, "q": q}),
            )

        async def delete(self, log_id: str):
            for index, entry in enumerate(audit_entries):
                if entry.get("id") == log_id:
                    audit_entries.pop(index)
                    return True
            return False

        async def get(self, param, current_user):
            page = getattr(param, "page", 1)
            return {"items": list(audit_entries), "page": page, "total": len(audit_entries)}

    app.dependency_overrides[app_dependency.get_current_role] = _role_ok
    app.dependency_overrides[app_dependency.get_current_status] = _status_ok
    app.dependency_overrides[app_dependency.get_current_user] = _user_ok
    app.dependency_overrides[limiter_module.limiter_dependency] = _no_limit
    AuditLogManager.get_instance = staticmethod(lambda: _AuditManagerForTests())
    search_model.social_search = staticmethod(_social_search_for_tests)
    crawl_model.scrape_social = staticmethod(_scrape_social_for_tests)
    homepage_model.invoke_analytics = _invoke_analytics_for_tests
    homepage_model.insight_consolidated_result = _insight_consolidated_result_for_tests
    homepage_model.get_country_specific_insights = _get_country_specific_insights_for_tests
    homepage_model.get_country_specific_insights_paginated = _get_country_specific_insights_paginated_for_tests
    mail_manager.send_verification_mail = _send_verification_mail_for_tests
    redis_controller.invoke_trigger = _redis_invoke_trigger_for_tests
    session_manager.generate_verification_token = staticmethod(_generate_verification_token_for_tests)
    app.state.test_sent_mailbox = sent_mailbox
    app.state.test_current_user = None
    client.cookies.clear()

    try:
        yield client
    finally:
        app.dependency_overrides = dependency_overrides
        AuditLogManager.get_instance = original_audit_get_instance
        search_model.social_search = original_social_search
        crawl_model.scrape_social = original_scrape_social
        homepage_model.invoke_analytics = original_invoke_analytics
        homepage_model.insight_consolidated_result = original_insight_consolidated_result
        homepage_model.get_country_specific_insights = original_get_country_specific_insights
        homepage_model.get_country_specific_insights_paginated = original_get_country_specific_insights_paginated
        mail_manager.send_verification_mail = original_send_verification_mail
        redis_controller.invoke_trigger = original_redis_invoke_trigger
        session_manager.generate_verification_token = original_generate_verification_token
        if hasattr(app.state, "test_sent_mailbox"):
            delattr(app.state, "test_sent_mailbox")
        app.state.test_current_user = None
        client.cookies.clear()


@pytest.fixture
def cypress_env() -> dict:
    """Mirror key identities/data from client/cypress.config.ts for backend tests."""
    return {
        "ADMIN_USERNAME": "admin_test_username",
        "ADMIN_PASSWORD": "Zq9M#rX@e7W^B0T+f(ysG!kJc1d2mC&N%hAUEP)6Y4n$R8VbHS",
        "TEST_USERS": {
            "testing1": {
                "username": "testing1",
                "email": "a@hotmail.com",
                "password": "1qaz!QAZ",
                "role": "Member",
                "licenses": ["Free"],
            },
            "testing2": {
                "username": "testing2",
                "email": "b@hotmail.com",
                "password": "1qaz!QAZ",
                "role": "Analyst",
                "licenses": ["Free", "OSINT Basic"],
            },
            "testing3": {
                "username": "testing3",
                "email": "c@hotmail.com",
                "password": "1qaz!QAZ",
                "role": "Member",
                "licenses": ["Free", "OSINT Advanced"],
            },
            "testing4": {
                "username": "testing4",
                "email": "d@gmail.com",
                "password": "1qaz!QAZ",
                "role": "Member",
                "licenses": ["Free", "Pentester"],
            },
            "testing5": {
                "username": "testing5",
                "email": "e@hotmail.com",
                "password": "1qaz!QAZ",
                "role": "Demo",
                "licenses": ["Free"],
            },
        },
        "DEFAULT_TEST_USER_KEY": "testing5",
        "TENANT_ACCOUNT": {
            "username": "test_for_tenants",
            "email": "testing1@orionintelligence.org",
            "password": "1qaz!QAZ",
        },
        "TENANT_SUB_USER": {
            "username": "tenant_user_1",
            "email": "tenant1@gmail.com",
            "password": "1qaz!QAZ",
        },
    }
