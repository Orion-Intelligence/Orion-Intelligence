from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from types import SimpleNamespace

from orion.management.jobs.social_profile.social_profile_job import social_profile_job
from orion.services.redis_manager import redis_controller as redis_module
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS


class _FakeRedis:
    def __init__(self):
        self.values = {}

    async def invoke_trigger(self, command, payload):
        if command == REDIS_COMMANDS.S_GET_STRING:
            return self.values.get(payload[0])
        if command == REDIS_COMMANDS.S_SET_STRING:
            self.values[payload[0]] = payload[1]
            return True
        if command == REDIS_COMMANDS.S_DELETE_KEY:
            self.values.pop(payload[0], None)
            return True
        return None

    @asynccontextmanager
    async def lock(self, *_args, **_kwargs):
        yield


def _job(monkeypatch):
    fake = _FakeRedis()
    monkeypatch.setattr(redis_module.redis_controller, "getInstance", staticmethod(lambda: fake))
    return object.__new__(social_profile_job)


def test_cancelling_a_scheduled_run_stops_the_daily_loop_but_a_manual_one_does_not(monkeypatch):
    job = _job(monkeypatch)
    asyncio.run(job._begin_run("automation/ad-monitor", {"run_id": "manual", "user_id": "u1", "profile_id": "p1", "is_manual": True}))
    asyncio.run(job._begin_run("automation/ad-monitor", {"run_id": "daily", "user_id": "u1", "profile_id": "p2", "is_manual": False}))

    assert asyncio.run(job.cancel_run("u1", "manual")) is True
    assert asyncio.run(job._is_daily_stopped()) is False
    assert asyncio.run(job.cancel_run("u2", "daily")) is False
    assert asyncio.run(job.cancel_run("u1", "daily")) is True
    assert asyncio.run(job._is_daily_stopped()) is True


def test_profile_purposes_stop_running_once_the_daily_loop_is_cancelled(monkeypatch):
    job = _job(monkeypatch)
    calls = []

    async def fake_run(*_args, **_kwargs):
        calls.append("run")
        await job._set_daily_stop()

    job.run_posting = fake_run
    job.run_ad_monitoring = fake_run
    profile = SimpleNamespace(purposes=["posting", "ad_monitoring"], profile_id="p1", platform="x")
    asyncio.run(job._run_profile_purposes(profile, SimpleNamespace(), {}, "u1"))
    assert calls == ["run"]
