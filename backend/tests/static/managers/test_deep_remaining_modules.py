from __future__ import annotations

import asyncio
import base64
import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from bson import ObjectId
from cryptography.fernet import Fernet
from fastapi import HTTPException
from starlette.responses import JSONResponse

from orion.api.interactive.account_manager.account_manager import AccountManager
from orion.api.interactive.hompage_manager.homepage_model import homepage_model
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.management.jobs.alert_job import alert_job
from orion.management.jobs.insight_job import insight_job
from orion.management.models.insight_model import InsightData
from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus
from orion.services.mongo_manager.shared_model.db_tenant_model import IocCategory, TenantStatus
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS


def _run(coro):
    return asyncio.run(coro)


def test_alert_job_process_tenant_alerts_stealerlogs_bulk_upsert():
    j = object.__new__(alert_job)
    j._cancel_scan_flags = {}
    captured = []

    class _Search:
        async def search_stealerlogs_result(self, *_args, **_kwargs):
            return {
                "Result": [
                    {
                        "raw": "https://example.com:alice:secret",
                        "channel": "telegram",
                        "type": "credential",
                    }
                ]
            }

    class _Alert:
        async def upsert_alerts_bulk(self, tenantId, alerts_payload, chunk_size):
            captured.append((tenantId, alerts_payload, chunk_size))

    tenant = SimpleNamespace(
        id="tenant-1",
        iocs=[SimpleNamespace(ioc_id="m_domain", values=["example.com"])],
    )
    j._search_model = _Search()
    j._alert_manager = _Alert()
    _run(j._process_tenant_alerts(tenant, "stealerlogs"))

    assert captured
    assert captured[0][0] == "tenant-1"
    assert captured[0][2] == 200
    assert captured[0][1][0]["category"] == "stealerlogs"


def test_alert_job_run_all_categories_for_api_success(monkeypatch):
    j = object.__new__(alert_job)
    tenant_id = str(ObjectId())
    key = Fernet.generate_key()
    enc = Fernet(key)
    state_calls = []

    enc_ioc = IocCategory(
        ioc_id=enc.encrypt(b"m_email").decode(),
        name=enc.encrypt(b"Email").decode(),
        values=[enc.encrypt(b"a@example.com").decode()],
    )
    tenant = SimpleNamespace(
        id=tenant_id,
        name=enc.encrypt(b"Acme").decode(),
        phone=enc.encrypt(b"123").decode(),
        country=enc.encrypt(b"US").decode(),
        city=enc.encrypt(b"NY").decode(),
        postal_code=enc.encrypt(b"10001").decode(),
        licenses=[enc.encrypt(b"maintainer").decode()],
        iocs=[enc_ioc],
    )

    class _Engine:
        async def find_one(self, *_):
            return tenant

    class _AlertRef:
        async def set_scan_running(self, t_id, running):
            state_calls.append((str(t_id), running))

        def getInstance(self):
            return self

    class _Key:
        async def get_profile_dek(self, *_):
            return key

    from orion.services.encryption_manager.key_manager import KeyManager

    monkeypatch.setattr(KeyManager, "get_instance", staticmethod(lambda: _Key()))
    j._engine = _Engine()
    j._alert_manager = _AlertRef()
    j._process_tenant_alerts = lambda *_args, **_kwargs: asyncio.sleep(0)

    out = _run(j.run_all_categories_for_api(SimpleNamespace(tenant_uuid=tenant_id)))
    assert out["status"] == "success"
    assert any(call[1] is True for call in state_calls)
    assert any(call[1] is False for call in state_calls)


