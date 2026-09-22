from __future__ import annotations

import asyncio

import pytest
from starlette.websockets import WebSocketState

import orion.api.interactive.extension_manager.extension_socket_manager as esm_module
from orion.api.interactive.extension_manager.extension_socket_manager import extension_socket_manager
from orion.api.interactive.extension_manager.constants.constant import BUS_CHANNEL, EXTENSION_TIMEOUT_ERROR
from tests.scripts.extension_socket_manager.fakes import (
    FakeBusRedis,
    FakeListenRedis,
    FakeStore,
    FakeWebSocket,
)


def _run(coro):
    return asyncio.run(coro)


def _make_manager(store=None):
    mgr = object.__new__(extension_socket_manager)
    mgr._sockets = {}
    mgr._store = store if store is not None else FakeStore()
    mgr._watchers = set()
    mgr._listener = None
    mgr._started = False
    mgr._start_lock = asyncio.Lock()
    return mgr


def test_get_instance_singleton():
    first = extension_socket_manager.get_instance()
    second = extension_socket_manager.get_instance()
    assert first is second


def test_ensure_started_already_started():
    mgr = _make_manager()
    mgr._started = True

    async def scenario():
        await mgr.ensure_started()

    _run(scenario())
    assert ("connect",) not in mgr._store.calls


def test_ensure_started_success(monkeypatch):
    monkeypatch.setattr(esm_module.asyncio, "create_task", lambda coro: _drain(coro))
    store = FakeStore()
    mgr = _make_manager(store)
    _run(mgr.ensure_started())
    assert mgr._started is True
    assert ("connect",) in store.calls


def test_ensure_started_connect_failure_disables_redis(monkeypatch):
    store = FakeStore(connect_error=True)
    mgr = _make_manager(store)
    _run(mgr.ensure_started())
    assert ("disable_redis",) in store.calls
    assert mgr._started is False


def _drain(coro):
    coro.close()

    class _Task:
        def add_done_callback(self, cb):
            pass

    return _Task()


def test_acknowledge_and_touch_socket():
    store = FakeStore()
    mgr = _make_manager(store)
    _run(mgr.acknowledge("req1"))
    _run(mgr.touch_socket("user1", "sock1"))
    assert ("acknowledge", "req1") in store.calls
    assert ("touch_socket", "user1", "sock1") in store.calls


def test_has_live_socket_from_local():
    mgr = _make_manager()
    ws = FakeWebSocket()
    mgr._sockets["user1"] = {ws}
    assert _run(mgr.has_live_socket("user1")) is True


def test_has_live_socket_from_store():
    store = FakeStore(has_socket=True)
    mgr = _make_manager(store)
    assert _run(mgr.has_live_socket("user1")) is True


def test_register_without_prior_socket_resends_outstanding(monkeypatch):
    store = FakeStore(has_socket=False, outstanding=[("req1", {"type": "cmd"})])
    mgr = _make_manager(store)
    spawned = []
    monkeypatch.setattr(mgr, "_spawn_watch", lambda rid, uk: spawned.append((rid, uk)))
    ws = FakeWebSocket()
    socket_id = _run(mgr.register("user1", ws))
    assert socket_id
    assert ws.sent == [{"type": "cmd", "request_id": "req1"}]
    assert spawned == [("req1", "user1")]


def test_register_with_prior_socket_skips_resend(monkeypatch):
    store = FakeStore(has_socket=True)
    mgr = _make_manager(store)
    existing = FakeWebSocket()
    mgr._sockets["user1"] = {existing}
    ws = FakeWebSocket()
    _run(mgr.register("user1", ws))
    assert ws.sent == []


def test_unregister_removes_socket():
    store = FakeStore()
    mgr = _make_manager(store)
    ws = FakeWebSocket()
    mgr._sockets["user1"] = {ws}
    _run(mgr.unregister("user1", ws, "sock1"))
    assert "user1" not in mgr._sockets
    assert ("drop_socket", "user1", "sock1") in store.calls


def test_unregister_no_sockets_returns():
    mgr = _make_manager()
    ws = FakeWebSocket()
    _run(mgr.unregister("user1", ws))


def test_spawn_watch_runtime_error_outside_loop(monkeypatch):
    mgr = _make_manager()
    monkeypatch.setattr(mgr, "_watch_request", lambda rid, uk: None)
    mgr._spawn_watch("req1", "user1")
    assert mgr._watchers == set()


