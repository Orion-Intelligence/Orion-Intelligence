from __future__ import annotations

import json
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Ensure backend package imports resolve when running tests from repo root.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture
def fake_user():
    return SimpleNamespace(
        id="507f1f77bcf86cd799439011",
        username="admin_test",
        role="admin",
        status="active",
        tenant_uuid="507f1f77bcf86cd799439012",
        licenses=["maintainer", "free"],
        subscription=True,
        account_verify_at=None,
        preferences={"theme": "dark-theme"},
        twofa_enabled=False,
        email="admin@example.com",
    )


@pytest.fixture
def injections_dir() -> Path:
    return BACKEND_ROOT / "tests" / "crawler" / "injections"


@pytest.fixture
def load_injection(injections_dir):
    def _loader(name: str):
        return json.loads((injections_dir / name).read_text(encoding="utf-8"))

    return _loader


@pytest.fixture
def app_factory():
    def _factory(*routers):
        app = FastAPI()
        for router in routers:
            app.include_router(router)
        return app

    return _factory


@pytest.fixture
def client_factory():
    clients: list[TestClient] = []

    def _factory(app: FastAPI):
        client = TestClient(app)
        client.__enter__()
        clients.append(client)
        return client

    yield _factory

    for client in reversed(clients):
        client.__exit__(None, None, None)


@pytest.fixture
def cypress_env() -> dict:
    """Mirror key identities/data from client/cypress.config.ts for backend tests."""
    return {
        "ADMIN_USERNAME": "admin_test_username",
        "ADMIN_PASSWORD": "Zq9M#rX@e7W^B0T+f(ysG!kJc1d2mC&N%hAUEP)6Y4n$R8VbHS",
        "TEST_USERS": {
            "testing1": {
                "username": "testing1",
                "email": "a@hotmail.com",
                "password": "1qaz!QAZ",
                "role": "Member",
                "licenses": ["Free"],
            },
            "testing2": {
                "username": "testing2",
                "email": "b@hotmail.com",
                "password": "1qaz!QAZ",
                "role": "Analyst",
                "licenses": ["Free", "OSINT Basic"],
            },
            "testing3": {
                "username": "testing3",
                "email": "c@hotmail.com",
                "password": "1qaz!QAZ",
                "role": "Member",
                "licenses": ["Free", "OSINT Advanced"],
            },
            "testing4": {
                "username": "testing4",
                "email": "d@gmail.com",
                "password": "1qaz!QAZ",
                "role": "Member",
                "licenses": ["Free", "Pentester"],
            },
            "testing5": {
                "username": "testing5",
                "email": "e@hotmail.com",
                "password": "1qaz!QAZ",
                "role": "Demo",
                "licenses": ["Free"],
            },
        },
        "DEFAULT_TEST_USER_KEY": "testing5",
        "TENANT_ACCOUNT": {
            "username": "test_for_tenants",
            "email": "testing1@orionintelligence.org",
            "password": "1qaz!QAZ",
        },
        "TENANT_SUB_USER": {
            "username": "tenant_user_1",
            "email": "tenant1@gmail.com",
            "password": "1qaz!QAZ",
        },
    }
