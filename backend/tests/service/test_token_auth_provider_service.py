from __future__ import annotations

import asyncio
from contextlib import contextmanager
from types import SimpleNamespace
from typing import Any, cast

import pytest
from fastapi import HTTPException
from odmantic import AIOEngine
from starlette.requests import Request
from starlette.responses import Response
from starlette.status import HTTP_303_SEE_OTHER

from configs.token_auth_provider import TokenAuthProvider, setup_admin
from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.helper_manager.env_handler import env_handler
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.services.session_manager.session_manager import session_manager


def _request(path: str, cookies: dict[str, str] | None = None) -> Request:
    headers = []
    if cookies:
        cookie_header = "; ".join(f"{key}={value}" for key, value in cookies.items())
        headers.append((b"cookie", cookie_header.encode("utf-8")))
    scope = {
        "type": "http",
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": headers,
        "client": ("127.0.0.1", 1234),
        "server": ("testserver", 80),
    }
    return Request(scope)


@contextmanager
def _swap_singletons(*items):
    originals = []
    try:
        for owner, attr, value in items:
            originals.append((owner, attr, getattr(owner, attr)))
            setattr(owner, attr, value)
        yield
    finally:
        for owner, attr, value in reversed(originals):
            setattr(owner, attr, value)


def _async_return(value):
    async def _inner(*_args, **_kwargs):
        return value

    return _inner


def test_token_auth_provider_login_sets_admin_cookie_for_admin_user(cypress_env: dict[str, Any]):
    provider = TokenAuthProvider()
    admin_user = SimpleNamespace(username=cypress_env["ADMIN_USERNAME"], role=user_role.ADMIN)
    fake_auth = SimpleNamespace(authenticate_user=_async_return(admin_user))
    fake_session = SimpleNamespace(create_access_token=_async_return(("token-123", user_role.ADMIN.value)))
    fake_env = SimpleNamespace(env=lambda key, default=None: "0" if key == "PRODUCTION" else default)

    with _swap_singletons(
        (auth_manager, "_auth_manager__instance", fake_auth),
        (session_manager, "_session_manager__instance", fake_session),
        (env_handler, "_env_handler__instance", fake_env),
    ):
        response = asyncio.run(
            provider.login(
                username=cypress_env["ADMIN_USERNAME"],
                password=cypress_env["ADMIN_PASSWORD"],
                request=_request("/admin/login"),
                response=Response(),
            )
        )

    assert response.status_code == HTTP_303_SEE_OTHER
    assert response.headers["location"] == "/admin/"
    assert "access_token=token-123" in response.headers.get("set-cookie", "")


def test_token_auth_provider_login_rejects_non_admin_user(cypress_env: dict[str, Any]):
    provider = TokenAuthProvider()
    member_user = SimpleNamespace(username=cypress_env["TEST_USERS"]["testing1"]["username"], role=user_role.MEMBER)
    fake_auth = SimpleNamespace(authenticate_user=_async_return(member_user))
    fake_session = SimpleNamespace(create_access_token=_async_return(("token-123", user_role.MEMBER.value)))
    fake_env = SimpleNamespace(env=lambda key, default=None: "1" if key == "PRODUCTION" else default)

    with _swap_singletons(
        (auth_manager, "_auth_manager__instance", fake_auth),
        (session_manager, "_session_manager__instance", fake_session),
        (env_handler, "_env_handler__instance", fake_env),
    ):
        with pytest.raises(HTTPException) as ex:
            asyncio.run(
                provider.login(
                    username=cypress_env["TEST_USERS"]["testing1"]["username"],
                    password=cypress_env["TEST_USERS"]["testing1"]["password"],
                    request=_request("/admin/login"),
                    response=Response(),
                )
            )

    assert ex.value.status_code == 401
    assert ex.value.detail == "Invalid credentials"


def test_token_auth_provider_is_authenticated_allows_login_path():
    provider = TokenAuthProvider()

    assert asyncio.run(provider.is_authenticated(_request("/admin/login"))) is True


def test_token_auth_provider_is_authenticated_rejects_missing_cookie():
    provider = TokenAuthProvider()

    assert asyncio.run(provider.is_authenticated(_request("/admin"))) is False


def test_token_auth_provider_is_authenticated_stores_user_for_admin(cypress_env: dict[str, Any]):
    provider = TokenAuthProvider()
    fake_user = SimpleNamespace(username=cypress_env["ADMIN_USERNAME"], profile_picture="https://example.com/p.png")
    fake_session = SimpleNamespace(
        get_current_user=_async_return(fake_user),
        get_current_role=_async_return(user_role.ADMIN.value),
    )
    request = _request("/admin", {"access_token": "token-123"})

    with _swap_singletons((session_manager, "_session_manager__instance", fake_session)):
        authenticated = asyncio.run(provider.is_authenticated(request))

    assert authenticated is True
    assert request.state.user is fake_user


def test_token_auth_provider_is_authenticated_rejects_non_admin_role():
    provider = TokenAuthProvider()
    fake_session = SimpleNamespace(
        get_current_user=_async_return(SimpleNamespace(username="member")),
        get_current_role=_async_return(user_role.MEMBER.value),
    )

    with _swap_singletons((session_manager, "_session_manager__instance", fake_session)):
        authenticated = asyncio.run(provider.is_authenticated(_request("/admin", {"access_token": "token-123"})))

    assert authenticated is False


def test_token_auth_provider_is_authenticated_handles_http_exception():
    provider = TokenAuthProvider()

    async def _raise_http_exception(*_args, **_kwargs):
        raise HTTPException(status_code=401, detail="Invalid token")

    fake_session = SimpleNamespace(get_current_user=_raise_http_exception)

    with _swap_singletons((session_manager, "_session_manager__instance", fake_session)):
        authenticated = asyncio.run(provider.is_authenticated(_request("/admin", {"access_token": "token-123"})))

    assert authenticated is False


def test_token_auth_provider_exposes_admin_metadata_and_logout(cypress_env: dict[str, Any]):
    provider = TokenAuthProvider()
    request = _request("/admin")
    request.state.user = SimpleNamespace(
        username=cypress_env["TENANT_ACCOUNT"]["username"],
        profile_picture="https://example.com/profile.png",
    )

    config = provider.get_admin_config(request)
    admin_user = provider.get_admin_user(request)
    response = asyncio.run(provider.logout(request, Response()))

    assert config.app_title == "Admin Panel"
    assert admin_user.username == cypress_env["TENANT_ACCOUNT"]["username"]
    assert admin_user.photo_url == "https://example.com/profile.png"
    assert response.status_code == HTTP_303_SEE_OTHER
    assert response.headers["location"] == "/admin/login"
    assert "access_token=\"\"" in response.headers.get("set-cookie", "")


def test_setup_admin_registers_expected_views():
    admin = setup_admin(cast(AIOEngine, SimpleNamespace()))

    assert admin.title == "Admin Panel"
    assert admin.base_url == "/admin/"
    assert isinstance(admin.auth_provider, TokenAuthProvider)
    assert len(admin._views) == 5
