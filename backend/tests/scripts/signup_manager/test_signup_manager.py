from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import orion.api.interactive.signup_manager.signup_manager as signup_module
from orion.api.interactive.signup_manager.model.signup_request_model import SignupRequest
from orion.api.interactive.signup_manager.signup_manager import SignupManager
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model
from tests.scripts.tenant_manager.fakes import FakeMail, ModelEngine
from tests.scripts.tenant_manager.helpers import _make_tenant, _run


def _signup_request():
    return SignupRequest(username="customer01", email="owner@customer.com", password="Password1!")


def _patch_signup(monkeypatch, engine, child_tenant_ids=None, pool_user_count=0):
    mail = FakeMail()
    created_tenants = []

    async def get_quota_scope(tenant):
        return tenant, [str(tenant.id), *(child_tenant_ids or [])]

    async def count_pool_users(_tenant_ids, active_only=False):
        return pool_user_count

    async def create_tenant(tenant):
        created_tenants.append(tenant)

    monkeypatch.setattr(signup_module.mongo_controller, "get_instance", staticmethod(lambda: SimpleNamespace(get_engine=lambda: engine)))
    monkeypatch.setattr(signup_module.mail_manager, "get_instance", staticmethod(lambda: mail))
    monkeypatch.setattr(signup_module.session_manager, "get_instance", staticmethod(lambda: SimpleNamespace(generate_verification_token=lambda: "verify-token")))
    monkeypatch.setattr(signup_module.TenantManager, "get_instance", staticmethod(lambda: SimpleNamespace(get_quota_scope=get_quota_scope, create_tenant=create_tenant, count_pool_users=count_pool_users)))
    monkeypatch.setattr(signup_module.env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda key, default=None: "http://localhost:4200" if key == "APP_URL" else "")))
    monkeypatch.setattr(signup_module.constant, "mail_template", SimpleNamespace(render=lambda **kwargs: kwargs["url"]))
    return mail, created_tenants


def test_signup_from_default_url_creates_standalone_tenant(monkeypatch):
    default_tenant = _make_tenant(is_default=True)
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [default_tenant, SimpleNamespace(parent_tenant_id=None)])
    engine.set_find_one(db_user_account, [None, None])
    mail, created_tenants = _patch_signup(monkeypatch, engine)

    _run(SignupManager.signup_user(_signup_request(), tenant_id=str(default_tenant.id)))

    assert created_tenants[0].parent_tenant_id is None
    assert mail.validate_calls == [None]
    assert mail.sent[0][2] == "http://localhost:4200/welcome/verify-token"


def test_signup_from_primary_tenant_url_creates_sub_tenant(monkeypatch):
    primary = _make_tenant(is_primary=True, user_quota=15, tenant_quota=5, slug="acme")
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [primary, SimpleNamespace(parent_tenant_id=str(primary.id)), primary])
    engine.set_find_one(db_user_account, [None, None])
    engine.count_result = 1
    mail, created_tenants = _patch_signup(monkeypatch, engine)

    result = _run(SignupManager.signup_user(_signup_request(), tenant_id=str(primary.id)))

    assert result["status"] == "pending"
    assert created_tenants[0].parent_tenant_id == str(primary.id)
    assert mail.validate_calls == [str(primary.id)]
    assert mail.sent[0][2] == "http://acme.localhost:4200/welcome/verify-token"


def test_signup_rejected_from_standalone_tenant_url(monkeypatch):
    tenant = _make_tenant()
    engine = ModelEngine().set_find_one(db_tenant_model, [tenant])
    _, created_tenants = _patch_signup(monkeypatch, engine)

    with pytest.raises(HTTPException) as exc:
        _run(SignupManager.signup_user(_signup_request(), tenant_id=str(tenant.id)))

    assert exc.value.status_code == 400
    assert created_tenants == []


def test_signup_from_primary_tenant_url_respects_tenant_quota(monkeypatch):
    primary = _make_tenant(is_primary=True, user_quota=15, tenant_quota=1)
    engine = ModelEngine().set_find_one(db_tenant_model, [primary])
    _, created_tenants = _patch_signup(monkeypatch, engine, child_tenant_ids=["507f1f77bcf86cd799439099"])

    with pytest.raises(HTTPException) as exc:
        _run(SignupManager.signup_user(_signup_request(), tenant_id=str(primary.id)))

    assert exc.value.detail == "Tenant quota exceeded"
    assert created_tenants == []


def test_sub_tenant_signup_inherits_primary_maintainer_language(monkeypatch):
    primary = _make_tenant(is_primary=True, user_quota=15, tenant_quota=5, slug="acme")
    primary_maintainer = SimpleNamespace(tenant_id=str(primary.id), email="owner@acme.com", preferences={"language": "es"})
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [primary, SimpleNamespace(parent_tenant_id=str(primary.id)), primary])
    engine.set_find_one(db_user_account, [None, None])
    engine.set_find(db_user_account, [primary_maintainer])
    _, created_tenants = _patch_signup(monkeypatch, engine)

    _run(SignupManager.signup_user(_signup_request(), tenant_id=str(primary.id)))

    assert engine.saved[-1].preferences == {"language": "es"}


def test_sub_tenant_signup_gets_default_quota_when_primary_has_capacity(monkeypatch):
    primary = _make_tenant(is_primary=True, user_quota=15, tenant_quota=5, slug="acme")
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [primary, SimpleNamespace(parent_tenant_id=str(primary.id)), primary])
    engine.set_find_one(db_user_account, [None, None])
    _, created_tenants = _patch_signup(monkeypatch, engine, pool_user_count=5)

    _run(SignupManager.signup_user(_signup_request(), tenant_id=str(primary.id)))

    assert created_tenants[0].user_quota == 1


def test_sub_tenant_signup_gets_zero_quota_when_primary_capacity_exhausted(monkeypatch):
    primary = _make_tenant(is_primary=True, user_quota=15, tenant_quota=5, slug="acme")
    engine = ModelEngine()
    engine.set_find_one(db_tenant_model, [primary, SimpleNamespace(parent_tenant_id=str(primary.id)), primary])
    engine.set_find_one(db_user_account, [None, None])
    _, created_tenants = _patch_signup(monkeypatch, engine, pool_user_count=15)

    _run(SignupManager.signup_user(_signup_request(), tenant_id=str(primary.id)))

    assert created_tenants[0].user_quota == 0
