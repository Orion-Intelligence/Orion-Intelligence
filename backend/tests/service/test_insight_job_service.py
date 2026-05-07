from __future__ import annotations

import asyncio
import json

import pytest

from orion.management.jobs.insight_job import insight_job
from orion.management.models.insight_model import InsightData
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
from tests.fake_model.fakes import FakeRedis


def test_populate_comparison_model_calculates_daily_and_weekly_changes():
    old_daily = InsightData()
    old_weekly = InsightData()
    new = InsightData()
    new.general.document_count = 10
    new.general.most_recent = "2026-04-01"
    new.leak.document_count = 5
    old_daily.leak.document_count = 5
    old_weekly.general.document_count = 5

    result = insight_job.populate_comparison_model(old_daily, new, old_weekly)

    assert result.general.document_count.key == "Document Count"
    assert result.general.document_count.change_daily == "100%"
    assert result.general.document_count.change_weekly == "100.00%"
    assert result.leak.document_count.change_daily == "0%"
    assert result.general.most_recent.value == "2026-04-01"


@pytest.mark.anyio
async def test_update_trending_insights_reads_old_values_and_writes_day_snapshot(monkeypatch):
    fake_redis = FakeRedis()
    new_insight = InsightData()
    new_insight.general.document_count = 7

    monkeypatch.setattr(
        "orion.management.jobs.insight_job.elastic_controller.get_instance",
        staticmethod(lambda: type("Elastic", (), {"get_insight": staticmethod(lambda: asyncio.sleep(0, result=(True, new_insight)))})()),
    )
    monkeypatch.setattr(
        "orion.management.jobs.insight_job.redis_controller.getInstance",
        staticmethod(lambda: fake_redis),
    )

    job = object.__new__(insight_job)
    await job.update_trending_insights(REDIS_KEYS.INSIGHT_OLD_DAY)

    assert any(call[1][0] == REDIS_KEYS.INSIGHT_STAT for call in fake_redis.calls)
    assert REDIS_KEYS.INSIGHT_OLD_DAY in fake_redis.values
    stored = json.loads(fake_redis.values[REDIS_KEYS.INSIGHT_OLD_DAY])
    assert stored["general"]["document_count"] == 7


@pytest.mark.anyio
async def test_update_trending_insights_writes_week_snapshot_when_requested(monkeypatch):
    fake_redis = FakeRedis(
        {
            REDIS_KEYS.INSIGHT_OLD_DAY: InsightData().model_dump_json(),
            REDIS_KEYS.INSIGHT_OLD_WEEK: InsightData().model_dump_json(),
        }
    )
    new_insight = InsightData()
    new_insight.defacement.document_count = 3

    monkeypatch.setattr(
        "orion.management.jobs.insight_job.elastic_controller.get_instance",
        staticmethod(lambda: type("Elastic", (), {"get_insight": staticmethod(lambda: asyncio.sleep(0, result=(True, new_insight)))})()),
    )
    monkeypatch.setattr(
        "orion.management.jobs.insight_job.redis_controller.getInstance",
        staticmethod(lambda: fake_redis),
    )

    job = object.__new__(insight_job)
    await job.update_trending_insights(REDIS_KEYS.INSIGHT_OLD_WEEK)

    stored = json.loads(fake_redis.values[REDIS_KEYS.INSIGHT_OLD_WEEK])
    assert stored["defacement"]["document_count"] == 3


@pytest.mark.anyio
async def test_update_insights_runs_day_then_weekly_rollover(monkeypatch):
    class _StopLoop(Exception):
        pass

    calls = []

    async def _fake_update(self, arg):
        calls.append(arg)
        if arg == REDIS_KEYS.INSIGHT_OLD_WEEK:
            raise _StopLoop

    async def _fake_sleep(_seconds):
        return None

    fake_redis = FakeRedis()
    monkeypatch.setattr(
        "orion.management.jobs.insight_job.redis_controller.getInstance",
        staticmethod(lambda: fake_redis),
    )
    monkeypatch.setattr(insight_job, "update_trending_insights", _fake_update)

    monkeypatch.setattr("orion.management.jobs.insight_job.asyncio.sleep", _fake_sleep)
    job = object.__new__(insight_job)

    try:
        await job.update_insights()
    except _StopLoop:
        pass

    assert fake_redis.calls[0] == (REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_OLD_DAY, None, None])
    assert calls[0] == REDIS_KEYS.INSIGHT_OLD_DAY
    assert REDIS_KEYS.INSIGHT_OLD_WEEK in calls
