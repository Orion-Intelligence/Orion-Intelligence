from __future__ import annotations

import json
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from orion.api.server.config_manager.config_controller import config_controller
from orion.api.server.config_manager.model.config_data import config_data
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys


@pytest.mark.anyio
async def test_tenant_config_inherits_admin_settings_from_default_tenant(monkeypatch):
    child_tenant = SimpleNamespace(id="tenant-child", is_default=False)
    default_tenant = SimpleNamespace(id="tenant-default", is_default=True)
    child_settings = {
        AllowedKeys.APP_NAME.value: "Tenant App",
        AllowedKeys.META_INFO.value: json.dumps({"ACCOUNTS_MAIL": "tenant@example.com"}),
    }
    default_settings = {
        AllowedKeys.VERSION.value: "1_0_3_13",
        AllowedKeys.LANGUAGE_ALLOWED.value: "en",
        AllowedKeys.AI_ENDPOINT_ENABLED.value: "1",
        AllowedKeys.ADMIN_ROOT_ALLOWED.value: "0",
        AllowedKeys.S_ONION.value: "http://exampleonionaddress.onion",
    }

    class _FakeEngine:
        def __init__(self):
            self.results = [
                child_tenant,
                SimpleNamespace(value=json.dumps(child_settings)),
                default_tenant,
                SimpleNamespace(value=json.dumps(default_settings)),
            ]

        async def find_one(self, *_args, **_kwargs):
            return self.results.pop(0)

    class _FakeRedis:
        @staticmethod
        async def invoke_trigger(*_args, **_kwargs):
            return None

    monkeypatch.setattr(
        "orion.api.server.config_manager.config_controller.redis_controller.getInstance",
        staticmethod(lambda: _FakeRedis()),
    )

    manager = object.__new__(config_controller)
    manager._engine = _FakeEngine()
    manager._config = {}
    manager._configs = {}
    manager._tenants = {}
    manager._default_tenant_id = None

    resolved_tenant_id = await manager.load_config(force_db=True, tenant_id="tenant-child")

    assert resolved_tenant_id == "tenant-child"
    assert manager._configs["tenant-child"][AllowedKeys.APP_NAME.value] == "Tenant App"
    assert manager._configs["tenant-child"][AllowedKeys.META_INFO.value] == child_settings[AllowedKeys.META_INFO.value]
    assert manager._configs["tenant-child"][AllowedKeys.VERSION.value] == "1_0_3_13"
    assert manager._configs["tenant-child"][AllowedKeys.AI_ENDPOINT_ENABLED.value] == "0"
    assert manager._configs["tenant-child"][AllowedKeys.ADMIN_ROOT_ALLOWED.value] == "0"
    assert AllowedKeys.VERSION.value not in child_settings


from types import SimpleNamespace as _NS

from bson import ObjectId as _ObjectId

from orion.api.server.config_manager.config_controller import config_controller as _cc
from tests.scripts.config_controller.fakes import (
    FakeAuditLogManager,
    FakeConfigEngine,
    FakeConfigRedis,
    FakeLog,
    FakeMailManager,
    FakeRaisingEngine,
    FakeResourceManager,
    FakeUploadFile,
)
from tests.scripts.config_controller.helpers import (
    _install_audit,
    _install_log,
    _install_mail,
    _install_redis,
    _install_resource,
    _maintainer_user,
    _make_manager,
    _tenant,
    _user,
)


def test_is_admin_and_branding_editor():
    assert _cc._is_admin(_user(role="admin")) is True
    assert _cc._is_admin(_user(role="analyst")) is False
    assert _cc._is_tenant_branding_editor(_user(role="admin")) is True
    assert _cc._is_tenant_branding_editor(_maintainer_user()) is True
    assert _cc._is_tenant_branding_editor(_user(role="analyst", licenses=[])) is False


def test_cache_key():
    manager = _make_manager()
    assert manager._cache_key("t-9") == "system_config:t-9"


@pytest.mark.anyio
async def test_get_tenant_default_from_cache():
    manager = _make_manager()
    tenant = _tenant("t-1", True)
    manager._default_tenant_id = "t-1"
    manager._tenants = {"t-1": tenant}
    assert await manager._get_tenant() is tenant


