from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from orion.api.interactive.account_manager.models.user_model import user_model
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.services.mongo_manager.shared_model.db_alert_model import AlertModel, db_alert_model
from orion.services.mongo_manager.shared_model.db_auth_models import (
    LicenseName,
    UserStatus,
    db_user_account,
    user_role,
)
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model
from orion.services.mongo_manager.shared_model.db_tenant_model import (
    DismissedIocType,
    IocCategory,
    TenantRequest,
    TenantStatus,
    db_tenant_model,
)
from orion.services.permission_manager.permission_models import UserPermission
from tests.scripts.tenant_manager.fakes import DEK, FakeCollection, ModelEngine
from tests.scripts.tenant_manager.helpers import (
    _e,
    _enc_ioc,
    _make_manager,
    _make_tenant,
    _patch_managers,
    _run,
    _set_env,
)


def test_get_email_domain():
    assert TenantManager.get_email_domain("Alice@Acme.COM") == "acme.com"


def test_normalize_alert_categories_none_and_dedup():
    assert TenantManager.normalize_alert_categories(None) is None
    assert TenantManager.normalize_alert_categories(["A", "a", " b ", "", None]) == ["a", "b"]


def test_build_privileged_iocs_valid():
    iocs = TenantManager.build_privileged_iocs("user@acme.com")
    assert iocs[0].values == ["acme.com"]
    assert iocs[1].values == ["user@acme.com", "acme.com"]


def test_build_privileged_iocs_invalid():
    assert TenantManager.build_privileged_iocs("") == []
    assert TenantManager.build_privileged_iocs("no-at-symbol") == []


def test_get_company_from_email():
    assert TenantManager.get_company_from_email("a@acme.com") == "acme"
    assert TenantManager.get_company_from_email("invalid") == ""


def test_build_tenant_slug():
    assert TenantManager.build_tenant_slug("a@acme.com") == "acme"
    assert TenantManager.build_tenant_slug("no-email") == "tenant"


def test_build_tenant_url_default_tenant():
    tenant = SimpleNamespace(is_default=True, slug="acme")
    assert TenantManager.build_tenant_url("https://orion.example/", tenant, "/login") == "https://orion.example/login"


def test_build_tenant_url_localhost_subdomain(monkeypatch):
    _set_env(monkeypatch, TENANT_BASE_DOMAIN="")
    tenant = SimpleNamespace(is_default=False, slug="acme")
    assert TenantManager.build_tenant_url("http://localhost:4200", tenant, "/reset") == "http://acme.localhost:4200/reset"


def test_build_tenant_url_custom_base_domain(monkeypatch):
    _set_env(monkeypatch, TENANT_BASE_DOMAIN="*.tenants.example.")
    tenant = SimpleNamespace(is_default=False, slug="acme")
    assert TenantManager.build_tenant_url("https://app.example", tenant, "login") == "https://acme.tenants.example/login"


def test_build_tenant_url_missing_slug_raises():
    tenant = SimpleNamespace(is_default=False, slug=None)
    with pytest.raises(HTTPException) as exc:
        TenantManager.build_tenant_url("https://app.example", tenant, "/")
    assert exc.value.status_code == 400


def test_tenant_access_url_empty_when_no_app_url(monkeypatch):
    _set_env(monkeypatch, APP_URL="")
    assert TenantManager.tenant_access_url(_make_tenant()) == ""


def test_tenant_access_url_empty_on_http_exception(monkeypatch):
    _set_env(monkeypatch, APP_URL="https://app.example")
    tenant = _make_tenant(slug=None)
    assert TenantManager.tenant_access_url(tenant) == ""


def test_tenant_access_url_success(monkeypatch):
    _set_env(monkeypatch, APP_URL="http://localhost:4200", TENANT_BASE_DOMAIN="")
    assert TenantManager.tenant_access_url(_make_tenant()) == "http://acme.localhost:4200/"


def test_validate_signup_username():
    TenantManager.validate_signup_username("abcdefgh")
    with pytest.raises(HTTPException) as exc:
        TenantManager.validate_signup_username("ab")
    assert exc.value.status_code == 422


def test_validate_tenant_username():
    TenantManager.validate_tenant_username("abcd")
    with pytest.raises(HTTPException) as exc:
        TenantManager.validate_tenant_username("ab")
    assert exc.value.status_code == 400


def test_validate_signup_email():
    TenantManager.validate_signup_email("a@acme.com")
    with pytest.raises(HTTPException) as exc:
        TenantManager.validate_signup_email("nope")
    assert exc.value.status_code == 422


def test_validate_tenant_email():
    TenantManager.validate_tenant_email("a@acme.com", "member")
    TenantManager.validate_tenant_email("bad", "demo")
    with pytest.raises(HTTPException) as exc:
        TenantManager.validate_tenant_email("bad", "member")
    assert exc.value.status_code == 400


def test_validate_company_email(monkeypatch):
    calls = []
    monkeypatch.setattr(
        "orion.api.interactive.tenant_manager.tenant_manager.helper_controller.validate_company_email_domain",
        staticmethod(lambda email, detail=None: calls.append((email, detail))),
    )
    TenantManager.validate_company_email("a@acme.com")
    assert calls[0][0] == "a@acme.com"


