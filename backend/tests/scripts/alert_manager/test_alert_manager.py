from __future__ import annotations

from types import SimpleNamespace

import pytest
from bson import ObjectId
from cryptography.fernet import Fernet
from fastapi import HTTPException

import orion.api.interactive.alert_manager.alert_manager as am
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.services.mongo_manager.shared_model.db_alert_model import (
    AlertModel,
    alert_all_ioc,
    alert_status,
    db_alert_model,
)
from tests.model.fakes import FakeMongoEngine, FakeRedis
from tests.scripts.alert_manager.fakes import (
    FakeAlertJob,
    FakeMailManager,
    FakeMailTemplate,
    FakeWebhookManager,
)
from tests.scripts.alert_manager.helpers import (
    _make_manager,
    _run,
    _set_env,
    _use_key_manager,
    _use_mail_stack,
    _user,
)


def _alert(**kwargs):
    return AlertModel(**kwargs)


async def _passthrough(alerts, user):
    return alerts


def test_get_instance_creates_and_reuses_singleton(monkeypatch):
    import orion.services.mongo_manager.mongo_controller as mongo_mod

    fake_engine = FakeMongoEngine()
    monkeypatch.setattr(
        mongo_mod.mongo_controller,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(get_engine=lambda: fake_engine)),
    )
    monkeypatch.setattr(am.redis_controller, "getInstance", staticmethod(lambda: FakeRedis()))
    AlertManager._AlertManager__instance = None
    try:
        instance = AlertManager.getInstance()
        assert instance is AlertManager.getInstance()
        assert instance._engine is fake_engine
        with pytest.raises(Exception):
            AlertManager()
    finally:
        AlertManager._AlertManager__instance = None


def test_get_alert_job_returns_alert_job():
    manager = _make_manager()
    assert manager.get_alert_job() is not None


def test_smart_hash_is_stable_for_same_manager():
    manager = _make_manager()
    first = manager._smart_hash("a", None, "b")
    second = manager._smart_hash("a", "b")
    assert isinstance(first, str) and len(first) == 64
    assert first == second


def test_display_alert_label_variants():
    assert AlertManager._display_alert_label("seo scanning") == "SEO scanning"
    assert AlertManager._display_alert_label("exploit") == "Exploits"
    assert AlertManager._display_alert_label("stealerlogs") == "Stealer logs"
    assert AlertManager._display_alert_label("email-breach") == "Email breach"
    assert AlertManager._display_alert_label("social-scanner") == "Social scanner"
    assert AlertManager._display_alert_label("") == "Uncategorized"
    assert AlertManager._display_alert_label("dark-web_leak") == "Dark Web Leak"


def test_alert_action_url_and_admin_url(monkeypatch):
    _set_env(monkeypatch, {"APP_URL": "https://app.test/"})
    assert AlertManager._alert_action_url() == "https://app.test/dashboard/profile/alerts"
    assert AlertManager._alert_action_url("Breach") == "https://app.test/dashboard/profile/alerts/breach"
    assert AlertManager._admin_alert_action_url() == "https://app.test/dashboard/profile/case-management?mode=alerts"


def test_action_urls_empty_when_no_app_url(monkeypatch):
    _set_env(monkeypatch, {})
    assert AlertManager._alert_action_url("breach") == ""
    assert AlertManager._admin_alert_action_url() == ""


def test_get_alert_mail_recipient_paths():
    manager = _make_manager()
    user = _user(email="a@b.com", username="alice")
    assert _run(manager._get_alert_mail_recipient("tenant", user)) == ("a@b.com", "alice")

    maintainer = SimpleNamespace(email="m@b.com", username="maint")
    manager2 = _make_manager(FakeMongoEngine(find_one_results=[maintainer]))
    assert _run(manager2._get_alert_mail_recipient("tenant-1")) == ("m@b.com", "maint")

    manager3 = _make_manager(FakeMongoEngine(find_one_results=[None]))
    assert _run(manager3._get_alert_mail_recipient("")) == ("", "")


def test_alert_ioc_rows_dedup_and_limit():
    alert = _alert(
        ioc_type="ip",
        ioc_value="1.1.1.1",
        all_ioc=[alert_all_ioc(name="ip", values=["1.1.1.1", "2.2.2.2"]), alert_all_ioc(name="domain", values=["x.com"])],
    )
    rows = AlertManager._alert_ioc_rows(alert)
    values = [row["value"] for row in rows]
    assert {"1.1.1.1", "2.2.2.2", "x.com"} <= set(values)
    assert values.count("1.1.1.1") == 1


