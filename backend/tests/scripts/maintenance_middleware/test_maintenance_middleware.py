from __future__ import annotations

import pytest

from orion.api.interactive.backup_manager.maintenance_state import maintenance_state
from orion.middleware.middlewares.maintenance_middleware import maintenance_middleware
from tests.scripts.maintenance_middleware.fakes import _FakeDownstream
from tests.scripts.maintenance_middleware.fixtures import flag
from tests.scripts.maintenance_middleware.helpers import _drive, _status_of


def test_requests_pass_through_when_maintenance_is_off(flag):
    downstream = _FakeDownstream()
    app = maintenance_middleware(downstream)

    sent = _drive(app, {"type": "http", "path": "/api/search"})

    assert downstream.calls == 1
    assert _status_of(sent) == 200


def test_requests_are_rejected_with_503_during_maintenance(flag):
    flag.touch()
    maintenance_state.get_instance().invalidate()
    downstream = _FakeDownstream()
    app = maintenance_middleware(downstream)

    sent = _drive(app, {"type": "http", "path": "/api/search"})

    assert downstream.calls == 0
    assert _status_of(sent) == 503


@pytest.mark.parametrize("path", [
    "/api/admin/backups/status",
    "/maintenance-assets/logo_url_default.png",
    "/static/maintenance.html",
    "/robots.txt",
])
def test_the_progress_and_maintenance_page_paths_stay_reachable(flag, path):
    flag.touch()
    maintenance_state.get_instance().invalidate()
    downstream = _FakeDownstream()
    app = maintenance_middleware(downstream)

    sent = _drive(app, {"type": "http", "path": path})

    assert downstream.calls == 1
    assert _status_of(sent) == 200


@pytest.mark.parametrize("path", ["/api/public", "/api/test/ready"])
def test_readiness_probes_stay_green_during_maintenance(flag, path):
    flag.touch()
    maintenance_state.get_instance().invalidate()
    downstream = _FakeDownstream()
    app = maintenance_middleware(downstream)

    sent = _drive(app, {"type": "http", "path": path})

    assert downstream.calls == 1
    assert _status_of(sent) == 200


def test_the_app_shell_is_blocked_so_the_maintenance_page_probe_stays_honest(flag):
    flag.touch()
    maintenance_state.get_instance().invalidate()
    downstream = _FakeDownstream()
    app = maintenance_middleware(downstream)

    for path in ("/", "/dashboard/home"):
        sent = _drive(app, {"type": "http", "path": path})
        assert _status_of(sent) == 503, path
    assert downstream.calls == 0


def test_websocket_handshakes_are_closed_during_maintenance(flag):
    flag.touch()
    maintenance_state.get_instance().invalidate()
    downstream = _FakeDownstream()
    app = maintenance_middleware(downstream)

    sent = _drive(app, {"type": "websocket", "path": "/api/extension/socket"}, incoming={"type": "websocket.connect"})

    assert downstream.calls == 0
    assert sent == [{"type": "websocket.close", "code": 1013}]


def test_websocket_handshakes_pass_through_when_maintenance_is_off(flag):
    downstream = _FakeDownstream()
    app = maintenance_middleware(downstream)

    _drive(app, {"type": "websocket", "path": "/api/extension/socket"}, incoming={"type": "websocket.connect"})

    assert downstream.calls == 1


def test_lifespan_scopes_are_never_intercepted(flag):
    flag.touch()
    maintenance_state.get_instance().invalidate()
    downstream = _FakeDownstream()
    app = maintenance_middleware(downstream)

    _drive(app, {"type": "lifespan"})

    assert downstream.calls == 1


def test_the_flag_check_is_cached_but_invalidatable(flag):
    assert maintenance_state.get_instance().is_active() is False
    flag.touch()
    assert maintenance_state.get_instance().is_active() is False
    maintenance_state.get_instance().invalidate()
    assert maintenance_state.get_instance().is_active() is True