def test_has_case_management_permission():
    assert TenantManager.has_case_management_permission([UserPermission.CASE_MANAGEMENT]) is True
    assert TenantManager.has_case_management_permission(["case_management"]) is True
    assert TenantManager.has_case_management_permission(None) is False


def test_dek(monkeypatch):
    _patch_managers(monkeypatch)
    assert _run(TenantManager._dek("507f1f77bcf86cd799439011")) == DEK


def test_encrypt_tenant_round_trip(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = db_tenant_model(
        name="Acme",
        phone="123",
        country="US",
        city="NYC",
        postal_code="10001",
        email="user@acme.com",
        licenses=["free"],
        iocs=[IocCategory(ioc_id="m_domain", name="Domains", values=["acme.com"])],
    )
    cipher = _run(TenantManager.encrypt_tenant(tenant))
    assert cipher.decrypt(tenant.name.encode()).decode() == "Acme"
    assert cipher.decrypt(tenant.email.encode()).decode() == "user@acme.com"
    assert cipher.decrypt(tenant.iocs[0].ioc_id.encode()).decode() == "m_domain"


def test_get_admin_visible_alert_tenants_all_and_filtered(monkeypatch):
    _patch_managers(monkeypatch)
    tenant_a = _make_tenant()
    tenant_b = _make_tenant()
    engine = ModelEngine().set_find(db_tenant_model, [tenant_a, tenant_b])
    manager = _make_manager(engine)

    assert _run(manager.get_admin_visible_alert_tenants()) == [tenant_a, tenant_b]
    filtered = _run(manager.get_admin_visible_alert_tenants([str(tenant_a.id)]))
    assert filtered == [tenant_a]


def test_get_alert_allowed_tenant_options(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    engine = ModelEngine().set_find(db_tenant_model, [tenant])
    manager = _make_manager(engine)

    result = _run(manager.get_alert_allowed_tenant_options())
    assert result[0]["name"] == "Acme"
    assert result[0]["email"] == "user@acme.com"


def test_validate_alert_access_assignment_non_admin_requesting_raises(monkeypatch):
    _patch_managers(monkeypatch)
    manager = _make_manager()
    data = SimpleNamespace(alerts_allowed_all=True, alerts_allowed_tenant_ids=[], permissions=[])
    current_user = SimpleNamespace(role="member")
    with pytest.raises(HTTPException) as exc:
        _run(manager.validate_alert_access_assignment(data, current_user))
    assert exc.value.status_code == 403


def test_validate_alert_access_assignment_no_case_permission(monkeypatch):
    _patch_managers(monkeypatch)
    manager = _make_manager()
    data = SimpleNamespace(alerts_allowed_all=False, alerts_allowed_tenant_ids=[], permissions=[])
    result = _run(manager.validate_alert_access_assignment(data, SimpleNamespace(role="admin")))
    assert result == (False, [])


def test_validate_alert_access_assignment_all(monkeypatch):
    _patch_managers(monkeypatch)
    manager = _make_manager()
    data = SimpleNamespace(
        alerts_allowed_all=True,
        alerts_allowed_tenant_ids=[],
        permissions=[UserPermission.CASE_MANAGEMENT],
    )
    result = _run(manager.validate_alert_access_assignment(data, SimpleNamespace(role="admin")))
    assert result == (True, [])


def test_validate_alert_access_assignment_filters_ids(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    engine = ModelEngine().set_find(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    good = str(tenant.id)
    data = SimpleNamespace(
        alerts_allowed_all=False,
        alerts_allowed_tenant_ids=[good, "507f1f77bcf86cd799439099", good],
        permissions=[UserPermission.CASE_MANAGEMENT],
    )
    result = _run(manager.validate_alert_access_assignment(data, SimpleNamespace(role="admin")))
    assert result == (False, [good])


def test_resolve_visible_alert_tenant_ids_admin(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    engine = ModelEngine().set_find(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    result = _run(manager.resolve_visible_alert_tenant_ids_for_user(SimpleNamespace(role="admin")))
    assert result == [str(tenant.id)]


def test_resolve_visible_alert_tenant_ids_user_without_permission(monkeypatch):
    _patch_managers(monkeypatch)
    user = SimpleNamespace(permissions=[])
    engine = ModelEngine().set_find_one(db_user_account, [user])
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", id="507f1f77bcf86cd799439011", username="alice")
    assert _run(manager.resolve_visible_alert_tenant_ids_for_user(current)) == []


def test_resolve_visible_alert_tenant_ids_user_all(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    user = SimpleNamespace(permissions=[UserPermission.CASE_MANAGEMENT], alerts_allowed_all=True)
    engine = ModelEngine().set_find_one(db_user_account, [user]).set_find(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", id="507f1f77bcf86cd799439011", username="alice")
    assert _run(manager.resolve_visible_alert_tenant_ids_for_user(current)) == [str(tenant.id)]


def test_resolve_visible_alert_tenant_ids_user_assigned_empty(monkeypatch):
    _patch_managers(monkeypatch)
    user = SimpleNamespace(
        permissions=[UserPermission.CASE_MANAGEMENT],
        alerts_allowed_all=False,
        alerts_allowed_tenant_ids=[],
    )
    engine = ModelEngine().set_find_one(db_user_account, [None, user])
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", id="507f1f77bcf86cd799439011", username="alice")
    assert _run(manager.resolve_visible_alert_tenant_ids_for_user(current)) == []


def test_resolve_visible_alert_tenant_ids_user_assigned(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    user = SimpleNamespace(
        permissions=[UserPermission.CASE_MANAGEMENT],
        alerts_allowed_all=False,
        alerts_allowed_tenant_ids=[str(tenant.id)],
    )
    engine = ModelEngine().set_find_one(db_user_account, [user]).set_find(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", id="507f1f77bcf86cd799439011", username="alice")
    assert _run(manager.resolve_visible_alert_tenant_ids_for_user(current)) == [str(tenant.id)]


def test_remove_tenant_from_user_alert_access(monkeypatch):
    _patch_managers(monkeypatch)
    user = SimpleNamespace(alerts_allowed_tenant_ids=["keep", "drop"])
    engine = ModelEngine().set_find(db_user_account, [user])
    manager = _make_manager(engine)
    _run(manager.remove_tenant_from_user_alert_access("drop"))
    assert user.alerts_allowed_tenant_ids == ["keep"]
    assert engine.saved == [user]


def test_build_tenant_alert_summary(monkeypatch):
    fakes = _patch_managers(monkeypatch)
    tenant = _make_tenant(status=TenantStatus.ACTIVE)
    manager = _make_manager()
    result = _run(manager.build_tenant_alert_summary([tenant]))
    assert result[0]["tenant"]["name"] == "Acme"
    assert result[0]["tenant"]["is_active"] is True
    assert result[0]["alert_summary"] == fakes.alerts.summary


def test_copy_default_system_settings_no_default(monkeypatch):
    _patch_managers(monkeypatch)
    engine = ModelEngine().set_find_one(db_tenant_model, [None])
    manager = _make_manager(engine)
    _run(manager.copy_default_system_settings(_make_tenant()))
    assert engine.saved == []


def test_copy_default_system_settings_copies(monkeypatch, tmp_path):
    source_dir = tmp_path / "source"
    source_dir.mkdir()
    (source_dir / "logo_custom.png").write_bytes(b"img")
    target_dir = tmp_path / "target"
    from tests.scripts.tenant_manager.fakes import FakeResource

    resource = FakeResource(target_dir=target_dir, source_dir=source_dir)
    _patch_managers(monkeypatch, resource=resource)

    default_tenant = _make_tenant()
    settings_value = json.dumps({
        AllowedKeys.VERSION.value: "1",
        AllowedKeys.S_ONION.value: "x",
        "custom": "keep",
    })
    settings = db_system_model(tenant_id=str(default_tenant.id), key=AllowedKeys.SYSTEM_SETTINGS, value=settings_value)
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [default_tenant])
    engine.set_find_one(db_system_model, [settings])
    manager = _make_manager(engine)

    new_tenant = _make_tenant()
    _run(manager.copy_default_system_settings(new_tenant))

    saved = engine.saved[0]
    stored = json.loads(saved.value)
    assert stored["custom"] == "keep"
    assert AllowedKeys.VERSION.value not in stored
    assert stored[AllowedKeys.AI_ENDPOINT_ENABLED.value] == "0"
    assert (target_dir / "logo_custom.png").exists()


def test_copy_default_system_settings_target_dir_none(monkeypatch):
    from tests.scripts.tenant_manager.fakes import FakeResource

    _patch_managers(monkeypatch, resource=FakeResource(target_dir=None))
    default_tenant = _make_tenant()
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [default_tenant])
    engine.set_find_one(db_system_model, [None])
    manager = _make_manager(engine)
    _run(manager.copy_default_system_settings(_make_tenant()))
    assert engine.saved == []


def test_create_tenant_success(monkeypatch):
    _patch_managers(monkeypatch)
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [None])
    manager = _make_manager(engine)
    tenant = db_tenant_model(name="Acme", email="user@acme.com", iocs=[])
    _run(manager.create_tenant(tenant))
    assert tenant.status == TenantStatus.ONBOARDING
    assert tenant.slug == "acme"
    assert tenant in engine.saved


def test_create_tenant_cleans_up_on_failure(monkeypatch):
    _patch_managers(monkeypatch)
    engine = ModelEngine()
    engine.save_raises = True
    manager = _make_manager(engine)
    tenant = db_tenant_model(name="Acme", email="user@acme.com", iocs=[])
    with pytest.raises(RuntimeError):
        _run(manager.create_tenant(tenant))
    assert len(engine.removed) == 3
    assert engine.deleted == [tenant]


def test_get_tenant_not_found(monkeypatch):
    fakes = _patch_managers(monkeypatch)
    engine = ModelEngine().set_find_one(db_tenant_model, [None])
    manager = _make_manager(engine)
    current = SimpleNamespace(tenant_uuid="507f1f77bcf86cd799439011", id="u1")
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_tenant(current))
    assert exc.value.status_code == 403
    assert fakes.audit.calls


def test_get_tenant_success(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant(iocs=[_enc_ioc("m_domain", "Domains", ["acme.com"])])
    settings = db_system_model(
        tenant_id=str(tenant.id),
        key=AllowedKeys.SYSTEM_SETTINGS,
        value=json.dumps({AllowedKeys.META_INFO.value: json.dumps({"ACCOUNTS_MAIL": "ops@acme.com", "ACCOUNTS_SMTP_SERVER": "smtp", "ACCOUNTS_SMTP_PORT": "587"})}),
    )
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [tenant])
    engine.set_find_one(db_system_model, [settings])
    manager = _make_manager(engine)
    current = SimpleNamespace(tenant_uuid=str(tenant.id), id="u1")
    result = _run(manager.get_tenant(current))
    assert result.name == "Acme"
    assert result.iocs[0].values == ["acme.com"]
    assert result.accounts_mail == "ops@acme.com"
    assert result.accounts_smtp_port == "587"


def test_get_all_tenant(monkeypatch):
    _set_env(monkeypatch, APP_URL="")
    _patch_managers(monkeypatch)
    tenant = _make_tenant(iocs=[_enc_ioc("m_email", "Emails", ["user@acme.com"])])
    maintainer = SimpleNamespace(tenant_uuid=str(tenant.id), password_reset_required=True)
    engine = ModelEngine()
    engine.set_find(db_tenant_model, [tenant])
    engine.set_find(db_user_account, [maintainer])
    engine.set_find_one(db_system_model, [None])
    manager = _make_manager(engine)
    result = _run(manager.get_all_tenant())
    assert result[0]["name"] == "Acme"
    assert result[0]["email"] == "user@acme.com"
    assert result[0]["password_reset_required"] is True
    assert result[0]["accounts_mail"] == ""


def test_delete_tenant_rejects_non_admin(monkeypatch):
    manager = _make_manager()
    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_tenant("507f1f77bcf86cd799439011", SimpleNamespace(role=user_role.MEMBER)))
    assert exc.value.status_code == 403


def test_delete_tenant_invalid_id():
    manager = _make_manager()
    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_tenant("not-an-id", SimpleNamespace(role=user_role.ADMIN)))
    assert exc.value.status_code == 404


def test_delete_tenant_not_found():
    engine = ModelEngine().set_find_one(db_tenant_model, [None])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_tenant("507f1f77bcf86cd799439011", SimpleNamespace(role=user_role.ADMIN)))
    assert exc.value.status_code == 404


def test_delete_tenant_default():
    tenant = _make_tenant(is_default=True)
    engine = ModelEngine().set_find_one(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_tenant(str(tenant.id), SimpleNamespace(role=user_role.ADMIN)))
    assert exc.value.status_code == 403


def test_delete_tenant_success():
    tenant = _make_tenant()
    users = [SimpleNamespace(id="507f1f77bcf86cd799439013"), SimpleNamespace(id="507f1f77bcf86cd799439014")]
    engine = ModelEngine().set_find_one(db_tenant_model, [tenant]).set_find(db_user_account, users)
    manager = _make_manager(engine)
    result = _run(manager.delete_tenant(str(tenant.id), SimpleNamespace(role=user_role.ADMIN)))
    assert result == {"message": "Tenant deleted successfully"}
    assert len(engine.removed) == 4
    assert engine.deleted == [tenant]


def test_dismiss_stealer_log_all_tenants():
    engine = ModelEngine()
    engine.collection = FakeCollection(modified_count=2)
    manager = _make_manager(engine)
    result = _run(manager.dismiss_stealer_log("507f1f77bcf86cd799439011", "hash", "u1", all_tenants=True))
    assert result == {"status": "dismissed"}


def test_dismiss_stealer_log_invalid_tenant():
    engine = ModelEngine()
    engine.collection = FakeCollection()
    manager = _make_manager(engine)
    result = _run(manager.dismiss_stealer_log("bad", "hash", "u1"))
    assert result == {"status": "invalid_tenant"}


def test_dismiss_stealer_log_single_already_dismissed():
    engine = ModelEngine()
    engine.collection = FakeCollection(modified_count=0)
    manager = _make_manager(engine)
    result = _run(manager.dismiss_stealer_log("507f1f77bcf86cd799439011", "hash", "u1"))
    assert result == {"status": "already_dismissed"}


def test_dismiss_stealer_log_single_dismissed():
    engine = ModelEngine()
    engine.collection = FakeCollection(modified_count=1)
    manager = _make_manager(engine)
    result = _run(manager.dismiss_stealer_log("507f1f77bcf86cd799439011", "hash", "u1", dismissed_ioc_type=DismissedIocType.BREACH))
    assert result == {"status": "dismissed"}


def test_restore_stealer_log_all_tenants():
    engine = ModelEngine()
    engine.collection = FakeCollection(modified_count=0)
    manager = _make_manager(engine)
    result = _run(manager.restore_stealer_log("507f1f77bcf86cd799439011", "hash", all_tenants=True))
    assert result == {"status": "not_dismissed"}


def test_restore_stealer_log_invalid_tenant():
    engine = ModelEngine()
    engine.collection = FakeCollection()
    manager = _make_manager(engine)
    assert _run(manager.restore_stealer_log("bad", "hash")) == {"status": "invalid_tenant"}


def test_restore_stealer_log_single_restored():
    engine = ModelEngine()
    engine.collection = FakeCollection(modified_count=1)
    manager = _make_manager(engine)
    assert _run(manager.restore_stealer_log("507f1f77bcf86cd799439011", "hash")) == {"status": "restored"}


def test_restore_stealer_log_single_not_dismissed():
    engine = ModelEngine()
    engine.collection = FakeCollection(modified_count=0)
    manager = _make_manager(engine)
    assert _run(manager.restore_stealer_log("507f1f77bcf86cd799439011", "hash")) == {"status": "not_dismissed"}


def _alert(**overrides):
    data = dict(type="leak", is_deleted=False)
    data.update(overrides)
    return AlertModel(**data)


def test_collect_tenant_alerts_no_alerts_paginate():
    engine = ModelEngine().set_find_one(db_alert_model, [None])
    manager = _make_manager(engine)
    result = _run(manager._collect_tenant_alerts("t1", 1, 20, None, True))
    assert result["total"] == 0
    assert result["has_more"] is False


def test_collect_tenant_alerts_no_alerts_list():
    engine = ModelEngine().set_find_one(db_alert_model, [None])
    manager = _make_manager(engine)
    assert _run(manager._collect_tenant_alerts("t1", 1, 20, None, False)) == []


def test_collect_tenant_alerts_filter_and_list():
    doc = db_alert_model(tenant_id="t1", alerts=[_alert(type="leak"), _alert(type="breach")])
    engine = ModelEngine().set_find_one(db_alert_model, [doc])
    manager = _make_manager(engine)
    result = _run(manager._collect_tenant_alerts("t1", 1, 20, "LEAK", False))
    assert len(result) == 1
    assert result[0].type == "leak"


def test_collect_tenant_alerts_pagination():
    now = datetime.now(timezone.utc)
    alerts = [_alert(last_seen=now - timedelta(days=i)) for i in range(5)]
    doc = db_alert_model(tenant_id="t1", alerts=alerts)
    engine = ModelEngine().set_find_one(db_alert_model, [doc])
    manager = _make_manager(engine)
    result = _run(manager._collect_tenant_alerts("t1", 2, 2, None, True))
    assert result["total"] == 5
    assert result["page"] == 2
    assert len(result["items"]) == 2
    assert result["has_more"] is True


def test_get_visible_tenant_alerts_not_visible(monkeypatch):
    _patch_managers(monkeypatch)
    manager = _make_manager(ModelEngine().set_find(db_tenant_model, []))
    current = SimpleNamespace(role="admin")
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_visible_tenant_alerts("507f1f77bcf86cd799439011", current))
    assert exc.value.status_code == 404


def test_get_visible_tenant_alerts_invalid_id(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()

    class _Engine(ModelEngine):
        async def find(self, model, *a, **k):
            return [tenant]

    engine = _Engine()
    manager = _make_manager(engine)
    monkeypatch.setattr(manager, "resolve_visible_alert_tenant_ids_for_user", lambda cu: __import__("asyncio").sleep(0, result=["bad-id"]))
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_visible_tenant_alerts("bad-id", SimpleNamespace(role="admin")))
    assert exc.value.status_code == 404


def test_get_visible_tenant_alerts_tenant_missing(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    engine = ModelEngine().set_find(db_tenant_model, [tenant]).set_find_one(db_tenant_model, [None])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_visible_tenant_alerts(str(tenant.id), SimpleNamespace(role="admin")))
    assert exc.value.status_code == 404


def test_get_visible_tenant_alerts_success(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    doc = db_alert_model(tenant_id=str(tenant.id), alerts=[_alert()])
    engine = ModelEngine()
    engine.set_find(db_tenant_model, [tenant])
    engine.set_find_one(db_tenant_model, [tenant])
    engine.set_find_one(db_alert_model, [doc])
    manager = _make_manager(engine)
    result = _run(manager.get_visible_tenant_alerts(str(tenant.id), SimpleNamespace(role="admin")))
    assert len(result) == 1


def test_get_admin_tenant_alerts_missing(monkeypatch):
    _patch_managers(monkeypatch)
    engine = ModelEngine().set_find_one(db_tenant_model, [None])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_admin_tenant_alerts("507f1f77bcf86cd799439011"))
    assert exc.value.status_code == 404


def test_get_admin_tenant_alerts_success(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    doc = db_alert_model(tenant_id=str(tenant.id), alerts=[_alert()])
    engine = ModelEngine().set_find_one(db_tenant_model, [tenant]).set_find_one(db_alert_model, [doc])
    manager = _make_manager(engine)
    result = _run(manager.get_admin_tenant_alerts(str(tenant.id), paginate=True))
    assert result["total"] == 1


def test_get_visible_tenant_alerts_summary_empty(monkeypatch):
    _patch_managers(monkeypatch)
    manager = _make_manager(ModelEngine().set_find(db_tenant_model, []))
    assert _run(manager.get_visible_tenant_alerts_summary(SimpleNamespace(role="admin"))) == []


def test_get_visible_tenant_alerts_summary(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant(status=TenantStatus.ACTIVE)
    engine = ModelEngine().set_find(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    result = _run(manager.get_visible_tenant_alerts_summary(SimpleNamespace(role="admin")))
    assert result[0]["tenant"]["name"] == "Acme"


def test_get_visible_tenant_alert_filter_options(monkeypatch):
    _patch_managers(monkeypatch)
    monkeypatch.setattr(
        "orion.api.interactive.alert_manager.alert_manager.AlertManager.filter_option_values",
        staticmethod(lambda alerts, field, query, limit: ["leak"]),
    )
    tenant = _make_tenant()
    doc = db_alert_model(tenant_id=str(tenant.id), alerts=[_alert()])
    engine = ModelEngine()
    engine.set_find(db_tenant_model, [tenant])
    engine.set_find_one(db_tenant_model, [tenant])
    engine.set_find_one(db_alert_model, [doc])
    manager = _make_manager(engine)
    result = _run(manager.get_visible_tenant_alert_filter_options(str(tenant.id), SimpleNamespace(role="admin"), "type"))
    assert result == {"values": ["leak"]}


def test_get_admin_tenant_alert_filter_options(monkeypatch):
    _patch_managers(monkeypatch)
    monkeypatch.setattr(
        "orion.api.interactive.alert_manager.alert_manager.AlertManager.filter_option_values",
        staticmethod(lambda alerts, field, query, limit: ["breach"]),
    )
    tenant = _make_tenant()
    doc = db_alert_model(tenant_id=str(tenant.id), alerts=[_alert()])
    engine = ModelEngine().set_find_one(db_tenant_model, [tenant]).set_find_one(db_alert_model, [doc])
    manager = _make_manager(engine)
    result = _run(manager.get_admin_tenant_alert_filter_options(str(tenant.id), "type"))
    assert result == {"values": ["breach"]}


def test_apply_tenant_system_settings_with_record(monkeypatch):
    _patch_managers(monkeypatch)
    settings = db_system_model(
        tenant_id="t1",
        key=AllowedKeys.SYSTEM_SETTINGS,
        value=json.dumps({
            AllowedKeys.META_INFO.value: json.dumps({"ACCOUNTS_MAIL": "ops@acme.com", "ACCOUNTS_SMTP_SERVER": "smtp", "ACCOUNTS_SMTP_PORT": "25"}),
            AllowedKeys.AI_ENDPOINT_ENABLED.value: "1",
        }),
    )
    engine = ModelEngine().set_find_one(db_system_model, [settings])
    manager = _make_manager(engine)
    data = {}
    _run(manager._apply_tenant_system_settings(data, "t1"))
    assert data["accounts_mail"] == "ops@acme.com"
    assert data["ai_endpoint_enabled"] is True


def _tenant_request(tenant_id, **overrides):
    data = dict(id=tenant_id, name="Acme New")
    data.update(overrides)
    return TenantRequest(**data)


def _admin_user(tenant_id):
    return SimpleNamespace(
        role="admin",
        tenant_uuid=tenant_id,
        id="u1",
        username="admin",
        licenses=["maintainer"],
    )


def test_update_tenant_not_found(monkeypatch):
    fakes = _patch_managers(monkeypatch)
    engine = ModelEngine().set_find_one(db_tenant_model, [None])
    manager = _make_manager(engine)
    tenant_id = "507f1f77bcf86cd799439011"
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_tenant(_tenant_request(tenant_id), _admin_user(tenant_id)))
    assert exc.value.status_code == 401
    assert fakes.audit.calls


def test_update_tenant_default_rejected(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant(is_default=True)
    engine = ModelEngine().set_find_one(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_tenant(_tenant_request(str(tenant.id)), _admin_user(str(tenant.id))))
    assert exc.value.status_code == 401


def test_update_tenant_privileged_ioc_non_admin(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    engine = ModelEngine().set_find_one(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", tenant_uuid=str(tenant.id), id="u1", username="bob", licenses=["free"])
    data = _tenant_request(str(tenant.id), privileged_ioc=True)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_tenant(data, current))
    assert exc.value.status_code == 403


def test_update_tenant_iocs_non_admin_without_privilege(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant(privileged_ioc=False)
    engine = ModelEngine().set_find_one(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", tenant_uuid=str(tenant.id), id="u1", username="bob", licenses=["free"])
    data = _tenant_request(str(tenant.id), iocs=[IocCategory(ioc_id="x", name="X", values=["1"])])
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_tenant(data, current))
    assert exc.value.status_code == 403


def test_update_tenant_admin_full(monkeypatch):
    _set_env(monkeypatch, APP_URL="")
    _patch_managers(monkeypatch)
    tenant = _make_tenant(alerts_visible_to_admin=True, privileged_ioc=False)
    maintainer_user = SimpleNamespace(licenses=[LicenseName.MAINTAINER], status=UserStatus.ACTIVE)
    other_user = SimpleNamespace(licenses=[LicenseName.OSINT_BASIC], status=UserStatus.ACTIVE)
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [tenant])
    engine.set_find(db_user_account, [maintainer_user, other_user])
    engine.set_find_one(db_system_model, [None])
    engine.set_find_one(db_alert_model, [None])
    engine.count_result = 1
    manager = _make_manager(engine)

    data = _tenant_request(
        str(tenant.id),
        verified=True,
        user_quota=5,
        status=TenantStatus.ACTIVE,
        licenses=["free"],
        profile_visibility_enabled=True,
        event_management_enabled=True,
        alerts_visible_to_admin=False,
        privileged_ioc=True,
        alert_run_time="10:00",
        allowed_alert_categories=["a", "A", "b"],
    )
    result = _run(manager.update_tenant(data, _admin_user(str(tenant.id))))
    assert result["message"] == "Tenant updated"
    assert result["tenant"]["name"] == "Acme New"
    assert tenant.privileged_ioc is True
    assert maintainer_user.licenses == ["maintainer"]
    assert other_user.status == UserStatus.DISABLE


def test_update_tenant_admin_negative_quota_and_excess(monkeypatch):
    _set_env(monkeypatch, APP_URL="")
    _patch_managers(monkeypatch)
    tenant = _make_tenant(user_quota=1)
    extra_user = SimpleNamespace(licenses=[LicenseName.FREE], status=UserStatus.ACTIVE)
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [tenant])
    engine.set_find(db_user_account, [extra_user])
    engine.set_find_one(db_system_model, [None])
    engine.set_find_one(db_alert_model, [None])
    engine.count_result = 3
    manager = _make_manager(engine)
    data = _tenant_request(str(tenant.id), user_quota=-5)
    result = _run(manager.update_tenant(data, _admin_user(str(tenant.id))))
    assert tenant.user_quota == 0
    assert result["message"] == "Tenant updated"


def test_update_tenant_maintainer_license_non_admin_rejected(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [tenant])
    engine.set_find_one(db_system_model, [None])
    engine.set_find_one(db_alert_model, [None])
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", tenant_uuid=str(tenant.id), id="u1", username="bob", licenses=["free"])
    data = _tenant_request(str(tenant.id), licenses=["maintainer"])
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_tenant(data, current))
    assert exc.value.status_code == 401


def test_update_tenant_smtp_submitted(monkeypatch):
    _set_env(monkeypatch, APP_URL="")
    fakes = _patch_managers(monkeypatch)
    tenant = _make_tenant()
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [tenant])
    engine.set_find_one(db_system_model, [None, None])
    engine.set_find_one(db_alert_model, [None])
    manager = _make_manager(engine)
    data = _tenant_request(
        str(tenant.id),
        accounts_mail="ops@acme.com",
        accounts_smtp_server="smtp.acme.com",
        accounts_smtp_port="587",
        accounts_mail_password="secret",
    )
    result = _run(manager.update_tenant(data, _admin_user(str(tenant.id))))
    assert result["message"] == "Tenant updated"
    assert fakes.mail.test_calls
    assert fakes.config.load_calls


def test_update_tenant_ai_endpoint_enabled(monkeypatch):
    _set_env(monkeypatch, APP_URL="")
    fakes = _patch_managers(monkeypatch, config_cached="1")
    tenant = _make_tenant()
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [tenant])
    engine.set_find_one(db_system_model, [None, None])
    engine.set_find_one(db_alert_model, [None])
    manager = _make_manager(engine)
    data = _tenant_request(str(tenant.id), ai_endpoint_enabled=True)
    result = _run(manager.update_tenant(data, _admin_user(str(tenant.id))))
    assert result["message"] == "Tenant updated"
    assert fakes.config.load_calls


def test_update_tenant_ai_endpoint_admin_not_enabled(monkeypatch):
    _patch_managers(monkeypatch, config_cached="0")
    tenant = _make_tenant()
    engine = ModelEngine().set_find_one(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    data = _tenant_request(str(tenant.id), ai_endpoint_enabled=True)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_tenant(data, _admin_user(str(tenant.id))))
    assert exc.value.status_code == 403


def test_update_tenant_ai_endpoint_non_admin(monkeypatch):
    _patch_managers(monkeypatch)
    tenant = _make_tenant()
    engine = ModelEngine().set_find_one(db_tenant_model, [tenant])
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", tenant_uuid=str(tenant.id), id="u1", username="bob", licenses=["free"])
    data = _tenant_request(str(tenant.id), ai_endpoint_enabled=True)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_tenant(data, current))
    assert exc.value.status_code == 403


def test_update_tenant_password_reset_and_member_activate(monkeypatch):
    _set_env(monkeypatch, APP_URL="")
    _patch_managers(monkeypatch)
    tenant = _make_tenant(status=TenantStatus.ONBOARDING)
    maintainer = SimpleNamespace(password_reset_required=False)
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [tenant])
    engine.set_find_one(db_user_account, [maintainer])
    engine.set_find_one(db_system_model, [None])
    engine.set_find_one(db_alert_model, [None])
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", tenant_uuid=str(tenant.id), id="u1", username="bob", licenses=["free"])
    data = _tenant_request(str(tenant.id), password_reset_required=True, status=TenantStatus.ACTIVE)
    result = _run(manager.update_tenant(data, current))
    assert maintainer.password_reset_required is True
    assert tenant.status == TenantStatus.ACTIVE
    assert result["message"] == "Tenant updated"


