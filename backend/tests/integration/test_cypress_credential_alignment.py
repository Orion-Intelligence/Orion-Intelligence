from __future__ import annotations

import asyncio
from types import SimpleNamespace

from orion.api.interactive.account_manager.models.user_model import user_model
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from routes.auth_routes import auth_router
from routes.tenant_routes import tenant_routes


def _map_role(label: str) -> str:
    return {
        "Admin": "admin",
        "Member": "member",
        "Analyst": "analyst",
        "Demo": "demo",
        "Crawler": "crawler",
    }[label]


def _map_licenses(labels: list[str]) -> list[str]:
    mapping = {
        "Free": "free",
        "OSINT Basic": "osint_basic",
        "OSINT Advanced": "osint_advanced",
        "Pentester": "pentester",
        "Maintainer": "maintainer",
        "Enterprise": "enterprise",
    }
    return [mapping[label] for label in labels]


def test_auth_token_accepts_cypress_admin_credentials(monkeypatch, cypress_env):
    from routes.auth_routes import token as token_route
    from orion.api.interactive.auth_manager.auth_manager import auth_manager

    captured: dict[str, object] = {}

    async def _fake_login(username, password, free=False):
        captured["username"] = username
        captured["password"] = password
        captured["free"] = free
        return {"access_token": "token-xyz", "token_type": "bearer", "twofa_required": False}

    monkeypatch.setattr(auth_manager, "login", _fake_login)

    response = SimpleNamespace(set_cookie=lambda **_: None)
    payload = SimpleNamespace(
        username=cypress_env["ADMIN_USERNAME"],
        password=cypress_env["ADMIN_PASSWORD"],
    )
    out = asyncio.run(token_route(form_data=payload, response=response))

    assert out["access_token"] == "token-xyz"
    assert captured["username"] == cypress_env["ADMIN_USERNAME"]
    assert captured["password"] == cypress_env["ADMIN_PASSWORD"]
    assert captured["free"] is False


def test_signup_accepts_cypress_tenant_account(monkeypatch, cypress_env):
    from orion.api.interactive.signup_manager.signup_manager import SignupManager
    from orion.api.interactive.signup_manager.model.signup_request_model import SignupRequest

    captured: dict[str, str] = {}

    async def _fake_signup(data):
        captured["username"] = data.username
        captured["email"] = data.email
        captured["password"] = data.password
        return {"message": "Signup successful. Your account is under verification.", "status": "pending"}

    monkeypatch.setattr(SignupManager, "signup_user", staticmethod(_fake_signup))

    tenant_account = cypress_env["TENANT_ACCOUNT"]
    model = SignupRequest(
        username=tenant_account["username"],
        email=tenant_account["email"],
        password=tenant_account["password"],
    )
    signup_route = next(r.endpoint for r in auth_router.routes if getattr(r, "path", None) == "/api/signup")
    out = asyncio.run(signup_route(model))

    assert out["status"] == "pending"
    assert captured == tenant_account


def test_tenant_create_user_accepts_cypress_sub_user_identity(monkeypatch, cypress_env):
    from orion.api.interactive.tenant_manager.tenant_manager import TenantManager

    captured: dict[str, object] = {}

    class _FakeTenantManager:
        async def create_tenant_user(self, data, current_user):
            captured["username"] = data.username
            captured["email"] = data.email
            captured["password"] = data.password
            captured["role"] = data.role
            captured["licenses"] = list(data.licenses)
            captured["current_user_role"] = current_user.role
            return {"message": "User created successfully"}

    monkeypatch.setattr(TenantManager, "get_instance", staticmethod(lambda: _FakeTenantManager()))

    sub_user = cypress_env["TENANT_SUB_USER"]
    role_label = cypress_env["TEST_USERS"]["testing1"]["role"]
    licenses_label = cypress_env["TEST_USERS"]["testing1"]["licenses"]
    body = user_model(
        username=sub_user["username"],
        email=sub_user["email"],
        password=sub_user["password"],
        role=_map_role(role_label),
        status="active",
        subscription=False,
        licenses=_map_licenses(licenses_label),
    )
    endpoint = next(r.endpoint for r in tenant_routes.routes if getattr(r, "path", None) == "/api/tenant/create/user")
    out = asyncio.run(
        endpoint(
            data=body,
            current_user=SimpleNamespace(id="u1", tenant_uuid="t1", role=user_role.ADMIN, licenses=["maintainer"]),
        )
    )

    assert out["message"] == "User created successfully"
    assert captured["username"] == sub_user["username"]
    assert captured["email"] == sub_user["email"]
    assert captured["password"] == sub_user["password"]
    assert str(captured["role"]) == "user_role.MEMBER"
    assert [str(x) for x in captured["licenses"]] == ["LicenseName.FREE"]
    assert str(captured["current_user_role"]) == "user_role.ADMIN"
