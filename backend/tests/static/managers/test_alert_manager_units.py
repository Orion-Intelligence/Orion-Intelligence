from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.services.mongo_manager.shared_model.db_alert_model import AlertModel, db_alert_model


class _FakeEngine:
    def __init__(self, doc=None):
        self.doc = doc
        self.saved = []

    async def find_one(self, *_):
        return self.doc

    async def save(self, doc):
        self.doc = doc
        self.saved.append(doc)


class _FakeSummaryHelper:
    def __init__(self):
        self.invalidated = []

    async def invalidate_alert_summary_cache(self, tenant_id):
        self.invalidated.append(tenant_id)

    async def get_alert_summary(self, tenant_id):
        return {"tenant_id": tenant_id}


def _manager(doc=None):
    mgr = object.__new__(AlertManager)
    mgr._engine = _FakeEngine(doc=doc)
    mgr._summary_helper = _FakeSummaryHelper()
    mgr._redis = None
    mgr._alert_summary_ttl_seconds = 300
    return mgr


def _user(tenant_uuid="t1"):
    return SimpleNamespace(tenant_uuid=tenant_uuid)


def test_upsert_alerts_bulk_updates_existing_and_creates_new():
    existing = db_alert_model(
        tenant_id="t1",
        alerts=[AlertModel(data_hash="h1", type="breach", ioc_value="a@example.com")],
    )
    mgr = _manager(existing)

    payload = [
        {"category": "breach", "ioc_type": "m_email", "ioc_value": "a@example.com", "data_hash": "h1"},
        {"category": "social", "ioc_type": "m_username", "ioc_value": "alice", "source": "x", "url": "https://e"},
    ]

    result = asyncio.run(mgr.upsert_alerts_bulk("t1", payload))
    assert result == {"created": 1, "updated": 1}
    assert len(mgr._engine.doc.alerts) == 2
    assert mgr._summary_helper.invalidated == ["t1"]


def test_get_all_alerts_pagination_compact_and_counts():
    now = datetime.now(timezone.utc)
    doc = db_alert_model(
        tenant_id="t1",
        alerts=[
            AlertModel(type="breach", ioc_type="m_email", ioc_value="x", data_hash="h1", report_seen=False, last_seen=now),
            AlertModel(
                type="social",
                ioc_type="m_username",
                ioc_value="alice",
                data_hash="h2",
                report_seen=True,
                last_seen=now - timedelta(days=1),
            ),
        ],
    )
    mgr = _manager(doc)

    out = asyncio.run(
        mgr.getAllAlerts(_user(), paginate=True, compact=True, unseen_only=True, include_counts=True, page=1, limit=10)
    )
    assert out["total"] == 1
    assert out["items"][0]["hash"] == "h1"
    assert out["counts_by_type"]["breach"] == 1


def test_get_all_alerts_raises_202_when_scan_running():
    doc = db_alert_model(tenant_id="t1", scan_running=True, alerts=[])
    mgr = _manager(doc)

    with pytest.raises(HTTPException) as ex:
        asyncio.run(mgr.getAllAlerts(_user(), paginate=False))
    assert ex.value.status_code == 202


def test_delete_alerts_by_type_deletes_and_invalidates_cache():
    doc = db_alert_model(
        tenant_id="t1",
        alerts=[AlertModel(type="breach", data_hash="h1"), AlertModel(type="social", data_hash="h2")],
    )
    mgr = _manager(doc)
    out = asyncio.run(mgr.delete_alerts_by_type(_user(), "breach"))

    assert "Deleted 1 alerts" in out["message"]
    assert len(mgr._engine.doc.alerts) == 1
    assert mgr._engine.doc.alerts[0].type == "social"
    assert mgr._summary_helper.invalidated == ["t1"]


