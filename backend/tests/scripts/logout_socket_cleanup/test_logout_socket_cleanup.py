from __future__ import annotations

from types import SimpleNamespace

import pytest
from starlette.websockets import WebSocketState

from orion.api.interactive.extension_manager.extension_socket_manager import extension_socket_manager
from orion.api.interactive.extension_manager.extension_socket_store import ExtensionSocketStore
from routes import auth_routes
from tests.scripts.logout_socket_cleanup.helpers import _logout_request


@pytest.mark.anyio
async def test_logout_disconnects_extension_sockets_before_invalidating_session(monkeypatch):
    events: list[tuple] = []
    tenant = SimpleNamespace(id="tenant-1")

    class _FakeSessionManager:
        @staticmethod
        async def get_current_user(token, tenant_id=None):
            events.append(("resolve", token, tenant_id))
            return SimpleNamespace(id="user-42")

        @staticmethod
        async def invalidate_user_session(ptoken, tenant_id=None):
            events.append(("invalidate", ptoken, tenant_id))

    class _FakeSocketManager:
        @staticmethod
        async def disconnect(user_key):
            events.append(("disconnect", user_key))

    monkeypatch.setattr(
        auth_routes.session_manager,
        "get_instance",
        staticmethod(lambda: _FakeSessionManager()),
    )
    monkeypatch.setattr(
        auth_routes.extension_socket_manager,
        "get_instance",
        staticmethod(lambda: _FakeSocketManager()),
    )

    response = await auth_routes.logout(_logout_request("web-token", tenant))

    assert events == [
        ("resolve", "web-token", str(tenant.id)),
        ("disconnect", "user-42"),
        ("invalidate", "web-token", str(tenant.id)),
    ]
    assert response.status_code == 200
    assert response.body == b'{"detail":"Logged out"}'

    deleted_cookies = response.headers.getlist("set-cookie")
    assert len(deleted_cookies) == 4
    assert all("Max-Age=0" in cookie for cookie in deleted_cookies)

    access_cookies = [cookie for cookie in deleted_cookies if "access_token=" in cookie]
    assert len(access_cookies) == 3
    assert any("Path=/;" in cookie for cookie in access_cookies)
    assert any("Path=/admin;" in cookie for cookie in access_cookies)
    assert any("Path=/api/extension;" in cookie for cookie in access_cookies)

    marker_cookies = [cookie for cookie in deleted_cookies if "session_present=" in cookie]
    assert len(marker_cookies) == 1
    assert "Path=/;" in marker_cookies[0]
    assert "Domain=" not in marker_cookies[0]


@pytest.mark.anyio
async def test_socket_manager_disconnect_closes_all_user_sockets_and_forgets_them():
    class _FakeWebSocket:
        application_state = WebSocketState.CONNECTED

        def __init__(self, *, close_error: bool = False):
            self.close_error = close_error
            self.close_calls = 0

        async def close(self):
            self.close_calls += 1
            if self.close_error:
                raise RuntimeError("already closed")

    manager = object.__new__(extension_socket_manager)
    manager._sockets = {}
    manager._store = ExtensionSocketStore()
    manager._started = True
    first = _FakeWebSocket()
    already_closed = _FakeWebSocket(close_error=True)
    other_user = _FakeWebSocket()

    await manager.register("user-42", first)
    await manager.register("user-42", already_closed)
    await manager.register("other-user", other_user)

    await manager.disconnect("user-42")

    assert first.close_calls == 1
    assert already_closed.close_calls == 1
    assert "user-42" not in manager._sockets
    assert manager._sockets == {"other-user": {other_user}}
