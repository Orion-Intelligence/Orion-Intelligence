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