def test_set_scan_running_creates_doc_and_cancels_when_requested():
    mgr = _manager(doc=None)
    calls = []

    async def _cancel(tenant_id):
        calls.append(tenant_id)

    class _FakeAlertJob:
        @staticmethod
        def get_instance():
            return SimpleNamespace(cancel_tenant_scan=_cancel)

    mgr.get_alert_job = lambda: _FakeAlertJob

    out = asyncio.run(mgr.set_scan_running("t1", True, cancle_scan=True))
    assert out == {"tenant_id": "t1", "scan_running": True}
    assert mgr._engine.doc.scan_running is True
    assert calls == ["t1"]


def test_update_alert_raises_when_no_alerts():
    mgr = _manager(doc=None)
    alert = AlertModel(data_hash="h1", type="breach", ioc_type="m_email", ioc_value="a@example.com")

    with pytest.raises(HTTPException) as ex:
        asyncio.run(mgr.update_alert(alert, _user()))
    assert ex.value.status_code == 404


def test_set_alert_seen_updates_matching_alert():
    doc = db_alert_model(tenant_id="t1", alerts=[AlertModel(data_hash="h1", report_seen=False)])
    mgr = _manager(doc)
    out = asyncio.run(mgr.set_alert_seen([AlertModel(data_hash="h1", report_seen=True)], _user()))
    assert out["updated"] == 1
    assert mgr._engine.doc.alerts[0].report_seen is True


def test_delete_alert_removes_matching_id():
    doc = db_alert_model(tenant_id="t1", alerts=[AlertModel(alert_id="a1"), AlertModel(alert_id="a2")])
    mgr = _manager(doc)
    out = asyncio.run(mgr.delete_alert("a1", _user()))
    assert out["id"] == "a1"
    assert len(mgr._engine.doc.alerts) == 1
    assert mgr._engine.doc.alerts[0].alert_id == "a2"


def test_delete_all_alerts_raises_when_empty():
    doc = db_alert_model(tenant_id="t1", alerts=[])
    mgr = _manager(doc)

    with pytest.raises(HTTPException) as ex:
        asyncio.run(mgr.delete_all_alerts(_user()))
    assert ex.value.status_code == 400


def test_get_all_alerts_returns_paginated_empty_with_counts():
    mgr = _manager(doc=None)
    out = asyncio.run(mgr.getAllAlerts(_user(), paginate=True, include_counts=True))
    assert out["items"] == []
    assert out["counts_by_type"] == {}


def test_filter_alerts_by_license_respects_allowed_types(monkeypatch):
    mgr = _manager()
    alerts = [AlertModel(type="breach"), AlertModel(type="social"), AlertModel(type="unknown")]
    user = SimpleNamespace(licenses=["free"])

    monkeypatch.setattr(AlertManager, "get_allowed_alert_types", staticmethod(lambda _u: {"breach", "social"}))
    from orion.api.interactive.alert_manager import alert_manager as alert_manager_module

    monkeypatch.setattr(alert_manager_module, "get_user_permissions", lambda _u: {"maintainer": False})

    out = mgr.filter_alerts_by_license(alerts, user)
    assert [a.type for a in out] == ["breach", "social"]


def test_upsert_alert_create_and_update_paths():
    mgr = _manager(db_alert_model(tenant_id="t1", alerts=[]))
    created = asyncio.run(
        mgr.upsert_alert(
            tenantId="t1",
            category="breach",
            ioc_type="m_email",
            ioc_value="a@example.com",
            title="Breach",
            url="https://x",
            description="desc",
            source="src",
            all_ioc=[],
            content_types=["news"],
        )
    )
    updated = asyncio.run(
        mgr.upsert_alert(
            tenantId="t1",
            category="breach",
            ioc_type="m_email",
            ioc_value="a@example.com",
            title="Breach",
            url="https://x",
            description="desc",
            source="src",
            all_ioc=[],
            content_types=["news"],
            data_hash=mgr._engine.doc.alerts[0].data_hash,
        )
    )
    assert created == "Created"
    assert updated == "Updated"


