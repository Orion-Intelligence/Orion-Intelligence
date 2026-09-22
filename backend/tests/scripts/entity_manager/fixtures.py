from __future__ import annotations

import pytest

import orion.api.server.entity_manager.entity_manager as entity_module

from tests.scripts.entity_manager.fakes import _FakeLog, _FakeRedisController, _FakeRedisProvider


async def _passthrough_run_in_threadpool(func, *args, **kwargs):
    return func(*args, **kwargs)


@pytest.fixture(autouse=True)
def _patch_entity_collaborators(monkeypatch):
    redis_controller = _FakeRedisController()
    fake_log = _FakeLog()
    monkeypatch.setattr(entity_module, "run_in_threadpool", _passthrough_run_in_threadpool)
    monkeypatch.setattr(entity_module, "redis_controller", _FakeRedisProvider(redis_controller))
    monkeypatch.setattr(entity_module, "log", fake_log)
    monkeypatch.setattr(entity_module.time, "sleep", lambda *_args, **_kwargs: None)
    return {"redis": redis_controller, "log": fake_log}