@pytest.mark.anyio
async def test_get_tenant_default_from_db():
    tenant = _tenant("t-1", True)
    manager = _make_manager(FakeConfigEngine(find_one_results=[tenant]))
    result = await manager._get_tenant()
    assert result is tenant
    assert manager._default_tenant_id == "t-1"


@pytest.mark.anyio
async def test_get_tenant_by_id_cached():
    manager = _make_manager()
    tenant = _tenant("t-5", False)
    manager._tenants = {"t-5": tenant}
    assert await manager._get_tenant("t-5") is tenant


@pytest.mark.anyio
async def test_get_tenant_by_object_id_with_fallback():
    valid_oid = str(_ObjectId())
    tenant = _tenant(valid_oid, False)
    manager = _make_manager(FakeConfigEngine(find_one_results=[None, tenant]))
    result = await manager._get_tenant(valid_oid)
    assert result is tenant


@pytest.mark.anyio
async def test_get_tenant_not_found():
    manager = _make_manager(FakeConfigEngine(find_one_results=[None]))
    assert await manager._get_tenant("nope") is None


@pytest.mark.anyio
async def test_save_config_to_redis_swallows_error(monkeypatch):
    manager = _make_manager()
    manager._configs = {"t-1": {"a": "b"}}
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis(set_exc=True))
    await manager._save_config_to_redis("t-1")


@pytest.mark.anyio
async def test_load_config_uses_redis_cache(monkeypatch):
    tenant = _tenant("t-1", True)
    manager = _make_manager(FakeConfigEngine(find_one_results=[tenant]))
    _install_log(monkeypatch, FakeLog())
    cached = json.dumps({"app_name": "Cached"})
    _install_redis(monkeypatch, FakeConfigRedis(values={"system_config:t-1": cached}))
    resolved = await manager.load_config()
    assert resolved == "t-1"
    assert manager._config["app_name"] == "Cached"


@pytest.mark.anyio
async def test_load_config_records_fallback(monkeypatch):
    tenant = _tenant("t-1", True)
    records = [
        _NS(key=AllowedKeys.VERSION, value="1_2_3"),
        _NS(key="app_name", value="Fallback"),
    ]
    engine = FakeConfigEngine(find_one_results=[tenant, None], find_results=[records])
    manager = _make_manager(engine)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis(get_exc=True))
    resolved = await manager.load_config()
    assert resolved == "t-1"
    assert manager._config[AllowedKeys.VERSION.value] == "1_2_3"
    assert manager._config["app_name"] == "Fallback"


@pytest.mark.anyio
async def test_load_config_no_tenant_returns_none(monkeypatch):
    manager = _make_manager(FakeConfigEngine(find_one_results=[None]))
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    assert await manager.load_config() is None


@pytest.mark.anyio
async def test_load_config_exception_returns_none(monkeypatch):
    tenant = _tenant("t-1", True)
    manager = _make_manager(FakeRaisingEngine(tenant))
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis(get_exc=True))
    assert await manager.load_config(force_db=True) is None


def test_get_returns_config_values():
    manager = _make_manager()
    manager._config = {"a": "1"}
    manager._configs = {"t-2": {"a": "2"}}
    assert manager.get("a") == "1"
    assert manager.get("a", tenant_id="t-2") == "2"
    assert manager.get("missing", default="d") == "d"


@pytest.mark.anyio
async def test_get_cached(monkeypatch):
    tenant = _tenant("t-1", True)
    engine = FakeConfigEngine(find_one_results=[tenant, _NS(value=json.dumps({"backup_schedule": "1"}))])
    manager = _make_manager(engine)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    assert await manager.get_cached("backup_schedule", "0") == "1"


def test_is_smtp_values_configured():
    valid = {"ACCOUNTS_MAIL": "a@b.com", "ACCOUNTS_MAIL_PASSWORD": "p", "ACCOUNTS_SMTP_SERVER": "s", "ACCOUNTS_SMTP_PORT": "587"}
    assert _cc._is_smtp_values_configured(valid) is True
    assert _cc._is_smtp_values_configured({**valid, "ACCOUNTS_MAIL": ""}) is False
    assert _cc._is_smtp_values_configured({**valid, "ACCOUNTS_SMTP_PORT": "abc"}) is False
    assert _cc._is_smtp_values_configured({**valid, "ACCOUNTS_SMTP_PORT": "70000"}) is False