def _new_user_model(**overrides):
    data = dict(
        username="newuser01",
        email="newuser@acme.com",
        password="Password1!",
        role=user_role.MEMBER,
        status=UserStatus.ACTIVE,
        subscription=False,
        licenses=[LicenseName.FREE],
        permissions=[],
        alerts_allowed_all=False,
        alerts_allowed_tenant_ids=[],
    )
    data.update(overrides)
    return user_model(**data)


def test_create_tenant_user_success(monkeypatch):
    _set_env(monkeypatch, APP_URL="http://localhost:4200", TENANT_BASE_DOMAIN="")
    tenant = _make_tenant()
    engine = ModelEngine()
    engine.set_find_one(db_user_account, [None, None])
    engine.set_find_one(db_tenant_model, [tenant])
    engine.count_result = 0
    fakes = _patch_managers(monkeypatch, engine=engine)
    manager = _make_manager(engine)
    current = SimpleNamespace(role="admin", tenant_uuid=str(tenant.id), id="u1", username="admin")
    result = _run(manager.create_tenant_user(_new_user_model(), current))
    assert result["username"] == "newuser01"
    assert result["tenant_uuid"] == str(tenant.id)
    assert "free" in result["allowed_licenses"]
    assert fakes.mail.sent


def test_create_tenant_user_maintainer_denied(monkeypatch):
    engine = ModelEngine()
    _patch_managers(monkeypatch, engine=engine)
    manager = _make_manager(engine)
    current = SimpleNamespace(role="admin", tenant_uuid="507f1f77bcf86cd799439011", id="u1", username="admin")
    data = _new_user_model(licenses=[LicenseName.MAINTAINER])
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_tenant_user(data, current))
    assert exc.value.status_code == 403


