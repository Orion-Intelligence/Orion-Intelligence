from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role
from orion.services.mongo_manager.shared_model.db_tenant_model import TenantStatus


class _FakeEngine:
    def __init__(self, maintainer_user=None, tenant=None):
        self.maintainer_user = maintainer_user
        self.tenant = tenant

    async def find_one(self, model, *_args, **_kwargs):
        name = getattr(model, "__name__", "")
        if name == "db_user_account":
            return self.maintainer_user
        if name == "db_tenant_model":
            return self.tenant
        return None


class _FakeMongoController:
    def __init__(self, engine):
        self._engine = engine

    def get_engine(self):
        return self._engine


class _FakeSessionManager:
    async def create_access_token(self, *_, **__):
        return "token-123", "member"

    async def has_onboarding(self, *_):
        return True

    async def create_temp_token(self, *_args, **_kwargs):
        return "temp-token"


class _FakeAudit:
    async def register(self, *_):
        return None


def _user(**kwargs):
    defaults = dict(
        id="u1",
        username="member_123",
        email="member@example.com",
        tenant_uuid="507f1f77bcf86cd799439012",
        role=user_role.MEMBER,
        status=UserStatus.ACTIVE,
        subscription=True,
        account_verify_at=datetime.now(timezone.utc),
        twofa_enabled=False,
        twofa_secret=None,
        licenses=[LicenseName.FREE],
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def _patch_login_dependencies(monkeypatch, authenticated_user, maintainer_user=None, tenant=None):
    fake_auth_instance = SimpleNamespace(authenticate_user=authenticated_user)
    monkeypatch.setattr(auth_manager, "get_instance", staticmethod(lambda: fake_auth_instance))

    from orion.services.mongo_manager.mongo_controller import mongo_controller

    engine = _FakeEngine(maintainer_user=maintainer_user, tenant=tenant)
    monkeypatch.setattr(mongo_controller, "get_instance", staticmethod(lambda: _FakeMongoController(engine)))

    from orion.services.session_manager.session_manager import session_manager

    monkeypatch.setattr(session_manager, "get_instance", staticmethod(lambda: _FakeSessionManager()))

    from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager

    monkeypatch.setattr(AuditLogManager, "get_instance", staticmethod(lambda: _FakeAudit()))


def test_login_fails_with_invalid_credentials(monkeypatch):
    async def _auth_none(*_):
        return None

    fake_auth_instance = SimpleNamespace(authenticate_user=_auth_none)
    monkeypatch.setattr(auth_manager, "get_instance", staticmethod(lambda: fake_auth_instance))

    with pytest.raises(HTTPException) as ex:
        asyncio.run(auth_manager.login("bad", "bad"))

    assert ex.value.status_code == 401


def test_login_fails_for_unverified_tenant(monkeypatch):
    user = _user()
    maintainer = _user(role=user_role.ADMIN, licenses=[LicenseName.MAINTAINER])
    tenant = SimpleNamespace(verified=False, status=TenantStatus.ACTIVE)
    _patch_login_dependencies(monkeypatch, authenticated_user=_async(user), maintainer_user=maintainer, tenant=tenant)

    with pytest.raises(HTTPException) as ex:
        asyncio.run(auth_manager.login("member@example.com", "pass"))

    assert ex.value.status_code == 401
    assert "approval pending" in ex.value.detail


def test_login_fails_for_disabled_tenant(monkeypatch):
    user = _user()
    maintainer = _user(role=user_role.ADMIN, licenses=[LicenseName.MAINTAINER])
    tenant = SimpleNamespace(verified=True, status=TenantStatus.DISABLE)
    _patch_login_dependencies(monkeypatch, authenticated_user=_async(user), maintainer_user=maintainer, tenant=tenant)

    with pytest.raises(HTTPException) as ex:
        asyncio.run(auth_manager.login("member@example.com", "pass"))

    assert ex.value.status_code == 401
    assert "account blocked" in ex.value.detail


def test_login_fails_for_disabled_user(monkeypatch):
    user = _user(status=UserStatus.DISABLE)
    maintainer = _user(role=user_role.ADMIN, licenses=[LicenseName.MAINTAINER])
    tenant = SimpleNamespace(verified=True, status=TenantStatus.ACTIVE)
    _patch_login_dependencies(monkeypatch, authenticated_user=_async(user), maintainer_user=maintainer, tenant=tenant)

    with pytest.raises(HTTPException) as ex:
        asyncio.run(auth_manager.login("member@example.com", "pass"))

    assert ex.value.status_code == 401


def test_login_blocks_trial_expired_member(monkeypatch):
    user = _user(subscription=False)
    maintainer = _user(
        role=user_role.ADMIN,
        licenses=[LicenseName.MAINTAINER],
        account_verify_at=datetime.now(timezone.utc) - timedelta(days=31),
    )
    tenant = SimpleNamespace(verified=True, status=TenantStatus.ACTIVE)
    _patch_login_dependencies(monkeypatch, authenticated_user=_async(user), maintainer_user=maintainer, tenant=tenant)

    with pytest.raises(HTTPException) as ex:
        asyncio.run(auth_manager.login("member@example.com", "pass"))

    assert ex.value.status_code == 402


def test_login_returns_2fa_challenge(monkeypatch):
    user = _user(twofa_enabled=True, twofa_secret="ABCDEF")
    _patch_login_dependencies(monkeypatch, authenticated_user=_async(user), maintainer_user=None, tenant=None)

    out = asyncio.run(auth_manager.login("member@example.com", "pass"))
    assert out["twofa_required"] is True
    assert out["temp_token"] == "temp-token"


def test_login_success_for_member(monkeypatch):
    user = _user(subscription=True)
    maintainer = _user(role=user_role.ADMIN, licenses=[LicenseName.MAINTAINER])
    tenant = SimpleNamespace(verified=True, status=TenantStatus.ACTIVE)
    _patch_login_dependencies(monkeypatch, authenticated_user=_async(user), maintainer_user=maintainer, tenant=tenant)

    out = asyncio.run(auth_manager.login("member@example.com", "pass"))
    assert out["access_token"] == "token-123"
    assert out["session"]["role"] == "member"


def _async(value):
    async def _inner(*_args, **_kwargs):
        return value

    return _inner
