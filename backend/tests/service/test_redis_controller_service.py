from __future__ import annotations

import asyncio
from contextlib import contextmanager

from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS
import orion.services.redis_manager.redis_controller as redis_module


@contextmanager
def _swap_attrs(*items):
    originals = []
    try:
        for owner, attr, value in items:
            originals.append((owner, attr, getattr(owner, attr)))
            setattr(owner, attr, value)
        yield
    finally:
        for owner, attr, value in reversed(originals):
            setattr(owner, attr, value)


class _FakeLock:
    def __init__(self):
        self._locked = False

    async def __aenter__(self):
        self._locked = True
        return _FakeEnteredLock(self)

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def locked(self):
        return self._locked

    async def release(self):
        self._locked = False


class _FakeEnteredLock:
    def __init__(self, lock: _FakeLock):
        self._lock = lock

    def locked(self):
        return self._lock._locked


class _FakeRedisBackend:
    def __init__(self):
        self.store: dict[str, object] = {}
        self.expiry: dict[str, int] = {}
        self.closed = False
        self._locks: dict[str, _FakeLock] = {}

    async def set(self, key, value, ex=None):
        self.store[key] = value
        if ex is not None:
            self.expiry[key] = ex

    async def get(self, key):
        return self.store.get(key)

    async def exists(self, key):
        return key in self.store

    async def sadd(self, key, value):
        values = self.store.setdefault(key, set())
        if isinstance(values, set):
            values.add(value)

    async def smembers(self, key):
        values = self.store.get(key, set())
        return set(values) if isinstance(values, set) else set()

    async def expire(self, key, expiry):
        self.expiry[key] = expiry

    async def keys(self):
        return list(self.store.keys())

    async def flushall(self):
        self.store.clear()
        self.expiry.clear()

    def lock(self, key, timeout=None, blocking_timeout=None):
        return self._locks.setdefault(key, _FakeLock())

    async def delete(self, key):
        self.store.pop(key, None)
        self.expiry.pop(key, None)

    async def close(self):
        self.closed = True


def _reset_redis_singleton():
    redis_controller._redis_controller__instance = None


def test_redis_controller_initializes_and_is_singleton():
    fake_backend = _FakeRedisBackend()
    _reset_redis_singleton()

    try:
        with _swap_attrs((redis_module.redis, "Redis", lambda **_kwargs: fake_backend)):
            first = redis_controller.getInstance()
            second = redis_controller.getInstance()
            asyncio.run(first.initialize())

        assert first is second
        assert first._redis_controller__redis is fake_backend
    finally:
        _reset_redis_singleton()


def test_redis_controller_handles_string_int_float_bool_and_list_commands():
    controller = object.__new__(redis_controller)
    backend = _FakeRedisBackend()
    controller._redis_controller__redis = backend

    assert asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_GET_BOOL, ["flag", True])) is True
    assert backend.store["flag"] == 1
    assert asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_GET_INT, ["count", 7, 30])) == 7
    assert backend.expiry["count"] == 30
    assert asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_GET_FLOAT, ["ratio", 1.5, 45])) == 1.5
    assert backend.expiry["ratio"] == 45
    assert asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_GET_STRING, ["token", "abc", 60])) == "abc"
    assert backend.expiry["token"] == 60

    asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_SET_LIST, ["roles", "admin", 20]))
    asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_SET_LIST, ["roles", "member", 20]))
    assert asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_GET_LIST, ["roles", None, 20])) == {"admin", "member"}


def test_redis_controller_returns_none_for_missing_optional_values():
    controller = object.__new__(redis_controller)
    controller._redis_controller__redis = _FakeRedisBackend()

    assert asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_GET_BOOL, ["missing-bool", None])) is None
    assert asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_GET_STRING, ["missing-string", None, None])) is None


def test_redis_controller_exposes_keys_and_deletes_and_flushes():
    controller = object.__new__(redis_controller)
    backend = _FakeRedisBackend()
    controller._redis_controller__redis = backend

    asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_SET_STRING, ["alpha", "one", None]))
    asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_SET_INT, ["beta", 2, None]))
    assert set(asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_GET_KEYS, None))) == {"alpha", "beta"}

    asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_DELETE_KEY, ["alpha"]))
    assert set(asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_GET_KEYS, None))) == {"beta"}

    asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_FLUSH_ALL, None))
    assert asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_GET_KEYS, None)) == []


def test_redis_controller_acquires_releases_and_closes_connection():
    controller = object.__new__(redis_controller)
    backend = _FakeRedisBackend()
    controller._redis_controller__redis = backend

    assert asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_ACQUIRE_LOCK, ["job-lock", 5, 1])) is True
    asyncio.run(controller.invoke_trigger(REDIS_COMMANDS.S_RELEASE_LOCK, ["job-lock"]))
    assert asyncio.run(backend.lock("job-lock").locked()) is False

    asyncio.run(controller.close_connection())
    assert backend.closed is True


def test_redis_controller_destroy_instance_clears_singleton():
    _reset_redis_singleton()
    try:
        instance = redis_controller.getInstance()
        assert instance is not None

        asyncio.run(redis_controller.destroy_instance())
        assert redis_controller._redis_controller__instance is None
    finally:
        _reset_redis_singleton()