def test_tenant_manager_encrypt_and_get_tenant(monkeypatch):
    manager = object.__new__(TenantManager)
    tenant_id = str(ObjectId())
    key = Fernet.generate_key()
    tenant = SimpleNamespace(
        id=tenant_id,
        name="Acme",
        phone="123",
        country="US",
        city="NY",
        postal_code="10001",
        licenses=["maintainer"],
        email="team@acme.com",
        iocs=[IocCategory(ioc_id="m_email", name="Email", values=["a@acme.com"])],
    )

    class _Key:
        async def create_dek(self, *_):
            return key

        async def get_profile_dek(self, *_):
            return key

    class _Engine:
        async def find_one(self, *_):
            return tenant

    from orion.services.encryption_manager.key_manager import KeyManager

    monkeypatch.setattr(KeyManager, "get_instance", staticmethod(lambda: _Key()))
    manager._engine = _Engine()
    _run(TenantManager.encrypt_tenant(tenant))
    out = _run(manager.get_tenant(SimpleNamespace(tenant_uuid=tenant_id, id="u1")))
    assert out.id == tenant_id
    assert out.name == "Acme"
    assert out.iocs[0].ioc_id == "m_email"


def test_tenant_manager_update_tenant_persists_email_iocs(monkeypatch):
    manager = object.__new__(TenantManager)
    tenant_id = str(ObjectId())
    key = Fernet.generate_key()
    saved = []
    tenant = SimpleNamespace(
        id=ObjectId(tenant_id),
        name="Acme",
        phone="123",
        country="US",
        city="NY",
        postal_code="10001",
        licenses=[],
        email="team@acme.com",
        iocs=[],
        is_default=False,
        verified=False,
        user_quota=2,
        status=TenantStatus.ONBOARDING,
        model_dump=lambda: {
            "name": tenant.name,
            "phone": tenant.phone,
            "country": tenant.country,
            "city": tenant.city,
            "postal_code": tenant.postal_code,
            "licenses": tenant.licenses,
            "iocs": [
                {"ioc_id": ioc.ioc_id, "name": ioc.name, "values": list(ioc.values)}
                for ioc in tenant.iocs
            ],
        },
    )

    class _Key:
        async def create_dek(self, *_):
            return key

        async def get_profile_dek(self, *_):
            return key

    class _Engine:
        async def find_one(self, model, *_args, **_kwargs):
            if model.__name__ == "db_alert_model":
                return None
            return tenant

        async def save(self, obj):
            saved.append(obj)

        async def find(self, *_args, **_kwargs):
            return []

        async def count(self, *_args, **_kwargs):
            return 1

    class _Audit:
        async def register(self, *_args, **_kwargs):
            return "ok"

    from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
    from orion.services.encryption_manager.key_manager import KeyManager

    monkeypatch.setattr(KeyManager, "get_instance", staticmethod(lambda: _Key()))
    monkeypatch.setattr(AuditLogManager, "get_instance", staticmethod(lambda: _Audit()))
    manager._engine = _Engine()
    _run(TenantManager.encrypt_tenant(tenant))

    payload = SimpleNamespace(
        id=tenant_id,
        name="Acme Updated",
        phone="456",
        country="CA",
        city="Toronto",
        postal_code="M5H",
        verified=True,
        user_quota=3,
        status=TenantStatus.ACTIVE,
        licenses=["free"],
        iocs=[IocCategory(ioc_id="m_email", name="Email", values=["test-1", "test-2", "alexsssi@scrypton.com"])],
    )
    current_user = SimpleNamespace(id="u1", username="alice", role="member", tenant_uuid=tenant_id, licenses=["free"])

    out = _run(manager.update_tenant(payload, current_user))

    assert saved
    assert out["tenant"]["iocs"][0]["ioc_id"] == "m_email"
    assert out["tenant"]["iocs"][0]["values"] == ["test-1", "test-2", "alexsssi@scrypton.com"]


def test_account_manager_get_all_users_and_update_current_user():
    mgr = object.__new__(AccountManager)
    saved = []

    class _User:
        def __init__(self, username):
            self.id = "u1"
            self.username = username
            self.email = "x@example.com"
            self.preferences = {}
            self.twofa_enabled = True
            self.twofa_secret = "secret"
            self.tenant_uuid = "t1"

        def dict(self):
            return {
                "username": self.username,
                "email": self.email,
                "tenant_uuid": self.tenant_uuid,
                "role": "member",
                "status": "active",
                "subscription": False,
                "licenses": ["maintainer"],
            }

    user_obj = _User("alice")

    class _Engine:
        async def find(self, *_args, **_kwargs):
            return [user_obj]

        async def find_one(self, *_args, **_kwargs):
            return user_obj

        async def save(self, user):
            saved.append(user)

    mgr._engine = _Engine()
    users = _run(mgr.get_all_users(SimpleNamespace(role="admin", licenses=[], tenant_uuid="t1")))
    assert users and users[0].username == "alice"

    from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager

    class _Audit:
        async def register(self, *_args, **_kwargs):
            return "ok"

    setattr(AuditLogManager, "get_instance", staticmethod(lambda: _Audit()))

    request = SimpleNamespace(username="alice2", email="a2@example.com", preferences={"theme": "light"}, twofa_enabled=False)
    out = _run(mgr.update_current_user(request, SimpleNamespace(username="alice")))
    assert out["message"] == "User updated successfully"
    assert saved and saved[-1].twofa_secret is None


