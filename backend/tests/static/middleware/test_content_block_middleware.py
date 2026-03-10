from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from orion.middleware.middlewares.content_block_middleware import content_block_middleware
from orion.services.session_manager.session_manager import session_manager


class _SessionNoUser:
    async def get_current_user(self, token):
        return None


class _SessionWithUser:
    async def get_current_user(self, token):
        return {"id": "u1"}


def test_dashboard_redirects_to_login_when_no_user(monkeypatch):
    app = FastAPI()
    app.add_middleware(content_block_middleware)

    @app.get("/dashboard")
    async def dashboard():
        return {"ok": True}

    monkeypatch.setattr(session_manager, "get_instance", staticmethod(lambda: _SessionNoUser()))

    client = TestClient(app)
    resp = client.get("/dashboard", follow_redirects=False)
    assert resp.status_code == 302
    assert resp.headers["location"] == "/login"


def test_dashboard_allows_authenticated_user(monkeypatch):
    app = FastAPI()
    app.add_middleware(content_block_middleware)

    @app.get("/dashboard")
    async def dashboard():
        return {"ok": True}

    monkeypatch.setattr(session_manager, "get_instance", staticmethod(lambda: _SessionWithUser()))

    client = TestClient(app)
    client.cookies.set("access_token", "x.y.z")
    resp = client.get("/dashboard")
    client.cookies.clear()
    assert resp.status_code == 200
    assert resp.json()["ok"] is True