def test_create_tenant_user_no_tenant_uuid(monkeypatch):
    engine = ModelEngine()
    engine.set_find_one(db_user_account, [None, None])
    _patch_managers(monkeypatch, engine=engine)
    manager = _make_manager(engine)
    current = SimpleNamespace(role="admin", tenant_uuid="", id="u1", username="admin")
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_tenant_user(_new_user_model(), current))
    assert exc.value.status_code == 400


def test_create_tenant_user_tenant_not_found(monkeypatch):
    engine = ModelEngine()
    engine.set_find_one(db_user_account, [None, None])
    engine.set_find_one(db_tenant_model, [None])
    _patch_managers(monkeypatch, engine=engine)
    manager = _make_manager(engine)
    current = SimpleNamespace(role="admin", tenant_uuid="507f1f77bcf86cd799439011", id="u1", username="admin")
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_tenant_user(_new_user_model(), current))
    assert exc.value.status_code == 400


def test_create_tenant_user_quota_exceeded(monkeypatch):
    tenant = _make_tenant(user_quota=1)
    engine = ModelEngine()
    engine.set_find_one(db_user_account, [None, None])
    engine.set_find_one(db_tenant_model, [tenant])
    engine.count_result = 1
    _patch_managers(monkeypatch, engine=engine)
    manager = _make_manager(engine)
    current = SimpleNamespace(role="admin", tenant_uuid=str(tenant.id), id="u1", username="admin")
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_tenant_user(_new_user_model(), current))
    assert exc.value.status_code == 400