def test_account_manager_delete_update_and_profile_image_paths(monkeypatch, tmp_path: Path):
    mgr = object.__new__(AccountManager)
    mgr.IMAGE_DIR = tmp_path / "profile"
    mgr.TENANT_DIR = tmp_path / "tenant"
    mgr.IMAGE_DIR.mkdir()
    mgr.TENANT_DIR.mkdir()
    tenant_default = mgr.TENANT_DIR / "logo_url_default.png"
    tenant_default.write_bytes(b"default")
    user_file = mgr.TENANT_DIR / "u1.png"
    user_file.write_bytes(b"user")

    deleted = []
    removed = []
    saved = []
    tenant_id = str(ObjectId())
    user = SimpleNamespace(id="u1", username="alice", tenant_uuid=tenant_id, role="member", status="active", licenses=[LicenseName.FREE])
    tenant = SimpleNamespace(id=ObjectId(tenant_id), is_default=False, user_quota=0)

    class _Engine:
        async def find_one(self, model, *_args, **_kwargs):
            if model.__name__ == "db_tenant_model":
                return tenant
            return user

        async def remove(self, *_args, **_kwargs):
            removed.append(True)

        async def delete(self, obj):
            deleted.append(obj)

        async def save(self, obj):
            saved.append(obj)

        async def count(self, *_args, **_kwargs):
            return 1

    class _Audit:
        async def register(self, *_args, **_kwargs):
            return "ok"

    from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager

    monkeypatch.setattr(AuditLogManager, "get_instance", staticmethod(lambda: _Audit()))
    mgr._engine = _Engine()

    out = _run(mgr.delete_user(SimpleNamespace(username="alice"), SimpleNamespace(id="admin1", licenses=[LicenseName.MAINTAINER], tenant_uuid=tenant_id)))
    assert out["message"] == "User deleted successfully"
    assert removed and deleted

    user.status = UserStatus.DISABLE
    req = SimpleNamespace(username="alice", status=UserStatus.ACTIVE, licenses=[LicenseName.FREE])
    with pytest.raises(HTTPException):
        _run(mgr.update_user(req, SimpleNamespace(id="admin1", licenses=[LicenseName.MAINTAINER], tenant_uuid=tenant_id)))

    resp = _run(mgr.getProfileImage("u1"))
    assert resp.headers["X-Default-Image"] == "false"
    resp2 = _run(mgr.getProfileImage("missing"))
    assert resp2.headers["X-Default-Image"] == "true"


