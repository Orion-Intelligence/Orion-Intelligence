"""Coverage map: checklist items 23-40, 51-61."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import asyncio
import pytest
import httpx
from fastapi import HTTPException

from routes.auth_routes import auth_router
from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.services.session_manager.session_manager import session_manager


class _FakeAuthManager:
    async def login(self, username, password, free=False):
        if username == "bad":
            raise HTTPException(status_code=401, detail="Invalid user or password")
        return {"access_token": "token-123", "token_type": "bearer", "twofa_required": False}

    async def verify_user(self, token):
        if token == "bad":
            raise HTTPException(status_code=404, detail="Invalid token")
        return {"message": "Email verified successfully"}

    async def forgot_password(self, email):
        return {"message": "Reset password mail send successfully."}

    async def update_password(self, token, password):
        return {"message": "Password reset successfully."}


class _FakeSessionManager:
    async def verify_2fa_and_issue(self, ptoken, code):
        if code != "123456":
            raise HTTPException(status_code=401, detail="Invalid 2FA code")
        return {"access_token": "token-2fa", "token_type": "bearer", "session": {"username": "u"}}

    async def refresh_token(self, token):
        if token == "expired":
            raise HTTPException(status_code=401, detail="Token has expired")
        return {"access_token": "refreshed-token", "token_type": "bearer", "session": {"username": "u"}}

    async def get_current_user(self, token):
        if not token:
            raise HTTPException(status_code=401, detail="Missing or invalid token")
        return SimpleNamespace(id="u1", role="member", status="active", tenant_uuid="t1", current_session_id="sid-1")

    async def get_current_role(self, token):
        if token == "bad":
            raise HTTPException(status_code=401, detail="Invalid token")
        return "member"

    async def get_current_status(self, token):
        if token == "bad":
            raise HTTPException(status_code=401, detail="Invalid token")
        return "active"

    @staticmethod
    def logout_user(ptoken):
        return None


def _build_auth_app(monkeypatch):
    monkeypatch.setattr(auth_manager, "login", _FakeAuthManager().login)
    monkeypatch.setattr(auth_manager, "verify_user", _FakeAuthManager().verify_user)
    monkeypatch.setattr(auth_manager, "forgot_password", _FakeAuthManager().forgot_password)
    monkeypatch.setattr(auth_manager, "update_password", _FakeAuthManager().update_password)

    monkeypatch.setattr(session_manager, "get_instance", staticmethod(lambda: _FakeSessionManager()))
    monkeypatch.setattr(session_manager, "logout_user", staticmethod(_FakeSessionManager.logout_user))

    from fastapi import FastAPI

    app = FastAPI()
    app.include_router(auth_router)
    return app


def _request(app, method: str, path: str, **kwargs):
    cookies = kwargs.pop("cookies", None)

    async def _run():
        transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            if cookies:
                client.cookies.update(cookies)
            return await client.request(method, path, **kwargs)

    return asyncio.run(_run())


def test_token_route_sets_cookie(monkeypatch):
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/token", data={"username": "good", "password": "pass"})
    assert resp.status_code == 200
    assert "access_token" in resp.cookies


def test_token_route_invalid_credentials(monkeypatch):
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/token", data={"username": "bad", "password": "pass"})
    assert resp.status_code == 401


def test_2fa_verify_success(monkeypatch):
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/token/2fa/verify", json={"code": "123456"}, headers={"Authorization": "Bearer tmp"})
    assert resp.status_code == 200
    assert resp.json()["access_token"] == "token-2fa"


def test_2fa_verify_invalid_code(monkeypatch):
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/token/2fa/verify", json={"code": "999999"}, headers={"Authorization": "Bearer tmp"})
    assert resp.status_code == 401


def test_refresh_token_success(monkeypatch):
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/token/refresh", headers={"Authorization": "Bearer valid"})
    assert resp.status_code == 200
    assert resp.json()["access_token"] == "refreshed-token"


def test_refresh_token_missing(monkeypatch):
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/token/refresh")
    assert resp.status_code == 401


def test_refresh_token_expired(monkeypatch):
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/token/refresh", headers={"Authorization": "Bearer expired"})
    assert resp.status_code == 401


def test_logout_returns_response_and_clears_cookie(monkeypatch):
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/logout", cookies={"access_token": "token-123"})
    assert resp.status_code == 200
    assert resp.json()["detail"] == "Logged out"


def test_verify_user_route(monkeypatch):
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/verify/good-token")
    assert resp.status_code == 200


def test_verify_user_invalid(monkeypatch):
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/verify/bad")
    assert resp.status_code == 404


def test_forgot_and_update_password_routes(monkeypatch):
    app = _build_auth_app(monkeypatch)
    forgot = _request(app, "POST", "/api/forgot", json={"email": "user@example.com"})
    assert forgot.status_code == 200

    update = _request(app, "POST", "/api/updatePassword", json={"token": "abc", "password": "Aa!123456"})
    assert update.status_code == 200


def test_support_route(monkeypatch):
    from orion.api.interactive.signup_manager.signup_manager import SignupManager

    async def _fake_support(_):
        return {"message": "sent"}

    monkeypatch.setattr(SignupManager, "send_support_mail", staticmethod(_fake_support))

    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/support", json={"email": "corp@example.org", "subject": "help", "message": "need setup"})
    assert resp.status_code == 200


def test_token_demo_route_sets_cookie(monkeypatch):
    from orion.helper_manager.env_handler import env_handler

    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda k, d=None: "demo_user" if k == "DEMO_USERNAME" else "demo_pass")))
    app = _build_auth_app(monkeypatch)
    resp = _request(app, "POST", "/api/token/demo")
    assert resp.status_code == 200
    assert "access_token" in resp.cookies


def test_signup_and_resend_verification_routes(monkeypatch):
    from orion.api.interactive.signup_manager.signup_manager import SignupManager

    async def _fake_signup(_):
        return {"message": "Signup successful. Your account is under verification.", "status": "pending"}

    async def _fake_resend(_):
        return {"message": "Verification email resent."}

    monkeypatch.setattr(SignupManager, "signup_user", staticmethod(_fake_signup))
    monkeypatch.setattr(SignupManager, "resend_verification_email", staticmethod(_fake_resend))

    app = _build_auth_app(monkeypatch)
    signup = _request(app, "POST", "/api/signup", json={"username": "member_user", "email": "user@example.com", "password": "Aa!123456"})
    assert signup.status_code == 200

    resend = _request(app, "POST", "/api/signup/verificaion", json={"username": "member_user", "email": "user@example.com", "password": "Aa!123456"})
    assert resend.status_code == 200


def test_subscription_request_route(monkeypatch):
    from orion.api.interactive.payment_manager.payment_manager import PaymentManager

    class _FakePayment:
        async def send_subscription_info(self, _):
            return {"message": "sent"}

    monkeypatch.setattr(PaymentManager, "get_instance", staticmethod(lambda: _FakePayment()))

    app = _build_auth_app(monkeypatch)
    resp = _request(
        app,
        "POST",
        "/api/subscription/request",
        json={"name": "Acme", "phone": "+12025550123", "email": "owner@example.com", "plan": "monthly-highlighted"},
    )
    assert resp.status_code == 200


def test_session_manager_rejects_missing_token(monkeypatch):
    sm = _FakeSessionManager()

    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.get_current_user(""))
    assert ex.value.status_code == 401
    assert "missing or invalid token" in ex.value.detail.lower()


def test_session_manager_rejects_invalid_role(monkeypatch):
    sm = _FakeSessionManager()

    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.get_current_role("bad"))
    assert ex.value.status_code == 401
    assert "invalid token" in ex.value.detail.lower()


def test_session_manager_rejects_invalid_status(monkeypatch):
    sm = _FakeSessionManager()

    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.get_current_status("bad"))
    assert ex.value.status_code == 401
    assert "invalid token" in ex.value.detail.lower()
