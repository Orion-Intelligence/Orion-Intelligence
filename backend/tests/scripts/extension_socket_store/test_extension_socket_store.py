from __future__ import annotations

import asyncio
from types import SimpleNamespace

import orion.api.interactive.extension_manager.extension_socket_store as ess_module
from orion.api.interactive.extension_manager.extension_socket_store import ExtensionSocketStore
from orion.api.interactive.extension_manager.constants.constant import (
    ACK_KEY,
    INFLIGHT_KEY,
    REQUEST_KEY,
    REQUEST_PAYLOAD_KEY,
    RESULT_KEY,
    SCOPE_REQUEST_KEY,
    SOCKET_KEY,
)
from tests.scripts.extension_socket_store.fakes import FakeAsyncRedis


def _run(coro):
    return asyncio.run(coro)


def _store(redis=None):
    store = ExtensionSocketStore()
    store._redis = redis
    return store


def test_connect_and_disable(monkeypatch):
    created = {}
    monkeypatch.setattr(
        ess_module.redis,
        "Redis",
        lambda **kwargs: created.setdefault("kwargs", kwargs) or SimpleNamespace(**kwargs),
    )
    store = ExtensionSocketStore()
    store.connect()
    assert store.redis is not None
    assert created["kwargs"]["decode_responses"] is True
    store.disable_redis()
    assert store.redis is None


def test_claim_and_release_inflight_local():
    store = _store()
    assert _run(store.claim_inflight("u:scope")) is True
    assert _run(store.claim_inflight("u:scope")) is False
    _run(store.release_inflight("u:scope"))
    assert _run(store.claim_inflight("u:scope")) is True
    assert _run(store.is_inflight("u:scope")) is True


def test_claim_inflight_redis():
    redis = FakeAsyncRedis()
    store = _store(redis)
    assert _run(store.claim_inflight("u:scope")) is True
    assert _run(store.claim_inflight("u:scope")) is False
    assert f"{INFLIGHT_KEY}:u:scope" in redis.store
    _run(store.release_inflight("u:scope"))
    assert f"{INFLIGHT_KEY}:u:scope" not in redis.store
    assert _run(store.is_inflight("u:scope")) is False


def test_claim_inflight_redis_error_falls_back_to_local():
    redis = FakeAsyncRedis(fail=["set"])
    store = _store(redis)
    assert _run(store.claim_inflight("u:scope")) is True


def test_clear_inflight_for_user_local():
    store = _store()
    _run(store.claim_inflight("user1:a"))
    _run(store.claim_inflight("user1:b"))
    _run(store.claim_inflight("user2:c"))
    _run(store.clear_inflight_for_user("user1"))
    assert store._local_inflight == {"user2:c"}


def test_clear_inflight_for_user_redis():
    redis = FakeAsyncRedis()
    store = _store(redis)
    redis.store[f"{INFLIGHT_KEY}:user1:a"] = "1"
    redis.store[f"{INFLIGHT_KEY}:user1:b"] = "1"
    redis.store[f"{INFLIGHT_KEY}:user2:c"] = "1"
    _run(store.clear_inflight_for_user("user1"))
    assert f"{INFLIGHT_KEY}:user1:a" not in redis.store
    assert f"{INFLIGHT_KEY}:user2:c" in redis.store


def test_put_pop_drop_result_local():
    store = _store()
    _run(store.put_result("u:s", {"items": [1]}))
    assert _run(store.pop_result("u:s")) == {"items": [1]}
    assert _run(store.pop_result("u:s")) is None
    _run(store.put_result("u:s", {"x": 1}))
    _run(store.drop_result("u:s"))
    assert _run(store.pop_result("u:s")) is None


def test_put_pop_drop_result_redis():
    redis = FakeAsyncRedis()
    store = _store(redis)
    _run(store.put_result("u:s", {"items": [1]}))
    assert f"{RESULT_KEY}:u:s" in redis.store
    assert _run(store.pop_result("u:s")) == {"items": [1]}
    _run(store.put_result("u:s", {"x": 1}))
    _run(store.drop_result("u:s"))
    assert f"{RESULT_KEY}:u:s" not in redis.store


def test_pop_result_redis_empty_falls_back():
    redis = FakeAsyncRedis()
    store = _store(redis)
    store._local_results["u:s"] = {"local": True}
    assert _run(store.pop_result("u:s")) == {"local": True}


def test_put_and_pop_request_local():
    store = _store()
    _run(store.put_request("req1", "u:s", {"type": "cmd"}))
    assert _run(store.request_outstanding("req1")) is True
    assert _run(store.pop_request("req1")) == "u:s"
    assert _run(store.request_outstanding("req1")) is False
    assert _run(store.pop_request("missing")) is None


def test_put_and_pop_request_redis():
    redis = FakeAsyncRedis()
    store = _store(redis)
    _run(store.put_request("req1", "u:s", {"type": "cmd"}))
    assert f"{REQUEST_KEY}:req1" in redis.store
    assert f"{SCOPE_REQUEST_KEY}:u:s" in redis.store
    assert f"{REQUEST_PAYLOAD_KEY}:req1" in redis.store
    assert _run(store.request_outstanding("req1")) is True
    assert _run(store.pop_request("req1")) == "u:s"
    assert f"{SCOPE_REQUEST_KEY}:u:s" not in redis.store