def test_search_model_dynamic_social_and_stealer_password_filter(monkeypatch):
    class _Resp:
        def __init__(self, status_code=200, payload=None):
            self.status_code = status_code
            self._payload = payload or {"ok": True}

        def json(self):
            return self._payload

    class _Client:
        def __init__(self, *_args, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        async def post(self, *_args, **_kwargs):
            return _Resp(200, {"status": "ok"})

    class _Elastic:
        async def search_query(self, *_args, **_kwargs):
            return True, {"hits": {"hits": [{"_source": {"mapping": ["a:b"], "password": "Abc123!xyz"}}]}}

    class _ResultObj:
        def __init__(self):
            self.Result = [SimpleNamespace(password="Abc123!xyz"), SimpleNamespace(password="short")]

    async def _handler(*_args, **_kwargs):
        return _ResultObj()

    import httpx
    from orion.services.elastic_manager.elastic_controller import elastic_controller

    monkeypatch.setattr(httpx, "AsyncClient", _Client)
    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _Elastic()))
    monkeypatch.setattr(search_model, "_search_model__search_callback", SimpleNamespace(search_handler=_handler))

    out1 = _run(search_model.dynamic_search(SimpleNamespace(model_dump=lambda: {"q": "x"}), "user"))
    out2 = _run(search_model.social_search({"file_bytes": b"x", "filename": "a.bin"}, "recon"))
    assert out1["status"] == "ok"
    assert out2["status"] == "ok"

    sm = search_model()
    param = SimpleNamespace(
        entity_filter={},
        ioc="m_email:test@example.com",
        page=1,
        size=100,
        password_schema=SimpleNamespace(minLength=8, maxLength=64, hasAlphabets=True, hasNumbers=True, hasSpecialChars=True),
    )
    out3 = _run(sm.search_stealer_iocs(param))
    assert len(out3.Result) == 1


def test_crawl_model_file_and_error_branches(monkeypatch, tmp_path: Path):
    import orion.api.server.crawl_manager.crawl_model as cm
    import httpx

    screenshot_dir = tmp_path / "shots"
    parser_dir = tmp_path / "parser"
    feeder_dir = tmp_path / "feeder"
    screenshot_dir.mkdir()
    parser_dir.mkdir()
    feeder_dir.mkdir()
    (parser_dir / "parser_files.zip").write_bytes(b"zip")
    (feeder_dir / "crawl_data_leak.txt").write_text("x", encoding="utf-8")

    cm.CRAWL_PATHS.M_SCREENSHOT = str(screenshot_dir)
    cm.CRAWL_PATHS.M_PARSER_FILE_PATH = str(parser_dir / "parser_files.zip")
    cm.CRAWL_PATHS.M_FEEDER_FILE_PATH = str(feeder_dir) + "/"

    payload = SimpleNamespace(filename="one.webp", data=base64.b64encode(b"img").decode())
    saved = _run(crawl_model.invoke_file_upload(payload))
    assert saved["filename"] == "one.webp"
    assert _run(crawl_model.get_screenshot_file("one.webp")).filename == "one.webp"
    assert _run(crawl_model.get_screenshot_file("missing.webp"))["error"] == "File not found"
    assert _run(crawl_model.invoke_fetch_parser()).status_code == 200
    assert _run(crawl_model.invoke_fetch_feeder("leak")).status_code == 200

    class _FailClient:
        def __init__(self, *_args, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        async def post(self, *_args, **_kwargs):
            raise RuntimeError("boom")

    monkeypatch.setattr(httpx, "AsyncClient", _FailClient)
    assert "error" in _run(crawl_model.parse_chat(SimpleNamespace(data="x")))
    assert "error" in _run(crawl_model.parse_summarize_ai(SimpleNamespace(data="x")))
    assert "error" in _run(crawl_model.parse_chat_ai(SimpleNamespace(model_dump=lambda: {"text": "x"})))


def test_insight_job_update_trending_insights_sets_daily_and_weekly(monkeypatch):
    writes = []

    class _Elastic:
        async def get_insight(self):
            return True, InsightData()

    class _Redis:
        async def invoke_trigger(self, command, payload):
            if command == REDIS_COMMANDS.S_GET_STRING and payload[0] in {REDIS_KEYS.INSIGHT_OLD_DAY, REDIS_KEYS.INSIGHT_OLD_WEEK}:
                return json.dumps(InsightData().model_dump())
            writes.append((command, payload))
            return None

    from orion.services.elastic_manager.elastic_controller import elastic_controller
    from orion.services.redis_manager.redis_controller import redis_controller

    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _Elastic()))
    monkeypatch.setattr(redis_controller, "getInstance", staticmethod(lambda: _Redis()))

    j = insight_job.get_instance()
    _run(j.update_trending_insights(REDIS_KEYS.INSIGHT_OLD_DAY))
    _run(j.update_trending_insights(REDIS_KEYS.INSIGHT_OLD_WEEK))
    keys = [payload[0] for _, payload in writes if isinstance(payload, list) and payload]
    assert REDIS_KEYS.INSIGHT_STAT in keys
    assert REDIS_KEYS.INSIGHT_OLD_DAY in keys
    assert REDIS_KEYS.INSIGHT_OLD_WEEK in keys