def test_watch_request_not_outstanding_returns(monkeypatch):
    monkeypatch.setattr(esm_module.asyncio, "sleep", _noop_sleep)
    store = FakeStore(request_outstanding=False)
    mgr = _make_manager(store)
    _run(mgr._watch_request("req1", "user1"))


def test_watch_request_ack_respawns(monkeypatch):
    monkeypatch.setattr(esm_module.asyncio, "sleep", _noop_sleep)
    store = FakeStore(request_outstanding=True, take_ack=True)
    mgr = _make_manager(store)
    spawned = []
    monkeypatch.setattr(mgr, "_spawn_watch", lambda rid, uk: spawned.append((rid, uk)))
    _run(mgr._watch_request("req1", "user1"))
    assert spawned == [("req1", "user1")]


def test_watch_request_pop_none_returns(monkeypatch):
    monkeypatch.setattr(esm_module.asyncio, "sleep", _noop_sleep)
    store = FakeStore(request_outstanding=True, take_ack=False, pop_request=None)
    mgr = _make_manager(store)
    _run(mgr._watch_request("req1", "user1"))


def test_watch_request_timeout_writes_error_result(monkeypatch):
    monkeypatch.setattr(esm_module.asyncio, "sleep", _noop_sleep)
    store = FakeStore(request_outstanding=True, take_ack=False, pop_request="u:s")
    mgr = _make_manager(store)
    _run(mgr._watch_request("req1", "user1"))
    assert store.results["u:s"]["error"] == EXTENSION_TIMEOUT_ERROR
    assert "u:s" in store.released


async def _noop_sleep(_seconds):
    return None


def test_reset_sockets_closes_local_and_store():
    store = FakeStore()
    mgr = _make_manager(store)
    ws = FakeWebSocket()
    mgr._sockets["user1"] = {ws}
    _run(mgr.reset_sockets("user1"))
    assert ws.closed is True
    assert ("reset_sockets", "user1") in store.calls


def test_close_local_sockets_suppresses_errors():
    mgr = _make_manager()
    ws = FakeWebSocket(close_error=RuntimeError("boom"))
    mgr._sockets["user1"] = {ws}
    _run(mgr._close_local_sockets("user1"))
    assert "user1" not in mgr._sockets


def test_cancel_invalidates_and_releases():
    store = FakeStore()
    mgr = _make_manager(store)
    _run(mgr.cancel("user1", "scope"))
    assert ("invalidate_request_for_scope", "user1:scope") in store.calls
    assert ("drop_result", "user1:scope") in store.calls
    assert "user1:scope" in store.released


def test_take_result_and_is_inflight():
    store = FakeStore(pop_result={"items": [1]}, is_inflight=True)
    mgr = _make_manager(store)
    assert _run(mgr.take_result("user1", "scope")) == {"items": [1]}
    assert _run(mgr.is_inflight("user1", "scope")) is True


def test_fire_invalid_scope_returns():
    store = FakeStore()
    mgr = _make_manager(store)
    mgr._started = True
    _run(mgr.fire("user1", {"no_type": True}))
    assert all(call[0] != "put_request" for call in store.calls)


def test_fire_claim_fails_returns():
    store = FakeStore(claim=False)
    mgr = _make_manager(store)
    mgr._started = True
    _run(mgr.fire("user1", {"type": "cmd"}))
    assert all(call[0] != "put_request" for call in store.calls)


def test_fire_no_sockets_no_live_releases():
    store = FakeStore(claim=True, has_socket=False)
    mgr = _make_manager(store)
    mgr._started = True
    _run(mgr.fire("user1", {"type": "cmd"}))
    assert "user1:cmd" in store.released


def test_fire_sends_to_live_sockets(monkeypatch):
    store = FakeStore(claim=True)
    mgr = _make_manager(store)
    mgr._started = True
    monkeypatch.setattr(mgr, "_spawn_watch", lambda rid, uk: None)
    ws = FakeWebSocket()
    mgr._sockets["user1"] = {ws}
    _run(mgr.fire("user1", {"type": "cmd"}, "scope"))
    assert ws.sent
    assert ws.sent[0]["type"] == "cmd"


def test_fire_publishes_to_redis_bus(monkeypatch):
    redis = FakeBusRedis()
    store = FakeStore(claim=True, has_socket=True)
    store.redis = redis
    mgr = _make_manager(store)
    mgr._started = True
    monkeypatch.setattr(mgr, "_spawn_watch", lambda rid, uk: None)
    _run(mgr.fire("user1", {"type": "cmd"}))
    assert redis.published
    assert redis.published[0][0] == BUS_CHANNEL