def test_is_smtp_configured():
    good = json.dumps({"ACCOUNTS_MAIL": "a@b.com", "ACCOUNTS_MAIL_PASSWORD": "p", "ACCOUNTS_SMTP_SERVER": "s", "ACCOUNTS_SMTP_PORT": "25"})
    assert _cc._is_smtp_configured(good) is True
    assert _cc._is_smtp_configured(123) is False
    assert _cc._is_smtp_configured("not-json") is False


@pytest.mark.anyio
async def test_is_backup_schedule(monkeypatch):
    async def fake_get_cached(key, default=None, tenant_id=None):
        return "1"

    fake_instance = _NS(get_cached=fake_get_cached)
    monkeypatch.setattr(_cc, "getInstance", staticmethod(lambda: fake_instance))
    assert await _cc._is_backup_schedule() == "1"


def test_redact_sensitive_meta_info():
    manager = _make_manager()
    raw = json.dumps({"ACCOUNTS_MAIL": "a@b.com", "ALERT_SLACK_WEBHOOK_URL": "u", "keep": "v"})
    redacted = json.loads(manager._redact_sensitive_meta_info(raw))
    assert "ACCOUNTS_MAIL" not in redacted
    assert "ALERT_SLACK_WEBHOOK_URL" not in redacted
    assert redacted["keep"] == "v"

    with_email = json.loads(manager._redact_sensitive_meta_info(raw, include_email_config=True))
    assert with_email["ACCOUNTS_MAIL"] == "a@b.com"

    assert manager._redact_sensitive_meta_info("not-json") == "not-json"
    assert manager._redact_sensitive_meta_info(json.dumps([1, 2])) == json.dumps([1, 2])


def test_asset_success_and_oserror(monkeypatch, tmp_path):
    manager = _make_manager(base_dir=tmp_path)
    tenant = _tenant("t-1", True)
    resource_dir = tmp_path / "res"
    resource_dir.mkdir()
    (resource_dir / "logo_url_custom.png").write_bytes(b"x")
    _install_resource(monkeypatch, FakeResourceManager(resource_dir=resource_dir))
    url = manager.asset("logo_url", tenant)
    assert url.startswith("/api/s/static/system/logo_url_custom.png?v=")

    _install_resource(monkeypatch, FakeResourceManager(resource_dir=None))
    missing = manager.asset("logo_url", tenant)
    assert missing == "/api/s/static/system/logo_url_custom.png"


@pytest.mark.anyio
async def test_get_system_info_success(monkeypatch, tmp_path):
    tenant = _tenant("t-1", True)
    existing = json.dumps({"app_name": "Orion", "meta_info": json.dumps({"ACCOUNTS_MAIL": "a@b.com", "ACCOUNTS_MAIL_PASSWORD": "p", "ACCOUNTS_SMTP_SERVER": "s", "ACCOUNTS_SMTP_PORT": "25"})})
    engine = FakeConfigEngine(find_one_results=[tenant, _NS(value=existing)])
    manager = _make_manager(engine, base_dir=tmp_path)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    resource_dir = tmp_path / "res"
    resource_dir.mkdir()
    for name in ("logo_url_custom.png", "logo_wide_light_custom.png", "logo_wide_dark_custom.png", "auth_dashboard_icon_custom.png"):
        (resource_dir / name).write_bytes(b"x")
    _install_resource(monkeypatch, FakeResourceManager(resource_dir=resource_dir))

    info = await manager.get_system_info(include_email_config=True)
    assert info.settings["app_name"] == "Orion"
    assert info.settings["smtp_configured"] == "1"


@pytest.mark.anyio
async def test_get_system_info_no_tenant_raises(monkeypatch):
    manager = _make_manager(FakeConfigEngine(find_one_results=[None]))
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    with pytest.raises(RuntimeError):
        await manager.get_system_info()