def test_send_alert_mail_template_none_returns_false():
    manager = _make_manager()
    result = _run(manager._send_alert_mail(
        tenant_id="t", subject="s", email_title="e", preheader="p", friendly_message="f",
        scan_status="ok", total_alerts=1, module_rows=[], ioc_rows=[], current_user=_user()))
    assert result is False


def test_send_alert_mail_no_recipient_returns_false(monkeypatch):
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    _use_mail_stack(monkeypatch, template=FakeMailTemplate())
    result = _run(manager._send_alert_mail(
        tenant_id="", subject="s", email_title="e", preheader="p", friendly_message="f",
        scan_status="ok", total_alerts=1, module_rows=[], ioc_rows=[]))
    assert result is False


def test_send_alert_mail_success(monkeypatch):
    manager = _make_manager()
    mail = FakeMailManager()
    webhook = FakeWebhookManager()
    _use_mail_stack(monkeypatch, template=FakeMailTemplate(), mail=mail, webhook=webhook)
    result = _run(manager._send_alert_mail(
        tenant_id="tenant-1", subject="s", email_title="e", preheader="p", friendly_message="f",
        scan_status="ok", total_alerts=2, module_rows=[{"label": "x", "count": 2}],
        ioc_rows=[{"type": "ip", "value": "1.1.1.1"}], current_user=_user(email="a@b.com")))
    assert result is True
    assert mail.sent[0]["to"] == "a@b.com"
    assert webhook.sent[0]["tenant_id"] == "tenant-1"


def test_send_alert_mail_exception_returns_false(monkeypatch):
    manager = _make_manager()
    _use_mail_stack(monkeypatch, template=FakeMailTemplate(raises=True), mail=FakeMailManager(), webhook=FakeWebhookManager())
    result = _run(manager._send_alert_mail(
        tenant_id="tenant-1", subject="s", email_title="e", preheader="p", friendly_message="f",
        scan_status="ok", total_alerts=1, module_rows=[], ioc_rows=[], current_user=_user()))
    assert result is False


def test_send_admin_scan_summary_empty_returns_true():
    manager = _make_manager()
    assert _run(manager.send_admin_scan_summary_mail([])) is True
    assert _run(manager.send_admin_scan_summary_mail(None)) is True


def test_send_admin_scan_summary_template_none_returns_false():
    manager = _make_manager()
    assert _run(manager.send_admin_scan_summary_mail([{"tenant_id": "t", "alert_count": 1}])) is False


def test_send_admin_scan_summary_success_with_admin(monkeypatch):
    admin = SimpleNamespace(email="admin@x.com")
    manager = _make_manager(FakeMongoEngine(find_one_results=[admin]))
    mail = FakeMailManager()
    _set_env(monkeypatch, {"APP_URL": "https://app.test"})
    _use_mail_stack(monkeypatch, template=FakeMailTemplate(), mail=mail)
    tenants = [{"tenant_id": "t1", "tenant_name": "Tenant One", "alert_count": 3},
               {"tenant_id": "t2", "tenant_name": "Tenant Two", "alert_count": 2}]
    assert _run(manager.send_admin_scan_summary_mail(tenants)) is True
    assert mail.sent[0]["to"] == "admin@x.com"


def test_send_admin_scan_summary_falls_back_to_global_config(monkeypatch):
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    mail = FakeMailManager(global_config={"ACCOUNTS_MAIL": "accounts@x.com"})
    _set_env(monkeypatch, {"APP_URL": "https://app.test"})
    _use_mail_stack(monkeypatch, template=FakeMailTemplate(), mail=mail)
    assert _run(manager.send_admin_scan_summary_mail([{"tenant_id": "t1", "alert_count": 1}])) is True
    assert mail.sent[0]["to"] == "accounts@x.com"


def test_send_admin_scan_summary_no_recipient_returns_false(monkeypatch):
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    mail = FakeMailManager(global_config={})
    _use_mail_stack(monkeypatch, template=FakeMailTemplate(), mail=mail)
    assert _run(manager.send_admin_scan_summary_mail([{"tenant_id": "t1", "alert_count": 1}])) is False


