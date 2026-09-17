from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

import orion.api.interactive.auth_manager.auth_manager as am_module
from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role
from orion.services.mongo_manager.shared_model.db_tenant_model import TenantStatus
from tests.scripts.auth_manager.fakes import (
    FakeLog,
    FakeMailManager,
    FakeMailTemplate,
    FakeRequest,
    FakeSessionManager,
    make_tenant,
    make_user,
)
from tests.scripts.auth_manager.helpers import (
    _run,
    make_engine,
    make_instance,
    patch_authenticate,
    patch_common,
    patch_mongo,
)


def test_get_instance_creates_and_reuses_singleton(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([]))
    monkeypatch.setattr(auth_manager, "_auth_manager__instance", None, raising=False)
    first = auth_manager.get_instance()
    second = auth_manager.get_instance()
    assert first is second
    with pytest.raises(Exception):
        auth_manager()


def test_authenticate_user_found_by_email(monkeypatch):
    patch_common(monkeypatch, verify_result=True)
    user = make_user()
    manager = make_instance(make_engine([user]))
    assert _run(manager.authenticate_user("user@example.com", "pw")) is user


def test_authenticate_user_found_by_username(monkeypatch):
    patch_common(monkeypatch, verify_result=True)
    user = make_user()
    manager = make_instance(make_engine([None, user]))
    assert _run(manager.authenticate_user("user1", "pw")) is user


def test_authenticate_user_not_found(monkeypatch):
    patch_common(monkeypatch, verify_result=True)
    manager = make_instance(make_engine([None, None]))
    assert _run(manager.authenticate_user("nobody", "pw")) is None


def test_authenticate_user_wrong_password(monkeypatch):
    patch_common(monkeypatch, verify_result=False)
    user = make_user()
    manager = make_instance(make_engine([user]))
    assert _run(manager.authenticate_user("user@example.com", "pw")) is None


def test_login_invalid_user(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, None)
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.login("x@y.com", "pw"))
    assert exc.value.status_code == 401


def test_login_account_blocked(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user(status=UserStatus.DISABLE))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.login("x@y.com", "pw"))
    assert exc.value.detail == "Account Blocked"


def test_login_twofa_with_secret(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user(twofa_enabled=True, twofa_secret="secret"))
    result = _run(auth_manager.login("x@y.com", "pw"))
    assert result["twofa_required"] is True
    assert result["temp_token"] == "temp-token"


def test_login_twofa_without_secret(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user(twofa_enabled=True, twofa_secret=None))
    result = _run(auth_manager.login("x@y.com", "pw"))
    assert result["twofa_required"] is True
    assert "provisioning_uri" in result
    assert result["twofa_secret"]