def test_add_custom_alert_create_then_update_and_scan_status_paths():
    mgr = _manager(db_alert_model(tenant_id="t1", alerts=[]))
    user = _user()
    alert = AlertModel(type="social", ioc_type="m_username", ioc_value="alice", title="t", description="d")

    created = asyncio.run(mgr.add_custom_alert(alert, user))
    updated = asyncio.run(mgr.add_custom_alert(alert, user))
    status = asyncio.run(mgr.get_scan_status(user))
    status2 = asyncio.run(mgr.get_scan_status_by_tenant_id("t1"))

    assert created["message"] == "Created"
    assert updated["message"] == "Updated"
    assert status == {"scan_running": False}
    assert status2 == {"scan_running": False}


def test_alert_deletion_and_seen_branches_raise_when_missing():
    mgr = _manager(db_alert_model(tenant_id="t1", alerts=[AlertModel(alert_id="a1", data_hash="h1", type="breach")]))
    user = _user()

    with pytest.raises(HTTPException):
        asyncio.run(mgr.delete_alert("missing", user))
    with pytest.raises(HTTPException):
        asyncio.run(mgr.set_alert_seen([AlertModel(data_hash="missing", report_seen=True)], user))
    with pytest.raises(HTTPException):
        asyncio.run(mgr.delete_alerts_by_type(user, "social"))


def test_notification_mapping_and_allowed_types(monkeypatch):
    mgr = _manager()
    assert mgr._to_notification_item(AlertModel(type="general", ioc_type="m_email", data_hash="h1"))["risk"] == "Low"
    assert mgr._to_notification_item(AlertModel(type="unknown", ioc_type="m_email", data_hash="h2"))["risk"] == "Unknown"


def test_get_all_alerts_filters_non_paginated_and_delete_all_success():
    now = datetime.now(timezone.utc)
    doc = db_alert_model(
        tenant_id="t1",
        alerts=[
            AlertModel(type="breach", ioc_type="m_email", ioc_value="a@example.com", data_hash="h1", report_seen=False, last_seen=now),
            AlertModel(type="social", ioc_type="m_username", ioc_value="alice", data_hash="h2", report_seen=True, last_seen=now),
        ],
    )
    mgr = _manager(doc)

    out = asyncio.run(mgr.getAllAlerts(_user(), paginate=False, alert_type="breach", unseen_only=True))
    deleted = asyncio.run(mgr.delete_all_alerts(_user()))

    assert len(out) == 1
    assert out[0].data_hash == "h1"
    assert deleted["message"] == "All alerts deleted successfully"
    assert mgr._engine.doc.alerts == []


def test_set_scan_running_updates_existing_doc_and_allowed_types_paths(monkeypatch):
    mgr = _manager(db_alert_model(tenant_id="t1", scan_running=False, alerts=[]))
    out = asyncio.run(mgr.set_scan_running("t1", True, cancle_scan=False))
    assert out == {"tenant_id": "t1", "scan_running": True}
    assert mgr._engine.doc.scan_running is True

    from orion.api.interactive.alert_manager import alert_manager as alert_manager_module

    monkeypatch.setattr(alert_manager_module, "get_user_permissions", lambda _u: {"modules": "all", "scanning": True, "maintainer": False})
    allowed = AlertManager.get_allowed_alert_types(SimpleNamespace())
    assert "social" in allowed or "breach" in allowed


def test_filter_alerts_by_license_returns_all_for_maintainer(monkeypatch):
    mgr = _manager()
    alerts = [AlertModel(type="breach"), AlertModel(type="social")]

    from orion.api.interactive.alert_manager import alert_manager as alert_manager_module

    monkeypatch.setattr(alert_manager_module, "get_user_permissions", lambda _u: {"maintainer": True, "modules": [], "scanning": False})
    out = mgr.filter_alerts_by_license(alerts, SimpleNamespace())
    assert out == alerts

    monkeypatch.setattr("orion.api.interactive.alert_manager.alert_manager.get_user_permissions", lambda _u: {"modules": "all", "scanning": True, "maintainer": False})
    allowed = AlertManager.get_allowed_alert_types(SimpleNamespace())
    assert "breach" in allowed
