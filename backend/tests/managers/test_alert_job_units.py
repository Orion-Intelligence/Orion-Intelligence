from __future__ import annotations

import asyncio
from types import SimpleNamespace

from orion.management.jobs.alert_job import alert_job


def _job():
    j = object.__new__(alert_job)
    j._cancel_scan_flags = {}
    return j


def test_get_additional_result_keys_filters_empty_and_excluded():
    j = _job()
    result = {
        "m_hash": "x",  # excluded
        "m_title": "title",  # excluded
        "m_email": "a@example.com",
        "m_tags": ["x"],
        "m_empty_list": [],
        "m_blank": "   ",
        "m_none": None,
    }
    out = j.get_additional_result_keys(result)
    assert ("m_email", "a@example.com") in out
    assert ("m_tags", ["x"]) in out
    assert all(k not in {"m_hash", "m_title", "m_empty_list", "m_blank", "m_none"} for k, _ in out)


def test_cancel_tenant_scan_sets_cancel_flag():
    j = _job()
    asyncio.run(j.cancel_tenant_scan("tenant-1"))
    assert j._cancel_scan_flags["tenant-1"] is True


def test_handle_dynamic_scanning_alert_upserts_each_result():
    j = _job()
    calls = []

    class _FakeAlertMgr:
        async def upsert_alert(self, **kwargs):
            calls.append(kwargs)

    j._alert_manager = _FakeAlertMgr()

    result_list = [
        {"m_title": "A", "m_content": "body", "m_url": "https://x", "m_network": "src", "m_content_type": ["news"]},
        {"m_title": "B", "m_content": "body2", "m_url": "https://y", "m_network": "src2", "m_content_type": ["leak"]},
    ]
    ok = asyncio.run(j._handle_dynamic_scanning_alert("t1", "m_email", "a@example.com", "email-breach", result_list))
    assert ok is True
    assert len(calls) == 2
    assert calls[0]["tenantId"] == "t1"
    assert calls[0]["category"] == "email-breach"


def test_handle_scanning_alert_pending_then_success_upserts():
    j = _job()
    calls = []

    class _FakeCrawl:
        def __init__(self):
            self.n = 0

        async def scan_domain(self, _payload):
            self.n += 1
            if self.n == 1:
                return {"status": "pending"}
            return {
                "status": "done",
                "result": {
                    "grade": "A",
                    "grade_counts": {"high": 1, "medium": 2, "low": 3},
                    "threats": {"xss": 1, "tls": 2},
                },
            }

    class _FakeAlertMgr:
        async def upsert_alert(self, **kwargs):
            calls.append(kwargs)

    j._crawl_model = _FakeCrawl()
    j._alert_manager = _FakeAlertMgr()
    j._cancel_scan_flags = {"t1": False}

    ok = asyncio.run(j._handle_scanning_alert("t1", "example.com", "m_domain", "seo"))
    assert ok is True
    assert len(calls) == 1
    assert calls[0]["category"] == "seo scanning"


def test_run_all_categories_skips_default_and_running_tenants():
    j = _job()
    processed = []
    scan_set_calls = []

    tenants = [
        SimpleNamespace(id="t-default", is_default=True, iocs=[]),
        SimpleNamespace(id="t-running", is_default=False, iocs=[]),
        SimpleNamespace(id="t-run", is_default=False, iocs=[]),
    ]

    class _FakeTenantMgr:
        async def get_all_tenant(self):
            return tenants

    class _FakeAlertInstance:
        async def get_scan_status_by_tenant_id(self, tenant_id):
            return {"scan_running": tenant_id == "t-running"}

        async def set_scan_running(self, tenant_id, value):
            scan_set_calls.append((tenant_id, value))

    class _FakeAlertManagerRef:
        @staticmethod
        def getInstance():
            return _FakeAlertInstance()

    async def _process(tenant, category):
        processed.append((tenant.id, category))

    j._tenant_manager = _FakeTenantMgr()
    j._alert_manager = _FakeAlertManagerRef()
    j._process_tenant_alerts = _process
    j._cancel_scan_flags = {}

    asyncio.run(j.run_all_categories())
    assert all(tid == "t-run" for tid, _ in processed)
    assert ("t-run", True) in scan_set_calls
    assert ("t-run", False) in scan_set_calls