def test_login_maintainer_not_found(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user())
    patch_mongo(monkeypatch, make_engine([None]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.login("x@y.com", "pw"))
    assert exc.value.detail == "Maintainer user not found"


def test_login_no_tenant_id(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user(tenant_id=None))
    patch_mongo(monkeypatch, make_engine([make_user()]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.login("x@y.com", "pw"))
    assert exc.value.detail == "account not found"


def test_login_tenant_not_verified(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user())
    patch_mongo(monkeypatch, make_engine([make_user(), make_tenant(verified=False)]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.login("x@y.com", "pw"))
    assert exc.value.detail == "account approval pending"


def test_login_tenant_disabled(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user())
    patch_mongo(monkeypatch, make_engine([make_user(), make_tenant(status=TenantStatus.DISABLE)]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.login("x@y.com", "pw"))
    assert exc.value.detail == "account blocked"


def test_login_trial_expired(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user(subscription=False))
    maintainer = make_user(account_verify_at=datetime.now(timezone.utc) - timedelta(days=40))
    patch_mongo(monkeypatch, make_engine([maintainer, make_tenant()]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.login("x@y.com", "pw"))
    assert exc.value.status_code == 402


def test_login_member_disabled(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user(status="onboarding", subscription=True))
    patch_mongo(monkeypatch, make_engine([make_user(), make_tenant()]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.login("x@y.com", "pw"))
    assert exc.value.detail == "user currently disabled"


def test_login_password_reset_required(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user(password_reset_required=True))
    engine = patch_mongo(monkeypatch, make_engine([make_user(), make_tenant()]))
    result = _run(auth_manager.login("x@y.com", "pw"))
    assert result["session"]["password_reset_token"] == "reset-token"
    assert engine.saved


def test_login_crawler_long_expiry(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user(role=user_role.CRAWLER))
    patch_mongo(monkeypatch, make_engine([make_user(), make_tenant()]))
    result = _run(auth_manager.login("x@y.com", "pw"))
    assert result["access_token"] == "access-token"


def test_login_extension_client(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user())
    patch_mongo(monkeypatch, make_engine([make_user(), make_tenant()]))
    result = _run(auth_manager.login("x@y.com", "pw", client="extension"))
    session = FakeSessionManager.get_instance()
    assert session.access_tokens[-1][0].get("client") == "extension"
    assert result["access_token"] == "access-token"


def test_login_happy_path(monkeypatch):
    patch_common(monkeypatch)
    patch_authenticate(monkeypatch, make_user())
    patch_mongo(monkeypatch, make_engine([make_user(), make_tenant()]))
    result = _run(auth_manager.login("x@y.com", "pw"))
    assert result["token_type"] == "bearer"
    assert result["session"]["username"] == "user1"


def test_verify_user_invalid_token(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([None]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.verify_user("token"))
    assert exc.value.status_code == 404


def test_verify_user_no_expiry(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([make_user(verification_expiry=None)]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.verify_user("token"))
    assert exc.value.detail == "Verification link expired"


def test_verify_user_expired(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([make_user(verification_expiry=datetime(2000, 1, 1))]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.verify_user("token"))
    assert exc.value.status_code == 400


def test_verify_user_tenant_not_found(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([make_user(), None]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.verify_user("token"))
    assert exc.value.detail == "Tenant not found"


def test_verify_user_success_with_template(monkeypatch):
    patch_common(monkeypatch)
    monkeypatch.setattr(am_module.constant, "mail_template", FakeMailTemplate())
    engine = patch_mongo(monkeypatch, make_engine([make_user(), make_tenant()]))
    result = _run(auth_manager.verify_user("token"))
    assert "access_url" in result
    assert engine.saved
    assert FakeMailManager.get_instance().sent


def test_verify_user_success_without_template(monkeypatch):
    patch_common(monkeypatch)
    monkeypatch.setattr(am_module.constant, "mail_template", None)
    patch_mongo(monkeypatch, make_engine([make_user(), make_tenant()]))
    result = _run(auth_manager.verify_user("token"))
    assert result["message"].startswith("Email verified")


def test_update_password_invalid_link(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([None]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.update_password("token", "newpw", "tenant-1"))
    assert exc.value.detail == "Invalid Link"


def test_update_password_no_tenant(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([make_user()]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.update_password("token", "newpw", None))
    assert exc.value.status_code == 403


def test_update_password_account_not_active(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([make_user(status="onboarding")]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.update_password("token", "newpw", "tenant-1"))
    assert exc.value.detail == "Account is not active"


def test_update_password_expired(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([make_user(password_reset_expiry=datetime(2000, 1, 1))]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.update_password("token", "newpw", "tenant-1"))
    assert exc.value.status_code == 400


def test_update_password_same_password(monkeypatch):
    patch_common(monkeypatch, verify_result=True)
    patch_mongo(monkeypatch, make_engine([make_user()]))
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.update_password("token", "newpw", "tenant-1"))
    assert "different" in exc.value.detail


def test_update_password_success_resets_twofa(monkeypatch):
    patch_common(monkeypatch, verify_result=False)
    user = make_user(reset_twofa_on_password_reset=True, twofa_enabled=True, twofa_secret="s")
    engine = patch_mongo(monkeypatch, make_engine([user]))
    result = _run(auth_manager.update_password("token", "newpw", "tenant-1"))
    assert result["message"] == "Password reset successfully."
    assert user.twofa_enabled is False
    assert engine.saved


def test_forgot_password_user_missing(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([None]))
    result = _run(auth_manager.forgot_password("x@y.com", "tenant-1"))
    assert "reset email has been sent" in result["message"]


def test_forgot_password_success(monkeypatch):
    patch_common(monkeypatch)
    monkeypatch.setattr(am_module.constant, "mail_template", FakeMailTemplate())
    engine = patch_mongo(monkeypatch, make_engine([make_user(), make_tenant()]))
    result = _run(auth_manager.forgot_password("x@y.com", "tenant-1"))
    assert engine.saved
    assert FakeMailManager.get_instance().sent
    assert "reset email has been sent" in result["message"]


def test_forgot_password_inner_error_is_logged(monkeypatch):
    patch_common(monkeypatch)
    fake_log = FakeLog()
    monkeypatch.setattr(am_module, "log", fake_log)
    patch_mongo(monkeypatch, make_engine([make_user()]))
    result = _run(auth_manager.forgot_password("x@y.com", None))
    assert "reset email has been sent" in result["message"]
    assert fake_log.messages


def test_recover_account_user_missing(monkeypatch):
    patch_common(monkeypatch)
    patch_mongo(monkeypatch, make_engine([None]))
    result = _run(auth_manager.recover_account("recovery-key", "tenant-1"))
    assert "password reset email has been sent" in result["message"]


def test_recover_account_success(monkeypatch):
    patch_common(monkeypatch)
    monkeypatch.setattr(am_module.constant, "mail_template", FakeMailTemplate())
    patch_mongo(monkeypatch, make_engine([make_user(), make_user(), make_tenant()]))
    result = _run(auth_manager.recover_account("recovery-key", "tenant-1"))
    assert "password reset email has been sent" in result["message"]


def test_edit_user_status_not_found(monkeypatch):
    patch_common(monkeypatch)
    monkeypatch.setattr(am_module, "Depends", lambda dep: dep())
    patch_mongo(monkeypatch, make_engine([None]))
    request = FakeRequest({"status": "onboarding"})
    with pytest.raises(HTTPException) as exc:
        _run(auth_manager.edit_userStatus_and_sendMail_from_admin("507f1f77bcf86cd799439011", request))
    assert exc.value.status_code == 404


def test_edit_user_status_sends_onboarding_mail(monkeypatch):
    patch_common(monkeypatch)
    monkeypatch.setattr(am_module, "Depends", lambda dep: dep())
    user = make_user(status="active")
    engine = patch_mongo(monkeypatch, make_engine([user]))
    request = FakeRequest({"status": "onboarding"})
    result = _run(auth_manager.edit_userStatus_and_sendMail_from_admin("507f1f77bcf86cd799439011", request))
    assert result is user
    assert engine.saved
    assert FakeMailManager.get_instance().sent


def test_edit_user_status_no_mail_when_no_transition(monkeypatch):
    patch_common(monkeypatch)
    monkeypatch.setattr(am_module, "Depends", lambda dep: dep())
    user = make_user(status="active")
    patch_mongo(monkeypatch, make_engine([user]))
    request = FakeRequest({"username": "newname"})
    result = _run(auth_manager.edit_userStatus_and_sendMail_from_admin("507f1f77bcf86cd799439011", request))
    assert result is user
    assert not FakeMailManager.get_instance().sent
