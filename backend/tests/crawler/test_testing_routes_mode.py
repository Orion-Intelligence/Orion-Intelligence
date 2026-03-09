"""Coverage map: checklist items 169-173 + mock-route behavior for testing env."""

from __future__ import annotations

from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from configs import app_dependency
from configs import limiter_dependency as limiter_module
from routes.test_routes import require_testing_enabled, test_routes as router_under_test
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role


async def _role_ok():
    return user_role.ADMIN


async def _status_ok():
    return UserStatus.ACTIVE


async def _user_ok():
    return SimpleNamespace(id="u1", tenant_uuid="t1", role=user_role.ADMIN, licenses=["maintainer"], status=UserStatus.ACTIVE)


async def _no_limit():
    yield


async def _testing_enabled():
    return True


def _build_client():
    app = FastAPI()
    app.include_router(router_under_test)

    app.dependency_overrides[app_dependency.get_current_role] = _role_ok
    app.dependency_overrides[app_dependency.get_current_status] = _status_ok
    app.dependency_overrides[app_dependency.get_current_user] = _user_ok
    app.dependency_overrides[limiter_module.limiter_dependency] = _no_limit
    app.dependency_overrides[require_testing_enabled] = _testing_enabled

    return TestClient(app)


def test_test_routes_dynamic_user_mock():
    client = _build_client()
    resp = client.post("/api/dynamic/user", json={"text": {"query": "alice@example.com"}})
    assert resp.status_code == 200


def test_test_routes_urlscan_domain_mock(load_injection):
    client = _build_client()
    resp = client.post("/api/urlscan/domain", json=load_injection("urlscan_domain.json"))
    assert resp.status_code == 200


def test_test_routes_social_recon_mock():
    client = _build_client()
    resp = client.post("/api/social/recon", json={"query": "alice"})
    assert resp.status_code == 200


def test_test_routes_crypto_scan_mock():
    client = _build_client()
    resp = client.post("/api/crypto/scan", json={"text": {"query": "0xabc"}})
    assert resp.status_code == 200
