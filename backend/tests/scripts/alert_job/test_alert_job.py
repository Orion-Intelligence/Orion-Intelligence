from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from bson import ObjectId

from orion.api.interactive.scheduler_manager.scheduler_manager import DailySchedulerConfig, SchedulerManager
from orion.services.mongo_manager.shared_model.db_scheduler_model import SchedulerMailStatus, SchedulerRunStatus
from tests.scripts.alert_job.fakes import _FakeAlertManager, _FakeSchedulerCollection
from tests.scripts.alert_job.helpers import _freeze_scheduler_now, make_alert_job


def test_alert_batch_reruns_tenant_and_sends_tenant_and_admin_mail(monkeypatch):
    tenant = SimpleNamespace(id="tenant-1", name="Tenant One", is_default=False, iocs=[])
    alert_manager = _FakeAlertManager(running=False)
    job = make_alert_job(alert_manager, [tenant])

    async def process_tenant_alerts(_tenant, category, _allowed_categories=None):
        return {"total": 1} if category == "scanning" else {"total": 0}

    monkeypatch.setattr(
        "orion.management.jobs.alert.alert_job.ALERT_CATEGORIES",
        ["scanning"],
    )
    monkeypatch.setattr(job, "_process_tenant_alerts", process_tenant_alerts)

    result = asyncio.run(job.run_default_scheduled_categories())

    assert result["status"] == "success"
    assert result["mail_status"] == "sent"
    assert result["processed_tenant_count"] == 1
    assert result["mail_sent_count"] == 1
    assert result["admin_mail_sent"] is True
    assert alert_manager.status_calls == ["tenant-1"]
    assert alert_manager.running_calls == [("tenant-1", True), ("tenant-1", False)]
    assert alert_manager.tenant_mail_calls[0]["tenant_id"] == "tenant-1"
    assert alert_manager.admin_mail_calls == [[{
        "tenant_id": "tenant-1",
        "tenant_name": "Tenant One",
        "alert_count": 1,
    }]]


def test_default_alert_batch_only_runs_tenants_without_custom_alert_time(monkeypatch):
    default_tenant = SimpleNamespace(id="tenant-default", name="Default Tenant", is_default=False, iocs=[], alert_run_time=None)
    custom_tenant_1 = SimpleNamespace(id="tenant-custom-1", name="Custom One", is_default=False, iocs=[], alert_run_time="13:00")
    custom_tenant_2 = SimpleNamespace(id="tenant-custom-2", name="Custom Two", is_default=False, iocs=[], alert_run_time="15:30")
    alert_manager = _FakeAlertManager(running=False)
    job = make_alert_job(alert_manager, [default_tenant, custom_tenant_1, custom_tenant_2])

    async def process_tenant_alerts(_tenant, _category, _allowed_categories=None):
        return {"total": 0}

    monkeypatch.setattr(
        "orion.management.jobs.alert.alert_job.ALERT_CATEGORIES",
        ["scanning"],
    )
    monkeypatch.setattr(job, "_process_tenant_alerts", process_tenant_alerts)

    result = asyncio.run(job.run_default_scheduled_categories())

    assert result["processed_tenant_count"] == 1
    assert result["skipped_tenant_count"] == 2
    assert alert_manager.status_calls == ["tenant-default"]
    assert alert_manager.running_calls == [("tenant-default", True), ("tenant-default", False)]
    assert alert_manager.tenant_mail_calls[0]["tenant_id"] == "tenant-default"


def test_custom_alert_batch_runs_selected_tenant_with_custom_alert_time(monkeypatch):
    custom_tenant = SimpleNamespace(id="tenant-custom", name="Custom Tenant", is_default=False, iocs=[], alert_run_time="13:00")
    alert_manager = _FakeAlertManager(running=False)
    job = make_alert_job(alert_manager, [])

    async def process_tenant_alerts(_tenant, _category, _allowed_categories=None):
        return {"total": 0}

    monkeypatch.setattr(
        "orion.management.jobs.alert.alert_job.ALERT_CATEGORIES",
        ["scanning"],
    )
    monkeypatch.setattr(job, "_process_tenant_alerts", process_tenant_alerts)

    result = asyncio.run(job.run_tenant_categories(custom_tenant))

    assert result["processed_tenant_count"] == 1
    assert result["skipped_tenant_count"] == 0
    assert alert_manager.status_calls == ["tenant-custom"]
    assert alert_manager.running_calls == [("tenant-custom", True), ("tenant-custom", False)]
    assert alert_manager.tenant_mail_calls[0]["tenant_id"] == "tenant-custom"


