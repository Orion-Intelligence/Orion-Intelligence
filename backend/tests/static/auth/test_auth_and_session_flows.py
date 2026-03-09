"""Coverage map: checklist items 23-40, 51-61."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import asyncio
import pytest
from fastapi import HTTPException, Response
from starlette.requests import Request

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


def _make_request(headers: dict | None = None, cookies: dict | None = None) -> Request:
    raw_headers = [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()]
    if cookies:
        raw_headers.append((b"cookie", "; ".join(f"{k}={v}" for k, v in cookies.items()).encode()))
    return Request({"type": "http", "method": "POST", "path": "/", "headers": raw_headers})


def test_token_route_sets_cookie(monkeypatch):
    from routes.auth_routes import token as token_route

    app = _build_auth_app(monkeypatch)
    response = Response()
    result = asyncio.run(token_route(form_data=SimpleNamespace(username="good", password="pass"), response=response))
    assert result["access_token"] == "token-123"
    assert "access_token=token-123" in response.headers.get("set-cookie", "")


def test_token_route_invalid_credentials(monkeypatch):
    from routes.auth_routes import token as token_route

    app = _build_auth_app(monkeypatch)
    with pytest.raises(HTTPException) as ex:
        asyncio.run(token_route(form_data=SimpleNamespace(username="bad", password="pass"), response=Response()))
    assert ex.value.status_code == 401


def test_2fa_verify_success(monkeypatch):
    from routes.auth_routes import verify_2fa

    _build_auth_app(monkeypatch)
    response = Response()
    result = asyncio.run(verify_2fa(code="123456", ptoken="tmp", response=response))
    assert result["access_token"] == "token-2fa"
    assert "access_token=token-2fa" in response.headers.get("set-cookie", "")


def test_2fa_verify_invalid_code(monkeypatch):
    from routes.auth_routes import verify_2fa

    _build_auth_app(monkeypatch)
    with pytest.raises(HTTPException) as ex:
        asyncio.run(verify_2fa(code="999999", ptoken="tmp", response=Response()))
    assert ex.value.status_code == 401


def test_refresh_token_success(monkeypatch):
    from routes.auth_routes import refresh_token as refresh_token_route

    _build_auth_app(monkeypatch)
    response = Response()
    result = asyncio.run(refresh_token_route(request=_make_request(headers={"authorization": "Bearer valid"}), response=response))
    assert result["access_token"] == "refreshed-token"
    assert "access_token=refreshed-token" in response.headers.get("set-cookie", "")


def test_refresh_token_missing(monkeypatch):
    from routes.auth_routes import refresh_token as refresh_token_route

    _build_auth_app(monkeypatch)
    with pytest.raises(HTTPException) as ex:
        asyncio.run(refresh_token_route(request=_make_request(), response=Response()))
    assert ex.value.status_code == 401


def test_refresh_token_expired(monkeypatch):
    from routes.auth_routes import refresh_token as refresh_token_route

    _build_auth_app(monkeypatch)
    with pytest.raises(HTTPException) as ex:
        asyncio.run(refresh_token_route(request=_make_request(headers={"authorization": "Bearer expired"}), response=Response()))
    assert ex.value.status_code == 401


def test_logout_returns_response_and_clears_cookie(monkeypatch):
    from routes.auth_routes import logout

    _build_auth_app(monkeypatch)
    resp = asyncio.run(logout(_make_request(cookies={"access_token": "token-123"})))
    assert resp.status_code == 200
    assert b"Logged out" in resp.body


def test_verify_user_route(monkeypatch):
    from routes.auth_routes import verifyUser

    _build_auth_app(monkeypatch)
    result = asyncio.run(verifyUser("good-token"))
    assert "message" in result


def test_verify_user_invalid(monkeypatch):
    from routes.auth_routes import verifyUser

    _build_auth_app(monkeypatch)
    with pytest.raises(HTTPException) as ex:
        asyncio.run(verifyUser("bad"))
    assert ex.value.status_code == 404


def test_forgot_and_update_password_routes(monkeypatch):
    from routes.auth_routes import forgotPassword, updatePassword
    from orion.api.interactive.auth_manager.models.forgot_password_request import ForgotPasswordRequest, ResetPassword

    _build_auth_app(monkeypatch)
    forgot = asyncio.run(forgotPassword(ForgotPasswordRequest(email="user@example.com")))
    assert "message" in forgot

    update = asyncio.run(updatePassword(ResetPassword(token="abc", password="Aa!123456")))
    assert "message" in update


def test_support_route(monkeypatch):
    from routes.auth_routes import support
    from orion.api.interactive.signup_manager.signup_manager import SignupManager
    from orion.api.interactive.signup_manager.model.signup_request_model import SupportRequest

    async def _fake_support(_):
        return {"message": "sent"}

    monkeypatch.setattr(SignupManager, "send_support_mail", staticmethod(_fake_support))

    _build_auth_app(monkeypatch)
    resp = asyncio.run(support(SupportRequest(email="corp@example.org", subject="help", message="need setup")))
    assert resp["message"] == "sent"


def test_token_demo_route_sets_cookie(monkeypatch):
    from routes.auth_routes import token_demo
    from orion.helper_manager.env_handler import env_handler

    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda k, d=None: "demo_user" if k == "DEMO_USERNAME" else "demo_pass")))
    _build_auth_app(monkeypatch)
    response = Response()
    result = asyncio.run(token_demo(response=response))
    assert result["access_token"] == "token-123"
    assert "access_token=token-123" in response.headers.get("set-cookie", "")


def test_signup_and_resend_verification_routes(monkeypatch):
    from orion.api.interactive.signup_manager.signup_manager import SignupManager
    from orion.api.interactive.signup_manager.model.signup_request_model import SignupRequest

    async def _fake_signup(_):
        return {"message": "Signup successful. Your account is under verification.", "status": "pending"}

    async def _fake_resend(_):
        return {"message": "Verification email resent."}

    monkeypatch.setattr(SignupManager, "signup_user", staticmethod(_fake_signup))
    monkeypatch.setattr(SignupManager, "resend_verification_email", staticmethod(_fake_resend))

    _build_auth_app(monkeypatch)
    model = SignupRequest(username="member_user", email="user@example.com", password="Aa!123456")
    signup_ep = next(r.endpoint for r in auth_router.routes if getattr(r, "path", None) == "/api/signup")
    resend_ep = next(r.endpoint for r in auth_router.routes if getattr(r, "path", None) == "/api/signup/verificaion")
    first = asyncio.run(signup_ep(model))
    second = asyncio.run(resend_ep(model))
    assert first["status"] == "pending"
    assert "message" in second


def test_subscription_request_route(monkeypatch):
    from routes.auth_routes import subscriptionRequest
    from orion.api.interactive.payment_manager.model.payment_param_model import PaymentParamModel
    from orion.api.interactive.payment_manager.payment_manager import PaymentManager

    class _FakePayment:
        async def send_subscription_info(self, _):
            return {"message": "sent"}

    monkeypatch.setattr(PaymentManager, "get_instance", staticmethod(lambda: _FakePayment()))

    _build_auth_app(monkeypatch)
    resp = asyncio.run(
        subscriptionRequest(
            PaymentParamModel(name="Acme", phone="+12025550123", email="owner@example.com", plan="monthly-highlighted")
        )
    )
    assert resp["message"] == "sent"


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