def test_assert_tenant_editor_variants():
    manager = _make_manager()
    manager._assert_tenant_editor(None, "t-1")

    with pytest.raises(HTTPException) as exc:
        manager._assert_tenant_editor(_user(role="analyst", licenses=[]), "t-1")
    assert exc.value.status_code == 403

    with pytest.raises(HTTPException) as exc:
        manager._assert_tenant_editor(_maintainer_user(tenant_uuid="other"), "t-1")
    assert exc.value.status_code == 403

    with pytest.raises(HTTPException) as exc:
        manager._assert_tenant_editor(_maintainer_user(tenant_uuid="t-1"), "t-1", {"backup_schedule": "1"})
    assert exc.value.status_code == 403

    manager._assert_tenant_editor(_maintainer_user(tenant_uuid="t-1"), "t-1", {AllowedKeys.APP_NAME.value: "n"})
    manager._assert_tenant_editor(_user(role="admin"), "t-1", {"anything": "goes"})


@pytest.mark.anyio
async def test_update_public_config_updates_existing_record(monkeypatch, tmp_path):
    tenant = _tenant("t-1", True)
    existing = json.dumps({"meta_info": json.dumps({"existing": "1"})})
    record = _NS(value=existing)
    engine = FakeConfigEngine(find_one_results=[tenant, _NS(value=existing), record, record])
    manager = _make_manager(engine, base_dir=tmp_path)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    mail = FakeMailManager()
    _install_mail(monkeypatch, mail)
    resource_dir = tmp_path / "res"
    resource_dir.mkdir()
    for name in ("logo_url_custom.png", "logo_wide_light_custom.png", "logo_wide_dark_custom.png", "auth_dashboard_icon_custom.png"):
        (resource_dir / name).write_bytes(b"x")
    _install_resource(monkeypatch, FakeResourceManager(resource_dir=resource_dir))

    new_meta = json.dumps({"ACCOUNTS_MAIL": "a@b.com", "ALERT_SLACK_WEBHOOK_URL": "drop"})
    data = config_data(settings={AllowedKeys.APP_NAME.value: "Renamed", AllowedKeys.META_INFO.value: new_meta})
    info = await manager.update_public_config(data, include_email_config=True)

    assert info.settings["app_name"] == "Renamed"
    assert mail.calls
    saved_meta = json.loads(json.loads(record.value)["meta_info"])
    assert saved_meta["existing"] == "1"
    assert "ALERT_SLACK_WEBHOOK_URL" not in saved_meta


@pytest.mark.anyio
async def test_update_public_config_creates_record_and_rejects_bad_meta(monkeypatch, tmp_path):
    tenant = _tenant("t-1", True)
    engine = FakeConfigEngine(find_one_results=[tenant, None])
    manager = _make_manager(engine, base_dir=tmp_path)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())

    bad = config_data(settings={AllowedKeys.META_INFO.value: json.dumps([1, 2, 3])})
    with pytest.raises(HTTPException) as exc:
        await manager.update_public_config(bad)
    assert exc.value.status_code == 400


@pytest.mark.anyio
async def test_update_public_config_no_tenant(monkeypatch):
    manager = _make_manager(FakeConfigEngine(find_one_results=[None]))
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    with pytest.raises(HTTPException) as exc:
        await manager.update_public_config(config_data(settings={}))
    assert exc.value.status_code == 404


@pytest.mark.anyio
async def test_upload_system_resource_success(monkeypatch, tmp_path):
    tenant = _tenant("t-1", True)
    engine = FakeConfigEngine(find_one_results=[tenant, None, None, None])
    manager = _make_manager(engine, base_dir=tmp_path)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    system_dir = tmp_path / "tenant_sys"
    _install_resource(monkeypatch, FakeResourceManager(tenant_system_dir=system_dir))
    audit = FakeAuditLogManager()
    _install_audit(monkeypatch, audit)

    result = await manager.uploadSystemResource(FakeUploadFile(), _user(role="admin"), AllowedKeys.LOGO_URL.value)
    assert result[AllowedKeys.LOGO_URL].startswith("/api/s/static/system/logo_url_custom.png")
    assert (system_dir / "logo_url_custom.png").exists()
    assert audit.calls


@pytest.mark.anyio
async def test_upload_system_resource_invalid_key(monkeypatch, tmp_path):
    manager = _make_manager(base_dir=tmp_path)
    with pytest.raises(HTTPException) as exc:
        await manager.uploadSystemResource(FakeUploadFile(), _user(), "totally-invalid")
    assert exc.value.status_code == 400