def test_scheduler_recovers_stale_running_alert_job_and_reruns_on_startup():
    now = datetime.now(timezone.utc)
    config = DailySchedulerConfig(
        job_key="auto_alert_scan",
        hour=0,
        minute=0,
        timezone_name="UTC",
        handler=lambda: handler(),
        stale_after=timedelta(minutes=15),
        heartbeat_interval=timedelta(seconds=60),
    )
    scheduled_for = SchedulerManager.scheduled_for_today(config, now)
    docs = [{
        "_id": ObjectId(),
        "job_key": "auto_alert_scan",
        "scheduled_for": scheduled_for,
        "status": SchedulerRunStatus.RUNNING.value,
        "mail_status": SchedulerMailStatus.PENDING.value,
        "updated_at": now - timedelta(minutes=30),
    }]
    manager = object.__new__(SchedulerManager)
    manager._collection = _FakeSchedulerCollection(docs)
    calls = []

    async def handler():
        calls.append("run")
        return {"status": "success", "mail_status": "sent"}

    result = asyncio.run(manager.run_due_daily_job(config, reason="startup_or_schedule_check"))

    assert result is True
    assert calls == ["run"]
    assert docs[0]["status"] == SchedulerRunStatus.SUCCESS.value
    assert docs[0]["mail_status"] == SchedulerMailStatus.SENT.value
    assert docs[0]["completed_at"] is not None


def test_scheduler_recovery_after_two_days_runs_only_current_day(monkeypatch):
    now = datetime(2026, 7, 10, 14, 0, tzinfo=timezone.utc)
    _freeze_scheduler_now(monkeypatch, now)
    config = DailySchedulerConfig(
        job_key="auto_alert_scan",
        hour=13,
        minute=0,
        timezone_name="UTC",
        handler=lambda: handler(),
        stale_after=timedelta(minutes=15),
        heartbeat_interval=timedelta(seconds=60),
    )
    docs = [{
        "_id": ObjectId(),
        "job_key": "auto_alert_scan",
        "scheduled_for": datetime(2026, 7, 8, 13, 0, tzinfo=timezone.utc),
        "status": SchedulerRunStatus.RUNNING.value,
        "mail_status": SchedulerMailStatus.PENDING.value,
        "updated_at": datetime(2026, 7, 8, 13, 5, tzinfo=timezone.utc),
    }]
    manager = object.__new__(SchedulerManager)
    manager._collection = _FakeSchedulerCollection(docs)
    calls = []

    async def handler():
        calls.append("run")
        return {"status": "success", "mail_status": "sent"}

    result = asyncio.run(manager.run_due_daily_job(config, reason="startup_or_schedule_check"))

    assert result is True
    assert calls == ["run"]
    assert len(docs) == 2
    assert docs[0]["scheduled_for"] == datetime(2026, 7, 8, 13, 0, tzinfo=timezone.utc)
    assert docs[0]["status"] == SchedulerRunStatus.RUNNING.value
    assert docs[1]["scheduled_for"] == datetime(2026, 7, 10, 13, 0, tzinfo=timezone.utc)
    assert docs[1]["status"] == SchedulerRunStatus.SUCCESS.value


def test_scheduler_runs_missed_alert_when_server_recovers_after_scheduled_time(monkeypatch):
    now = datetime(2026, 7, 10, 14, 0, tzinfo=timezone.utc)
    _freeze_scheduler_now(monkeypatch, now)
    config = DailySchedulerConfig(
        job_key="auto_alert_scan:tenant-1",
        hour=13,
        minute=0,
        timezone_name="UTC",
        handler=lambda: handler(),
        stale_after=timedelta(minutes=15),
        heartbeat_interval=timedelta(seconds=60),
    )
    docs = []
    manager = object.__new__(SchedulerManager)
    manager._collection = _FakeSchedulerCollection(docs)
    calls = []

    async def handler():
        calls.append("run")
        return {"status": "success", "mail_status": "sent"}

    result = asyncio.run(manager.run_due_daily_job(config, reason="startup_or_tenant_schedule_check"))

    assert result is True
    assert calls == ["run"]
    assert len(docs) == 1
    assert docs[0]["scheduled_for"] == datetime(2026, 7, 10, 13, 0, tzinfo=timezone.utc)
    assert docs[0]["status"] == SchedulerRunStatus.SUCCESS.value