def test_send_scan_completed_mail_zero_total_returns_true():
    manager = _make_manager()
    assert _run(manager.send_scan_completed_mail("t", "completed", {"total": 0})) is True


def test_send_scan_completed_mail_builds_rows(monkeypatch):
    manager = _make_manager()
    _set_env(monkeypatch, {"APP_URL": "https://app.test"})
    _use_mail_stack(monkeypatch, template=FakeMailTemplate(), mail=FakeMailManager(), webhook=FakeWebhookManager())
    summary = {
        "total": 3,
        "counts_by_category": {"breach": 2, "exploit": 1},
        "ioc_values": [{"type": "ip", "value": "1.1.1.1"}, "not-a-dict"],
    }
    assert _run(manager.send_scan_completed_mail("tenant-1", "completed", summary, current_user=_user())) is True


def test_send_alert_change_mail_created_and_updated(monkeypatch):
    manager = _make_manager()
    _set_env(monkeypatch, {"APP_URL": "https://app.test"})
    _use_mail_stack(monkeypatch, template=FakeMailTemplate(), mail=FakeMailManager(), webhook=FakeWebhookManager())
    alert = _alert(type="breach", ioc_type="ip", ioc_value="1.1.1.1")
    _run(manager.send_alert_change_mail("created", alert, _user()))
    _run(manager.send_alert_change_mail("updated", alert, _user()))


def test_upsert_alerts_bulk_empty_payload():
    manager = _make_manager()
    assert _run(manager.upsert_alerts_bulk("tenant-1", [])) == {"created": 0, "updated": 0}


def test_upsert_alerts_bulk_creates_and_updates():
    existing_alert = _alert(data_hash="h1", type="breach", ioc_value="1.1.1.1", risk="low")
    existing_doc = db_alert_model(tenant_id="tenant-1", alerts=[existing_alert])
    manager = _make_manager(FakeMongoEngine(records=[existing_doc]))
    payload = [
        {"data_hash": "h1", "category": "breach", "ioc_value": "1.1.1.1", "risk": "high", "raw_findings": {"x": 1}},
        {"category": "exploit", "ioc_type": "cve", "ioc_value": "CVE-1", "source": "s", "url": "u", "title": "t"},
    ]
    result = _run(manager.upsert_alerts_bulk("tenant-1", payload, chunk_size=1))
    assert result == {"created": 1, "updated": 1}
    assert existing_alert.risk == "high"


def test_upsert_alerts_bulk_no_existing_doc():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    payload = [{"category": "breach", "ioc_type": "ip", "ioc_value": "1.1.1.1"}]
    result = _run(manager.upsert_alerts_bulk("tenant-1", payload))
    assert result == {"created": 1, "updated": 0}


def test_add_custom_alert_updates_matching(monkeypatch):
    manager = _make_manager()
    _use_mail_stack(monkeypatch, template=None)
    data = _alert(type="breach", ioc_type="ip", ioc_value="1.1.1.1", source="s", url="u")
    expected_hash = manager._smart_hash("breach", "ip", "1.1.1.1", "s", "u")
    stored = _alert(data_hash=expected_hash, type="breach", ioc_type="ip", ioc_value="1.1.1.1")
    doc = db_alert_model(tenant_id="507f1f77bcf86cd799439011", alerts=[stored])
    manager._engine = FakeMongoEngine(records=[doc])
    result = _run(manager.add_custom_alert(data, _user()))
    assert result == {"message": "Updated"}


def test_add_custom_alert_appends_to_existing_doc():
    doc = db_alert_model(tenant_id="507f1f77bcf86cd799439011", alerts=[_alert(data_hash="other", type="x")])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    data = _alert(type="breach", ioc_type="ip", ioc_value="9.9.9.9", source="s", url="u")
    result = _run(manager.add_custom_alert(data, _user()))
    assert result == {"message": "Created"}
    assert len(doc.alerts) == 2


def test_add_custom_alert_creates_new_doc():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    data = _alert(type="breach")
    result = _run(manager.add_custom_alert(data, _user()))
    assert result == {"message": "Created"}


