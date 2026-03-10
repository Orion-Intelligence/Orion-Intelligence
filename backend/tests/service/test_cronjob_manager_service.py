from __future__ import annotations

import asyncio
import pytest

from contextlib import contextmanager
from types import SimpleNamespace
import orion.management.managers.cronjob_manager as cronjob_module
from orion.constants import constant
from orion.management.jobs.alert_job import alert_job
from orion.management.jobs.insight_job import insight_job
from orion.management.managers.cronjob_manager import cronjob_manager
from orion.services.elastic_manager.elastic_controller import elastic_controller


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


class _StopLoop(Exception):
    pass


class _StopProcess(BaseException):
    pass


def test_cronjob_manager_get_instance_builds_assets_and_is_singleton():
    original_instance = cronjob_manager._cronjob_manager__instance
    cronjob_manager._cronjob_manager__instance = None
    allowed_keys_snapshot = set(constant.allowed_keys)
    original_mail_template = constant.mail_template
    original_license_rules = constant.license_rules

    try:
        instance = cronjob_manager.get_instance()

        assert instance is cronjob_manager.get_instance()
        assert constant.allowed_keys
        assert "m_email" in constant.allowed_keys
        assert constant.mail_template is not None
        assert isinstance(constant.license_rules, dict)
    finally:
        cronjob_manager._cronjob_manager__instance = original_instance
        constant.allowed_keys.clear()
        constant.allowed_keys.update(allowed_keys_snapshot)
        constant.mail_template = original_mail_template
        constant.license_rules = original_license_rules


def test_cronjob_manager_purge_loop_triggers_elastic_purge_once():
    async def _purge_old_records():
        raise _StopLoop()

    fake_elastic = SimpleNamespace(purge_old_records=_purge_old_records)

    with _swap_attrs((elastic_controller, "_elastic_controller__instance", fake_elastic)):
        with pytest.raises(_StopLoop):
            asyncio.run(cronjob_manager.purge_loop())


def test_cronjob_manager_init_jobs_schedules_background_tasks():
    scheduled = []

    def _capture_task(coro):
        scheduled.append(coro)
        return coro

    async def _update_insights():
        return None

    fake_insight = SimpleNamespace(update_insights=_update_insights)
    manager = object.__new__(cronjob_manager)

    with _swap_attrs(
        (asyncio, "create_task", _capture_task),
        (insight_job, "_insight_job__instance", fake_insight),
    ):
        asyncio.run(manager.init_jobs())

    try:
        assert len(scheduled) == 3
        coroutine_names = {coro.cr_code.co_name for coro in scheduled}
        assert "purge_loop" in coroutine_names
        assert "iocs_alert_loop" in coroutine_names
        assert "_update_insights" in coroutine_names
    finally:
        for coro in scheduled:
            coro.close()


def test_cronjob_manager_iocs_alert_loop_waits_when_no_allowed_keys():
    allowed_keys_snapshot = set(constant.allowed_keys)
    constant.allowed_keys.clear()

    try:
        with pytest.raises(asyncio.TimeoutError):
            asyncio.run(asyncio.wait_for(cronjob_manager.iocs_alert_loop(), timeout=0.01))
    finally:
        constant.allowed_keys.clear()
        constant.allowed_keys.update(allowed_keys_snapshot)


def test_cronjob_manager_iocs_alert_loop_triggers_alert_job_when_schedule_is_due():
    allowed_keys_snapshot = set(constant.allowed_keys)
    constant.allowed_keys.clear()
    constant.allowed_keys.add("m_email")

    class _FakeDateTime:
        @staticmethod
        def now(_tz):
            from datetime import datetime

            return datetime(2026, 3, 10, 1, 59, 59, tzinfo=_tz)

        min = cronjob_module.datetime.min
        combine = staticmethod(cronjob_module.datetime.combine)

    sleep_calls = []
    alert_calls = []

    async def _sleep(_seconds):
        sleep_calls.append(_seconds)
        if len(sleep_calls) > 1:
            raise _StopProcess()
        return None

    async def _run_all_categories():
        alert_calls.append("ran")
        return None

    fake_alert = SimpleNamespace(run_all_categories=_run_all_categories)
    try:
        with _swap_attrs(
            (cronjob_module.asyncio, "sleep", _sleep),
            (alert_job, "_alert_job__instance", fake_alert),
            (cronjob_module, "datetime", _FakeDateTime),
        ):
            with pytest.raises(_StopProcess):
                asyncio.run(cronjob_manager.iocs_alert_loop())
    finally:
        constant.allowed_keys.clear()
        constant.allowed_keys.update(allowed_keys_snapshot)

    assert alert_calls == ["ran"]