def test_search_model_request_doc_not_found_raises(monkeypatch):
    from orion.services.elastic_manager.elastic_controller import elastic_controller

    class _Elastic:
        async def get_doc(self, *_args, **_kwargs):
            return None

    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _Elastic()))
    sm = search_model()
    with pytest.raises(HTTPException):
        _run(sm._request_doc("no-index", "doc1"))


def test_tenant_manager_create_tenant_user_success(monkeypatch):
    manager = object.__new__(TenantManager)
    tenant_id = str(ObjectId())
    key = Fernet.generate_key()
    enc = Fernet(key)
    saved = []

    tenant = SimpleNamespace(
        id=tenant_id,
        is_default=False,
        user_quota=5,
        licenses=[enc.encrypt(b"free").decode(), enc.encrypt(b"maintainer").decode()],
    )

    class _Engine:
        def __init__(self):
            self.find_one_calls = 0

        async def find_one(self, *_args, **_kwargs):
            self.find_one_calls += 1
            if self.find_one_calls in (1, 2):
                return None
            return tenant

        async def count(self, *_args, **_kwargs):
            return 0

        async def save(self, obj):
            saved.append(obj)

    class _Mongo:
        def get_engine(self):
            return _Engine()

    class _Account:
        async def create_tenant_user(self, *_args, **_kwargs):
            return "Strong!123A"

    class _Key:
        async def get_profile_dek(self, *_args, **_kwargs):
            return key

    class _Audit:
        async def register(self, *_args, **_kwargs):
            return "ok"

    from orion.services.mongo_manager.mongo_controller import mongo_controller
    from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
    from orion.helper_manager.helper_controller import helper_controller

    monkeypatch.setattr(mongo_controller, "get_instance", staticmethod(lambda: _Mongo()))
    monkeypatch.setattr(helper_controller, "extract_user_mail_fields", staticmethod(lambda _d: ("alice", "alice@corp.com", "Strong!123")))
    monkeypatch.setattr(TenantManager, "validate_company_email", staticmethod(lambda *_args, **_kwargs: None))
    monkeypatch.setattr(AccountManager, "get_instance", staticmethod(lambda: _Account()))
    monkeypatch.setattr(KeyManager, "get_instance", staticmethod(lambda: _Key()))
    monkeypatch.setattr(AuditLogManager, "get_instance", staticmethod(lambda: _Audit()))

    data = SimpleNamespace(role="member", status="active", subscription=False, licenses=["free"])
    current_user = SimpleNamespace(tenant_uuid=tenant_id, role="admin", id="u1")
    out = _run(manager.create_tenant_user(data, current_user))
    assert out["message"] == "User created successfully"
    assert out["tenant_uuid"] == tenant_id
    assert saved


def test_account_manager_get_node_builds_default_theme_and_quota(monkeypatch, tmp_path: Path):
    mgr = object.__new__(AccountManager)
    mgr.IMAGE_DIR = tmp_path / "profile"
    mgr.TENANT_DIR = tmp_path / "tenant"
    mgr.IMAGE_DIR.mkdir()
    mgr.TENANT_DIR.mkdir()

    tenant_id = str(ObjectId())
    key = Fernet.generate_key()
    enc = Fernet(key)
    tenant = SimpleNamespace(
        id=tenant_id,
        is_default=False,
        status=TenantStatus.ONBOARDING,
        user_quota=1,
        name=enc.encrypt(b"Acme").decode(),
        phone=enc.encrypt(b"123").decode(),
        country=enc.encrypt(b"US").decode(),
        city=enc.encrypt(b"NY").decode(),
        postal_code=enc.encrypt(b"10001").decode(),
        licenses=[enc.encrypt(b"maintainer").decode()],
    )

    class _Engine:
        async def find_one(self, *_args, **_kwargs):
            return tenant

        async def count(self, *_args, **_kwargs):
            return 2

    class _Key:
        async def get_or_create_dek(self, *_args, **_kwargs):
            return key

    class _Alert:
        async def get_alert_summary(self, *_args, **_kwargs):
            return {"critical": 0}

    from orion.api.interactive.alert_manager.alert_manager import AlertManager

    mgr._engine = _Engine()
    monkeypatch.setattr(KeyManager, "get_instance", staticmethod(lambda: _Key()))
    monkeypatch.setattr(AlertManager, "getInstance", staticmethod(lambda: _Alert()))

    user = SimpleNamespace(
        id="u1",
        tenant_uuid=tenant_id,
        email="a@corp.com",
        username="alice",
        role="member",
        status="active",
        subscription=False,
        account_verify_at=None,
        twofa_enabled=True,
        licenses=[SimpleNamespace(value="maintainer")],
        preferences={"theme": "unknown"},
    )
    node = _run(mgr.get_node(user))
    assert node.user.theme == "dark-theme"
    assert node.tenant.quotaExceeded is True