def test_pop_request_redis_error_falls_back_local():
    redis = FakeAsyncRedis(fail=["getdel"])
    store = _store(redis)
    store._local_requests["req1"] = "u:s"
    store._local_scope_requests["u:s"] = "req1"
    assert _run(store.pop_request("req1")) == "u:s"


def test_put_request_without_payload_local():
    store = _store()
    _run(store.put_request("req1", "u:s"))
    assert "req1" not in store._local_request_payloads


def test_outstanding_requests_for_user_local():
    store = _store()
    _run(store.put_request("req1", "user1:scope", {"type": "cmd"}))
    _run(store.put_request("req2", "other:scope", {"type": "cmd2"}))
    out = _run(store.outstanding_requests_for_user("user1"))
    assert out == [("req1", {"type": "cmd"})]


def test_outstanding_requests_for_user_redis():
    redis = FakeAsyncRedis()
    store = _store(redis)
    _run(store.put_request("req1", "user1:scope", {"type": "cmd"}))
    out = _run(store.outstanding_requests_for_user("user1"))
    assert out == [("req1", {"type": "cmd"})]


def test_outstanding_requests_redis_skips_missing_payload():
    redis = FakeAsyncRedis()
    store = _store(redis)
    redis.store[f"{SCOPE_REQUEST_KEY}:user1:scope"] = "req1"
    out = _run(store.outstanding_requests_for_user("user1"))
    assert out == []


def test_request_outstanding_redis():
    redis = FakeAsyncRedis()
    store = _store(redis)
    redis.store[f"{REQUEST_KEY}:req1"] = "u:s"
    assert _run(store.request_outstanding("req1")) is True


def test_invalidate_request_for_scope_local():
    store = _store()
    _run(store.put_request("req1", "u:s", {"type": "cmd"}))
    _run(store.acknowledge("req1"))
    _run(store.invalidate_request_for_scope("u:s"))
    assert "req1" not in store._local_requests
    assert "req1" not in store._local_acks


def test_invalidate_request_for_scope_redis():
    redis = FakeAsyncRedis()
    store = _store(redis)
    _run(store.put_request("req1", "u:s", {"type": "cmd"}))
    _run(store.invalidate_request_for_scope("u:s"))
    assert f"{REQUEST_KEY}:req1" not in redis.store


def test_invalidate_request_for_scope_no_request():
    store = _store()
    _run(store.invalidate_request_for_scope("u:missing"))


def test_invalidate_request_redis_error_falls_back():
    redis = FakeAsyncRedis(fail=["getdel"])
    store = _store(redis)
    store._local_scope_requests["u:s"] = "req1"
    store._local_requests["req1"] = "u:s"
    _run(store.invalidate_request_for_scope("u:s"))
    assert "req1" not in store._local_requests


def test_acknowledge_and_take_ack_local():
    store = _store()
    _run(store.acknowledge("req1"))
    assert _run(store.take_ack("req1")) is True
    assert _run(store.take_ack("req1")) is False


def test_acknowledge_and_take_ack_redis():
    redis = FakeAsyncRedis()
    store = _store(redis)
    _run(store.put_request("req1", "u:s", {"type": "cmd"}))
    _run(store.acknowledge("req1"))
    assert f"{ACK_KEY}:req1" in redis.store
    assert redis.expired
    assert _run(store.take_ack("req1")) is True


def test_touch_and_drop_and_has_socket_redis():
    redis = FakeAsyncRedis()
    store = _store(redis)
    _run(store.touch_socket("user1", "sock1"))
    assert f"{SOCKET_KEY}:user1" in redis.store
    assert _run(store.has_socket("user1")) is True
    _run(store.drop_socket("user1", "sock1"))
    assert f"{SOCKET_KEY}:user1:sock1" not in redis.store


def test_has_socket_scan_branch():
    redis = FakeAsyncRedis()
    store = _store(redis)
    redis.store[f"{SOCKET_KEY}:user1:sock1"] = "worker"
    assert _run(store.has_socket("user1")) is True


def test_socket_ops_noop_without_redis():
    store = _store()
    _run(store.touch_socket("user1", "sock1"))
    _run(store.drop_socket("user1", "sock1"))
    assert _run(store.has_socket("user1")) is False
    _run(store.reset_sockets("user1"))


def test_reset_sockets_publishes():
    redis = FakeAsyncRedis()
    store = _store(redis)
    redis.store[f"{SOCKET_KEY}:user1:sock1"] = "worker"
    _run(store.reset_sockets("user1"))
    assert f"{SOCKET_KEY}:user1:sock1" not in redis.store
    assert redis.published


def test_is_inflight_redis():
    redis = FakeAsyncRedis()
    store = _store(redis)
    redis.store[f"{INFLIGHT_KEY}:u:s"] = "1"
    assert _run(store.is_inflight("u:s")) is True
