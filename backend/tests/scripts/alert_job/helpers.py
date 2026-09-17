from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace

import orion.api.interactive.scheduler_manager.scheduler_manager as scheduler_module
from orion.management.jobs.alert.alert_job import alert_job
from tests.scripts.alert_job.fakes import _FakeAlertBuffer


def _freeze_scheduler_now(monkeypatch, now):
    class FakeDateTime(datetime):
        @classmethod
        def now(cls, tz=None):
            return now

    monkeypatch.setattr(scheduler_module, "datetime", FakeDateTime)


def make_alert_job(alert_manager, tenants):
    async def get_all_tenant():
        return tenants

    job = object.__new__(alert_job)
    job._tenant_manager = SimpleNamespace(get_all_tenant=get_all_tenant)
    job._alert_manager = alert_manager
    job._alert_buffer = _FakeAlertBuffer()
    job._cancellation_service = SimpleNamespace(clear=lambda tenant_id: None, ensure_tenant=lambda tenant_id: str(tenant_id),is_cancelled=lambda tenant_id: False)
    return job