def test_homepage_insight_consolidated_result_writes_cache(monkeypatch):
    writes = []

    class _Redis:
        async def invoke_trigger(self, command, payload):
            writes.append((command, payload))
            return None

    class _Elastic:
        async def search_consolidated_queries(self, indices, _queries):
            payload = []
            for idx in indices:
                payload.append({"hits": {"hits": [{"_source": {"m_hash": f"h-{idx}", "m_title": "t"}}]}})
            return payload

    class _Gen:
        def on_insight_consolidated_data(self):
            return ["leak_model", "chat_model", "exploit_model", "generic_model", "defacement_model"], [{}, {}, {}, {}, {}]

    from orion.services.redis_manager.redis_controller import redis_controller
    from orion.services.elastic_manager.elastic_controller import elastic_controller
    from orion.services.elastic_manager.elastic_insight_generator import elastic_insight_generator

    monkeypatch.setattr(redis_controller, "getInstance", staticmethod(lambda: _Redis()))
    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _Elastic()))
    monkeypatch.setattr(elastic_insight_generator, "__call__", lambda self: self)
    monkeypatch.setattr(elastic_insight_generator, "on_insight_consolidated_data", _Gen.on_insight_consolidated_data)

    out = _run(homepage_model.insight_consolidated_result())
    assert "leak_model" in out
    assert any(payload[0] == REDIS_KEYS.APP_INSIGHT_KEY for _, payload in writes if isinstance(payload, list))


def test_search_model_empty_and_error_edges(monkeypatch):
    class _Elastic:
        async def search_query(self, *_args, **_kwargs):
            return False, {}

    from orion.services.elastic_manager.elastic_controller import elastic_controller
    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _Elastic()))

    # Empty query path
    out = _run(search_model.search_wanted_list(SimpleNamespace(text={"query": "   "})))
    assert out == {"cards_data": [], "total": 0}

    # Elastic failure path
    out2 = _run(search_model.search_wanted_list(SimpleNamespace(text={"query": "alice"})))
    assert out2 == {"cards_data": [], "total": 0}