def test_update_alert_success_and_errors():
    manager_missing = _make_manager(FakeMongoEngine(find_one_results=[None]))
    with pytest.raises(HTTPException) as exc:
        _run(manager_missing.update_alert(_alert(data_hash="h"), _user()))
    assert exc.value.status_code == 404

    stored = _alert(data_hash="h1", type="old")
    doc = db_alert_model(tenant_id="507f1f77bcf86cd799439011", alerts=[stored])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    result = _run(manager.update_alert(_alert(data_hash="h1", type="new", ioc_type="ip", ioc_value="1.1.1.1"), _user()))
    assert result["updated_hash"] == "h1"
    assert stored.type == "new"

    manager_nomatch = _make_manager(FakeMongoEngine(records=[db_alert_model(tenant_id="t", alerts=[_alert(data_hash="zzz")])]))
    with pytest.raises(HTTPException) as exc2:
        _run(manager_nomatch.update_alert(_alert(data_hash="nope"), _user()))
    assert exc2.value.status_code == 404


def test_set_alert_seen_paths():
    manager_missing = _make_manager(FakeMongoEngine(find_one_results=[None]))
    with pytest.raises(HTTPException) as exc:
        _run(manager_missing.set_alert_seen([_alert(data_hash="h")], _user()))
    assert exc.value.status_code == 404

    stored = _alert(data_hash="h1", report_seen=False)
    doc = db_alert_model(tenant_id="t", alerts=[stored])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    result = _run(manager.set_alert_seen([_alert(data_hash="h1", report_seen=True)], _user()))
    assert result["updated"] == 1
    assert stored.report_seen is True

    manager_nomatch = _make_manager(FakeMongoEngine(records=[db_alert_model(tenant_id="t", alerts=[_alert(data_hash="zzz")])]))
    with pytest.raises(HTTPException) as exc2:
        _run(manager_nomatch.set_alert_seen([_alert(data_hash="nope")], _user()))
    assert exc2.value.status_code == 404


def test_delete_alert_paths():
    manager_missing = _make_manager(FakeMongoEngine(find_one_results=[None]))
    with pytest.raises(HTTPException) as exc:
        _run(manager_missing.delete_alert("a1", _user()))
    assert exc.value.status_code == 404

    stored = _alert(alert_id="a1")
    doc = db_alert_model(tenant_id="t", alerts=[stored])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    result = _run(manager.delete_alert("a1", _user()))
    assert result["id"] == "a1"
    assert stored.is_deleted is True

    manager_nf = _make_manager(FakeMongoEngine(records=[db_alert_model(tenant_id="t", alerts=[_alert(alert_id="other")])]))
    with pytest.raises(HTTPException) as exc2:
        _run(manager_nf.delete_alert("missing", _user()))
    assert exc2.value.status_code == 404


def test_to_notification_item():
    manager = _make_manager()
    alert = _alert(type="breach", ioc_type="ip", ioc_value="1.1.1.1", data_hash="h", content_types=["cred"], report_seen=True, risk="high")
    item = manager._to_notification_item(alert)
    assert item["categoryName"] == "breach"
    assert item["risk"] == "High"
    assert item["iocNames"] == ["ip"]
    assert item["subCategory"] == "cred"
    assert item["reportSeen"] is True


def test_filter_option_values():
    alerts = [
        _alert(content_types=["Credentials", "credentials", "-"]),
        _alert(content_types=["Session", "n/a", "PII"]),
    ]
    assert AlertManager.filter_option_values(alerts, "wrong_field") == []
    values = AlertManager.filter_option_values(alerts, "content_type")
    assert "Credentials" in values and "Session" in values and "PII" in values
    assert values == sorted(values, key=str.lower)
    filtered = AlertManager.filter_option_values(alerts, "content_type", query="sess")
    assert filtered == ["Session"]
    assert AlertManager.filter_option_values(alerts, "content_type", limit=0)
    assert AlertManager.filter_option_values(alerts, "content_type", limit="bad")


def test_get_alert_filter_options(monkeypatch):
    doc = db_alert_model(tenant_id="t", alerts=[_alert(type="breach", content_types=["cred"]), _alert(type="exploit", content_types=["other"])])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    manager.filter_alerts_by_license = _passthrough
    result = _run(manager.get_alert_filter_options(_user(), "content_type", alert_type="breach"))
    assert result == {"values": ["cred"]}