def test_create_tenant_user_demo_denied_for_non_admin(monkeypatch):
    fakes = _patch_managers(monkeypatch)
    tenant = _make_tenant()
    engine = ModelEngine()
    engine.set_find_one(db_user_account, [None, None])
    engine.set_find_one(db_tenant_model, [tenant])
    engine.count_result = 0
    fakes = _patch_managers(monkeypatch, engine=engine)
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", tenant_uuid=str(tenant.id), id="u1", username="bob")
    data = _new_user_model(role="demo", email="demo@acme.com")
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_tenant_user(data, current))
    assert exc.value.status_code == 401


def test_create_tenant_user_license_not_allowed(monkeypatch):
    tenant = _make_tenant(licenses=[_e("free")])
    engine = ModelEngine()
    engine.set_find_one(db_user_account, [None, None])
    engine.set_find_one(db_tenant_model, [tenant])
    engine.count_result = 0
    _patch_managers(monkeypatch, engine=engine)
    manager = _make_manager(engine)
    current = SimpleNamespace(role="member", tenant_uuid=str(tenant.id), id="u1", username="bob")
    data = _new_user_model(licenses=[LicenseName.OSINT_BASIC])
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_tenant_user(data, current))
    assert exc.value.status_code == 400


def test_create_tenant_user_orion_mail_denied(monkeypatch):
    tenant = _make_tenant()
    engine = ModelEngine()
    engine.set_find_one(db_user_account, [None, None])
    engine.set_find_one(db_tenant_model, [tenant])
    engine.count_result = 0
    _patch_managers(monkeypatch, engine=engine)
    manager = _make_manager(engine)
    current = SimpleNamespace(role="admin", tenant_uuid=str(tenant.id), id="u1", username="admin")
    data = _new_user_model(permissions=[UserPermission.ORION_MAIL])
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_tenant_user(data, current))
    assert exc.value.status_code == 403


def test_create_tenant_user_generic_error_wrapped(monkeypatch):
    engine = ModelEngine()
    engine.set_find_one(db_user_account, [None, None])
    _patch_managers(monkeypatch, engine=engine)
    manager = _make_manager(engine)
    monkeypatch.setattr(
        TenantManager,
        "validate_company_email",
        staticmethod(lambda email, detail=None: (_ for _ in ()).throw(RuntimeError("boom"))),
    )
    current = SimpleNamespace(role="admin", tenant_uuid="507f1f77bcf86cd799439011", id="u1", username="admin")
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_tenant_user(_new_user_model(), current))
    assert exc.value.status_code == 400
    assert "boom" in exc.value.detail