def test_search_model_dynamic_search_exception_returns_500(monkeypatch):
    import httpx

    class _FailClient:
        def __init__(self, *_args, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        async def post(self, *_args, **_kwargs):
            raise RuntimeError("network down")

    monkeypatch.setattr(httpx, "AsyncClient", _FailClient)
    out = _run(search_model.dynamic_search(SimpleNamespace(model_dump=lambda: {"q": "x"}), "user"))
    assert isinstance(out, JSONResponse)
    assert out.status_code == 500


def test_search_model_extract_and_apk_raise_on_non_200(monkeypatch):
    import httpx

    class _Resp:
        status_code = 500
        text = "bad"

        def json(self):
            return {"ok": False}

    class _Client:
        def __init__(self, *_args, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        async def post(self, *_args, **_kwargs):
            return _Resp()

    monkeypatch.setattr(httpx, "AsyncClient", _Client)
    sm = search_model()
    with pytest.raises(HTTPException):
        _run(sm.extract_ioc_from_file(b"x", "a.txt"))
    with pytest.raises(HTTPException):
        _run(sm.scan_apk(b"x", "a.apk"))


def test_crawl_model_misc_empty_and_missing_paths(monkeypatch, tmp_path: Path):
    import orion.api.server.crawl_manager.crawl_model as cm
    from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator
    from orion.services.elastic_manager.elastic_controller import elastic_controller

    class _Elastic:
        async def index_dump(self, *_args, **_kwargs):
            return True

        async def index_data(self, *_args, **_kwargs):
            return True

    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _Elastic()))
    monkeypatch.setattr(elastic_request_generator, "index_query_stealerlog", staticmethod(lambda *_: None))
    out = _run(crawl_model.invoke_stealerlog_index(SimpleNamespace(model_dump=lambda: {"x": 1})))
    assert out["parsed"] == "empty unqiue"

    monkeypatch.setattr(elastic_request_generator, "index_query_sanctions", staticmethod(lambda *_: []))
    out2 = _run(crawl_model().invoke_sanctions_index([]))
    assert "no valid sanctions records" in out2["message"]

    cm.CRAWL_PATHS.M_PARSER_FILE_PATH = str(tmp_path / "missing.zip")
    cm.CRAWL_PATHS.M_FEEDER_FILE_PATH = str(tmp_path / "missing_dir") + "/"
    assert _run(crawl_model.invoke_fetch_parser()).status_code == 404
    assert _run(crawl_model.invoke_fetch_feeder("leak")).status_code == 404


def test_account_and_tenant_error_edges(monkeypatch):
    mgr = object.__new__(AccountManager)
    with pytest.raises(HTTPException):
        _run(mgr.create_tenant_user(existing_user=None, existing_mail=None, password="x" * 300))

    # Tenant create_tenant_user: invalid association branch
    t_mgr = object.__new__(TenantManager)
    from orion.services.mongo_manager.mongo_controller import mongo_controller

    class _Mongo:
        def get_engine(self):
            class _Engine:
                async def find_one(self, *_args, **_kwargs):
                    return None
            return _Engine()

    monkeypatch.setattr(mongo_controller, "get_instance", staticmethod(lambda: _Mongo()))
    with pytest.raises(HTTPException):
        _run(t_mgr.create_tenant_user(
            SimpleNamespace(role="member", status="active", subscription=False, licenses=["free"]),
            SimpleNamespace(tenant_uuid=None, role="member", id="u1")
        ))


def test_alert_job_get_iocs_and_api_invalid_tenant(monkeypatch):
    j = object.__new__(alert_job)
    j._cancel_scan_flags = {}

    class _KeyBad:
        async def get_profile_dek(self, *_args, **_kwargs):
            raise RuntimeError("bad key")

    monkeypatch.setattr(KeyManager, "get_instance", staticmethod(lambda: _KeyBad()))
    assert _run(j.get_iocs_of_tenant(SimpleNamespace(id="t1", iocs=[SimpleNamespace()]))) == []

    # run_all_categories_for_api invalid tenant path
    class _Engine:
        async def find_one(self, *_args, **_kwargs):
            return None

    class _AlertRef:
        async def set_scan_running(self, *_args, **_kwargs):
            return True

        def getInstance(self):
            return self

    j._engine = _Engine()
    j._alert_manager = _AlertRef()
    out = _run(j.run_all_categories_for_api(SimpleNamespace(tenant_uuid=str(ObjectId()))))
    assert out["status"] == "error"


def test_insight_job_update_trending_insights_handles_bad_json(monkeypatch):
    class _Elastic:
        async def get_insight(self):
            return True, InsightData()

    class _Redis:
        async def invoke_trigger(self, command, payload):
            if command == REDIS_COMMANDS.S_GET_STRING:
                return "{bad json"
            return None

    from orion.services.elastic_manager.elastic_controller import elastic_controller
    from orion.services.redis_manager.redis_controller import redis_controller

    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _Elastic()))
    monkeypatch.setattr(redis_controller, "getInstance", staticmethod(lambda: _Redis()))
    # Should swallow exceptions internally and return None.
    assert _run(insight_job.get_instance().update_trending_insights(REDIS_KEYS.INSIGHT_OLD_DAY)) is None