def test_get_all_alerts_scan_running_raises():
    doc = db_alert_model(tenant_id="t", scan_running=True, alerts=[])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    with pytest.raises(HTTPException) as exc:
        _run(manager.getAllAlerts(_user()))
    assert exc.value.status_code == 202


def test_get_all_alerts_no_data_paginate_and_plain():
    manager = _make_manager(FakeMongoEngine(records=[]))
    response = _run(manager.getAllAlerts(_user(), paginate=True, include_counts=True))
    assert response["items"] == [] and response["total"] == 0 and response["counts_by_type"] == {}

    manager2 = _make_manager(FakeMongoEngine(records=[]))
    assert _run(manager2.getAllAlerts(_user())) == []


def test_get_all_alerts_plain_list_with_filters():
    doc = db_alert_model(tenant_id="t", scan_running=False, alerts=[
        _alert(type="breach", report_seen=False, data_hash="a"),
        _alert(type="exploit", report_seen=True, data_hash="b"),
    ])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    manager.filter_alerts_by_license = _passthrough
    result = _run(manager.getAllAlerts(_user(), alert_type="breach", unseen_only=True))
    assert len(result) == 1 and result[0].type == "breach"


def test_get_all_alerts_paginated_compact_with_counts():
    doc = db_alert_model(tenant_id="t", scan_running=False, alerts=[
        _alert(type="breach", data_hash="a"),
        _alert(type="breach", data_hash="b"),
        _alert(type="exploit", data_hash="c"),
    ])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    response = _run(manager.getAllAlerts(_user(), page=1, limit=2, paginate=True, compact=True, include_counts=True))
    assert response["total"] == 3
    assert response["has_more"] is True
    assert response["counts_by_type"]["breach"] == 2
    assert isinstance(response["items"][0], dict)


def test_delete_all_alerts_paths():
    manager_missing = _make_manager(FakeMongoEngine(find_one_results=[None]))
    with pytest.raises(HTTPException) as exc:
        _run(manager_missing.delete_all_alerts(_user()))
    assert exc.value.status_code == 400

    empty_doc = db_alert_model(tenant_id="t", alerts=[_alert(is_deleted=True)])
    manager_empty = _make_manager(FakeMongoEngine(records=[empty_doc]))
    with pytest.raises(HTTPException) as exc2:
        _run(manager_empty.delete_all_alerts(_user()))
    assert exc2.value.status_code == 400

    doc = db_alert_model(tenant_id="t", alerts=[_alert(alert_id="a"), _alert(alert_id="b")])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    result = _run(manager.delete_all_alerts(_user()))
    assert result == {"message": "All alerts deleted successfully"}
    assert all(a.is_deleted for a in doc.alerts)


def test_delete_alerts_by_type_paths():
    manager_missing = _make_manager(FakeMongoEngine(find_one_results=[None]))
    with pytest.raises(HTTPException) as exc:
        _run(manager_missing.delete_alerts_by_type(_user(), "breach"))
    assert exc.value.status_code == 400

    doc = db_alert_model(tenant_id="t", alerts=[_alert(type="breach"), _alert(type="exploit")])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    result = _run(manager.delete_alerts_by_type(_user(), "breach"))
    assert "Deleted 1 alerts" in result["message"]

    doc2 = db_alert_model(tenant_id="t", alerts=[_alert(type="exploit")])
    manager2 = _make_manager(FakeMongoEngine(records=[doc2]))
    with pytest.raises(HTTPException) as exc2:
        _run(manager2.delete_alerts_by_type(_user(), "breach"))
    assert exc2.value.status_code == 404


def test_set_scan_running_existing_new_and_cancel(monkeypatch):
    doc = db_alert_model(tenant_id="t", scan_running=False, alerts=[])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    result = _run(manager.set_scan_running("t", True))
    assert result == {"tenant_id": "t", "scan_running": True}
    assert doc.scan_running is True

    manager_new = _make_manager(FakeMongoEngine(find_one_results=[None]))
    result_new = _run(manager_new.set_scan_running("t2", False))
    assert result_new["scan_running"] is False

    fake_job = FakeAlertJob()
    manager_cancel = _make_manager(FakeMongoEngine(records=[db_alert_model(tenant_id="t3", alerts=[])]))
    monkeypatch.setattr(manager_cancel, "get_alert_job", lambda: fake_job)
    _run(manager_cancel.set_scan_running("t3", False, cancle_scan=True))
    assert fake_job.cancelled == ["t3"]


