from __future__ import annotations

import asyncio
from types import SimpleNamespace

from orion.management.jobs.social_profile.social_profile_job import social_profile_job


def _job():
    job = object.__new__(social_profile_job)
    job._active_runs = {}
    job._stop_daily = False
    return job


def test_cancelling_a_scheduled_run_stops_the_daily_loop_but_a_manual_one_does_not():
    job = _job()
    job._begin_run("automation/ad-monitor", {"run_id": "manual", "user_id": "u1", "profile_id": "p1", "is_manual": True})
    job._begin_run("automation/ad-monitor", {"run_id": "daily", "user_id": "u1", "profile_id": "p2", "is_manual": False})

    assert job.cancel_run("u1", "manual") is True
    assert job._stop_daily is False
    assert job.cancel_run("u2", "daily") is False
    assert job.cancel_run("u1", "daily") is True
    assert job._stop_daily is True


def test_profile_purposes_stop_running_once_the_daily_loop_is_cancelled():
    job = _job()
    calls = []

    async def fake_run(*_args, **_kwargs):
        calls.append("run")
        job._stop_daily = True

    job.run_posting = fake_run
    job.run_ad_monitoring = fake_run
    profile = SimpleNamespace(purposes=["posting", "ad_monitoring"], profile_id="p1", platform="x")
    asyncio.run(job._run_profile_purposes(profile, SimpleNamespace(), {}, "u1"))
    assert calls == ["run"]