def test_fire_no_sockets_no_redis_pops_request():
    store = FakeStore(claim=True, has_socket=True)
    store.redis = None
    mgr = _make_manager(store)
    mgr._started = True
    _run(mgr.fire("user1", {"type": "cmd"}))
    assert "user1:cmd" in store.released


def test_resolve_missing_request_returns():
    store = FakeStore(pop_request=None)
    mgr = _make_manager(store)
    _run(mgr.resolve("req1", {"items": []}))
    assert store.results == {}


def test_resolve_stores_result():
    store = FakeStore(pop_request="u:s")
    mgr = _make_manager(store)
    _run(mgr.resolve("req1", {"items": [1]}))
    assert store.results["u:s"] == {"items": [1]}
    assert "u:s" in store.released


def test_disconnect_closes_sockets():
    mgr = _make_manager()
    ws = FakeWebSocket()
    bad = FakeWebSocket(close_error=RuntimeError("boom"))
    mgr._sockets["user1"] = {ws, bad}
    _run(mgr.disconnect("user1"))
    assert ws.closed is True


def test_live_sockets_empty():
    mgr = _make_manager()
    assert mgr._live_sockets("user1") == []


def test_live_sockets_discards_disconnected():
    mgr = _make_manager()
    dead = FakeWebSocket(state=WebSocketState.DISCONNECTED)
    mgr._sockets["user1"] = {dead}
    assert mgr._live_sockets("user1") == []
    assert "user1" not in mgr._sockets


def test_live_sockets_returns_connected():
    mgr = _make_manager()
    ws = FakeWebSocket()
    mgr._sockets["user1"] = {ws}
    assert mgr._live_sockets("user1") == [ws]


def test_listen_no_redis_returns():
    store = FakeStore()
    store.redis = None
    mgr = _make_manager(store)
    _run(mgr._listen())


def test_on_bus_invalid_user_key():
    mgr = _make_manager()
    _run(mgr._on_bus({"kind": "request", "user_key": None}))


def test_on_bus_reset_closes_local():
    mgr = _make_manager()
    ws = FakeWebSocket()
    mgr._sockets["user1"] = {ws}
    _run(mgr._on_bus({"kind": "reset", "user_key": "user1"}))
    assert "user1" not in mgr._sockets


def test_on_bus_non_request_kind_returns():
    mgr = _make_manager()
    _run(mgr._on_bus({"kind": "other", "user_key": "user1"}))


def test_on_bus_request_no_sockets_returns():
    mgr = _make_manager()
    _run(mgr._on_bus({"kind": "request", "user_key": "user1", "request_id": "r1", "payload": {}}))


def test_spawn_watch_success_registers_task():
    mgr = _make_manager()

    async def scenario():
        async def fake_watch(request_id, user_key):
            return None

        mgr._watch_request = fake_watch
        mgr._spawn_watch("req1", "user1")
        await asyncio.sleep(0)
        await asyncio.sleep(0)

    _run(scenario())
    assert mgr._watchers == set()


def test_listen_processes_messages(monkeypatch):
    seen = []

    async def fake_on_bus(data):
        seen.append(data)

    messages = [
        {"type": "subscribe"},
        {"type": "message", "data": "not-json{"},
        {"type": "message", "data": '{"kind": "request", "user_key": "user1"}'},
    ]
    store = FakeStore()
    store.redis = FakeListenRedis(messages)
    mgr = _make_manager(store)
    mgr._on_bus = fake_on_bus
    _run(mgr._listen())
    assert seen == [{"kind": "request", "user_key": "user1"}]


def test_listen_on_bus_exception_is_caught():
    async def boom(data):
        raise RuntimeError("bad")

    messages = [{"type": "message", "data": '{"kind": "request", "user_key": "user1"}'}]
    store = FakeStore()
    store.redis = FakeListenRedis(messages)
    mgr = _make_manager(store)
    mgr._on_bus = boom
    _run(mgr._listen())


def test_on_bus_request_sends_to_sockets():
    mgr = _make_manager()
    ws = FakeWebSocket()
    mgr._sockets["user1"] = {ws}
    _run(mgr._on_bus({"kind": "request", "user_key": "user1", "request_id": "r1", "payload": {"type": "cmd"}}))
    assert ws.sent == [{"type": "cmd", "request_id": "r1"}]