@pytest.mark.anyio
async def test_upload_system_resource_unmapped_key(monkeypatch, tmp_path):
    manager = _make_manager(base_dir=tmp_path)
    with pytest.raises(HTTPException) as exc:
        await manager.uploadSystemResource(FakeUploadFile(), _user(), AllowedKeys.VERSION.value)
    assert exc.value.status_code == 400


@pytest.mark.anyio
async def test_upload_system_resource_too_large(monkeypatch, tmp_path):
    tenant = _tenant("t-1", True)
    engine = FakeConfigEngine(find_one_results=[tenant])
    manager = _make_manager(engine, base_dir=tmp_path)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    big = FakeUploadFile(content=b"x" * (1024 * 1024 + 1))
    with pytest.raises(HTTPException) as exc:
        await manager.uploadSystemResource(big, _user(role="admin"), AllowedKeys.LOGO_URL.value)
    assert exc.value.status_code == 400


@pytest.mark.anyio
async def test_upload_system_resource_bad_content_type(monkeypatch, tmp_path):
    tenant = _tenant("t-1", True)
    engine = FakeConfigEngine(find_one_results=[tenant])
    manager = _make_manager(engine, base_dir=tmp_path)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    non_image = FakeUploadFile(content_type="application/pdf")
    with pytest.raises(HTTPException) as exc:
        await manager.uploadSystemResource(non_image, _user(role="admin"), AllowedKeys.LOGO_URL.value)
    assert exc.value.status_code == 415


@pytest.mark.anyio
async def test_upload_system_resource_no_tenant(monkeypatch, tmp_path):
    manager = _make_manager(FakeConfigEngine(find_one_results=[None]), base_dir=tmp_path)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    with pytest.raises(HTTPException) as exc:
        await manager.uploadSystemResource(FakeUploadFile(), _user(role="admin"), AllowedKeys.LOGO_URL.value, tenant_id="missing")
    assert exc.value.status_code == 404


@pytest.mark.anyio
async def test_upload_system_resource_no_system_dir(monkeypatch, tmp_path):
    tenant = _tenant("t-1", True)
    engine = FakeConfigEngine(find_one_results=[tenant])
    manager = _make_manager(engine, base_dir=tmp_path)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    _install_resource(monkeypatch, FakeResourceManager(tenant_system_dir=None))
    with pytest.raises(HTTPException) as exc:
        await manager.uploadSystemResource(FakeUploadFile(), _user(role="admin"), AllowedKeys.LOGO_URL.value)
    assert exc.value.status_code == 400


@pytest.mark.anyio
async def test_get_system_info_load_failure_raises(monkeypatch, tmp_path):
    tenant = _tenant("t-1", True)
    manager = _make_manager(FakeRaisingEngine(tenant), base_dir=tmp_path)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis(get_exc=True))
    with pytest.raises(RuntimeError):
        await manager.get_system_info()


@pytest.mark.anyio
async def test_upload_system_resource_non_default_updates_record(monkeypatch, tmp_path):
    child = _tenant("child", False)
    default = _tenant("default", True)
    child_sys = _NS(value=json.dumps({"app_name": "Child"}))
    default_sys = _NS(value=json.dumps({}))
    existing_record = _NS(value=json.dumps({"app_name": "Child"}))
    engine = FakeConfigEngine(
        find_one_results=[
            child,
            child_sys,
            default,
            default_sys,
            existing_record,
            _NS(value=json.dumps({"app_name": "Child"})),
            _NS(value=json.dumps({})),
        ]
    )
    manager = _make_manager(engine, base_dir=tmp_path)
    _install_log(monkeypatch, FakeLog())
    _install_redis(monkeypatch, FakeConfigRedis())
    system_dir = tmp_path / "child_sys"
    _install_resource(monkeypatch, FakeResourceManager(tenant_system_dir=system_dir))
    _install_audit(monkeypatch, FakeAuditLogManager())

    result = await manager.uploadSystemResource(
        FakeUploadFile(), _user(role="admin"), AllowedKeys.LOGO_WIDE_DARK.value, tenant_id="child"
    )
    assert result[AllowedKeys.LOGO_WIDE_DARK].startswith("/api/s/static/system/logo_wide_dark_custom.png")
    saved = json.loads(existing_record.value)
    assert saved[AllowedKeys.LOGO_WIDE_DARK.value] == "logo_wide_dark_custom.png"