def test_get_scan_status_variants():
    doc = db_alert_model(tenant_id="t", scan_running=True, alerts=[])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    assert _run(manager.get_scan_status(_user())) == {"scan_running": True}
    assert _run(manager.get_scan_status_by_tenant_id("t")) == {"scan_running": True}

    manager_none = _make_manager(FakeMongoEngine(find_one_results=[None, None]))
    assert _run(manager_none.get_scan_status(_user())) == {"scan_running": False}
    assert _run(manager_none.get_scan_status_by_tenant_id("t")) == {"scan_running": False}


def test_get_alert_summary_delegates():
    doc = db_alert_model(tenant_id="t", alerts=[_alert(type="breach", risk="critical")])
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    summary = _run(manager.get_alert_summary("t"))
    assert summary["counts_by_type"]["breach"] == 1


def test_get_alert_permissions(monkeypatch):
    monkeypatch.setattr(am.constant, "license_rules", {
        "lic-all": {"modules": "all", "scanning": True},
        "lic-mod": {"modules": ["breach"], "scanning": False},
    })
    all_perms = AlertManager.get_alert_permissions({"lic-all"})
    assert all_perms["modules"] == "all" and all_perms["scanning"] is True
    mod_perms = AlertManager.get_alert_permissions({"lic-mod"})
    assert "breach" in mod_perms["modules"] and mod_perms["scanning"] is False


def test_get_allowed_alert_types(monkeypatch):
    monkeypatch.setattr(am.constant, "license_rules", {
        "lic-all": {"modules": "all", "scanning": True},
        "lic-mod": {"modules": ["breach"], "scanning": False},
    })
    allowed_all = AlertManager.get_allowed_alert_types(_user(), {"lic-all"})
    assert "breach" in allowed_all and "seo scanning" in allowed_all
    allowed_mod = AlertManager.get_allowed_alert_types(_user(), {"lic-mod"})
    assert allowed_mod == {"breach"}

    monkeypatch.setattr(am, "get_user_permissions", lambda user: {"modules": "all", "scanning": False})
    allowed_default = AlertManager.get_allowed_alert_types(_user(), None)
    assert "breach" in allowed_default


def test_get_alert_access_licenses_no_tenant():
    manager = _make_manager(FakeMongoEngine(records=[]))
    licenses = _run(manager.get_alert_access_licenses(_user(licenses=["a", "b"])))
    assert licenses == {"a", "b"}


def test_get_alert_access_licenses_with_tenant_decrypt(monkeypatch):
    dek = Fernet.generate_key()
    token = Fernet(dek).encrypt(b"premium").decode()
    tenant = SimpleNamespace(id=ObjectId("507f1f77bcf86cd799439011"), licenses=[token, "bad-token"])
    manager = _make_manager(FakeMongoEngine(find_one_results=[tenant]))
    _use_key_manager(monkeypatch, dek)
    licenses = _run(manager.get_alert_access_licenses(_user(licenses=["base"])))
    assert "premium" in licenses and "bad-token" in licenses and "base" in licenses


def test_get_alert_access_licenses_invalid_tenant_raises():
    manager = _make_manager()
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_alert_access_licenses(_user(tenant_id="not-valid", licenses=[])))
    assert exc.value.status_code == 500


def test_filter_alerts_by_license(monkeypatch):
    monkeypatch.setattr(am.constant, "license_rules", {"lic-mod": {"modules": ["breach"], "scanning": False}})
    manager = _make_manager(FakeMongoEngine(records=[]))
    user = _user(licenses=["lic-mod"])
    alerts = [
        _alert(type="breach"),
        _alert(type="unknown", licenses=["lic-mod"]),
        _alert(type="malware"),
    ]
    filtered = _run(manager.filter_alerts_by_license(alerts, user))
    types = [a.type for a in filtered]
    assert "breach" in types and "unknown" in types and "malware" not in types


def test_alert_status_enum_used_in_upsert():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    payload = [{"category": "breach", "ioc_value": "x"}]
    _run(manager.upsert_alerts_bulk("t", payload))
    saved = manager._engine.saved[-1]
    assert saved.alerts[0].status == alert_status.ACTIVE
