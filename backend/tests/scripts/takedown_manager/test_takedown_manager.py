from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError

from orion.api.interactive.takedown_manager.takedown_manager import TakedownManager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.services.mongo_manager.shared_model.db_takedown_request_model import (
    TakedownCreateRequest,
    TakedownDecisionRequest,
    TakedownRequestStatus,
    db_takedown_request_model,
)
from tests.model.fakes import FakeMongoEngine
from tests.scripts.takedown_manager.fakes import (
    FakeElasticConnection,
    FakeHttpResponse,
    FakeMailManager,
    FakeTakedownCollection,
)
from tests.scripts.takedown_manager.helpers import (
    _make_manager,
    _run,
    _set_env,
    _use_elastic,
    _use_http_client,
    _use_mail,
    _user,
)

ROOT_ID = "507f1f77bcf86cd799439011"


def _tenant(is_default=True, tenant_id=ROOT_ID):
    return SimpleNamespace(id=ObjectId(tenant_id), is_default=is_default)


def _record(**kwargs):
    defaults = dict(target_domain="evil.test", abuse_email="abuse@evil.test", status=TakedownRequestStatus.PENDING)
    defaults.update(kwargs)
    return db_takedown_request_model(**defaults)


def test_get_instance_uses_singleton(monkeypatch):
    import orion.services.mongo_manager.mongo_controller as mongo_mod

    fake_engine = FakeMongoEngine()
    engine_wrapper = SimpleNamespace(
        get_engine=lambda: SimpleNamespace(get_collection=lambda model: "collection"),
    )
    monkeypatch.setattr(mongo_mod.mongo_controller, "get_instance", staticmethod(lambda: engine_wrapper))
    TakedownManager._TakedownManager__instance = None
    try:
        instance = TakedownManager.get_instance()
        assert instance is TakedownManager.get_instance()
        assert instance._collection == "collection"
    finally:
        TakedownManager._TakedownManager__instance = None


def test_root_tenant_uuid_found_and_missing():
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant()]))
    assert _run(manager._root_tenant_uuid()) == ROOT_ID

    manager_missing = _make_manager(FakeMongoEngine(find_one_results=[None]))
    with pytest.raises(HTTPException) as exc:
        _run(manager_missing._root_tenant_uuid())
    assert exc.value.status_code == 500


def test_target_domain_variants():
    assert TakedownManager._target_domain("https://Sub.Evil.test/path?x=1") == "sub.evil.test"
    assert TakedownManager._target_domain("evil.test:8080/abc") == "evil.test"
    assert TakedownManager._target_domain("plainhost") == "plainhost"


def test_normalize_target_url():
    assert TakedownManager._normalize_target_url("evil.test") == "https://evil.test"
    assert TakedownManager._normalize_target_url(" http://evil.test ") == "http://evil.test"


def test_parse_date_filter():
    assert TakedownManager._parse_date_filter("") is None
    assert TakedownManager._parse_date_filter("not-a-date") is None
    z_parsed = TakedownManager._parse_date_filter("2026-01-01T00:00:00Z")
    assert z_parsed.tzinfo is not None
    start = TakedownManager._parse_date_filter("2026-01-01")
    end = TakedownManager._parse_date_filter("2026-01-01", end_of_day=True)
    assert start.hour == 0 and end.hour == 23
    assert start.tzinfo == timezone.utc


def test_public_status_and_labels():
    assert TakedownManager._public_status(TakedownRequestStatus.PENDING) == "in_progress"
    assert TakedownManager._public_status("denied") == "denied"
    assert TakedownManager._public_status("accepted") == "accepted"
    assert TakedownManager._public_status("failed") == "failed"
    assert TakedownManager._public_status(None) is None
    assert TakedownManager._status_label(TakedownRequestStatus.ACCEPTED) == "Takedown reported"
    assert TakedownManager._status_label("unknown") == ""


def test_serialize_record_from_model_and_dict():
    record = _record(status=TakedownRequestStatus.ACCEPTED, created_at=datetime(2026, 1, 1, tzinfo=timezone.utc))
    data = TakedownManager._serialize_record(record)
    assert data["id"] == str(record.id)
    assert data["status"] == "accepted"
    assert data["public_status"] == "accepted"
    assert isinstance(data["created_at"], str)

    raw = {"_id": ObjectId(ROOT_ID), "status": "pending", "target_domain": "evil.test",
           "updated_at": datetime(2026, 2, 2, tzinfo=timezone.utc)}
    data2 = TakedownManager._serialize_record(raw)
    assert data2["id"] == ROOT_ID
    assert data2["public_status"] == "in_progress"
    assert isinstance(data2["updated_at"], str)


def test_existing_record_response():
    record = _record()
    data = TakedownManager._existing_record_response(record)
    assert set(data.keys()) == {"id", "target_domain", "abuse_email", "status", "public_status", "status_label"}


def test_extract_micro_evidence_variants():
    assert TakedownManager._extract_micro_evidence({"result": {"a": 1}}) == {"a": 1}
    assert TakedownManager._extract_micro_evidence({"response": {"result": {"b": 2}}}) == {"b": 2}
    assert TakedownManager._extract_micro_evidence({"c": 3}) == {"c": 3}


def test_extract_abuse_email():
    assert TakedownManager._extract_abuse_email({"result": {"abuse_email_found": "a@b.com"}}) == "a@b.com"
    assert TakedownManager._extract_abuse_email({"abuse_email": "c@d.com"}) == "c@d.com"
    assert TakedownManager._extract_abuse_email({}) == ""


def test_is_pending_evidence_response():
    assert TakedownManager._is_pending_evidence_response({"status": "pending"}) is True
    assert TakedownManager._is_pending_evidence_response({"result": {"step": "processing"}}) is True
    assert TakedownManager._is_pending_evidence_response({"status": "done"}) is False


def test_capture_evidence_immediate_success(monkeypatch):
    manager = _make_manager()
    _set_env(monkeypatch, {})
    posts = _use_http_client(monkeypatch, responses=[FakeHttpResponse(json_data={"status": "done", "abuse_email_found": "a@b.com"})])
    result = _run(manager._capture_evidence("https://evil.test", "user-1"))
    assert result["abuse_email_found"] == "a@b.com"
    assert len(posts) == 1


def test_capture_evidence_non_dict_response(monkeypatch):
    manager = _make_manager()
    _set_env(monkeypatch, {})
    _use_http_client(monkeypatch, responses=[FakeHttpResponse(json_data=["not", "a", "dict"])])
    result = _run(manager._capture_evidence("https://evil.test", "user-1"))
    assert result == {"result": ["not", "a", "dict"]}


def test_capture_evidence_pending_then_success(monkeypatch):
    manager = _make_manager()
    _set_env(monkeypatch, {"TRUSTED_MICROS_API_BASE": "http://custom:9000/"})
    posts = _use_http_client(monkeypatch, responses=[
        FakeHttpResponse(json_data={"status": "pending"}),
        FakeHttpResponse(json_data={"status": "done", "abuse_email": "a@b.com"}),
    ])
    result = _run(manager._capture_evidence("https://evil.test", "user-1"))
    assert result["status"] == "done"
    assert posts[0][0].startswith("http://custom:9000/")


def test_capture_evidence_http_error(monkeypatch):
    manager = _make_manager()
    _set_env(monkeypatch, {})
    _use_http_client(monkeypatch, responses=[
        FakeHttpResponse(status_code=500, text="boom-a"),
        FakeHttpResponse(status_code=500, text="boom-b"),
    ])
    result = _run(manager._capture_evidence("https://evil.test", "user-1"))
    assert result["status"] == "error"
    assert result["error_message"] in ("boom-a", "boom-b")


def test_capture_evidence_exception(monkeypatch):
    manager = _make_manager()
    _set_env(monkeypatch, {})
    _use_http_client(monkeypatch, exc=RuntimeError("connection refused"))
    result = _run(manager._capture_evidence("https://evil.test", "user-1"))
    assert result["status"] == "error"
    assert "connection refused" in result["error_message"]


def test_update_elastic_status_skips_without_report_id(monkeypatch):
    manager = _make_manager()
    connection = FakeElasticConnection()
    _use_elastic(monkeypatch, connection)
    _run(manager._update_elastic_status(_record(report_id="")))
    assert connection.updates == []


def test_update_elastic_status_updates(monkeypatch):
    manager = _make_manager()
    connection = FakeElasticConnection()
    _use_elastic(monkeypatch, connection)
    _run(manager._update_elastic_status(_record(report_id="report-1")))
    assert connection.updates[0]["id"] == "report-1"
    assert connection.updates[0]["doc"] == {"m_takedown_status": "in_progress"}


def test_update_elastic_status_swallows_errors(monkeypatch):
    manager = _make_manager()
    _use_elastic(monkeypatch, FakeElasticConnection(raises=True))
    _run(manager._update_elastic_status(_record(report_id="report-1")))


def test_enrich_report_variants():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    assert _run(manager.enrich_report(None)) is None
    assert _run(manager.enrich_report({"foo": "bar"})) == {"foo": "bar"}

    manager_no_record = _make_manager(FakeMongoEngine(find_one_results=[None]))
    report = {"m_url": "https://evil.test", "m_takedown_status": "old", "m_takedown_label": "x", "m_takedown_disabled": True}
    enriched = _run(manager_no_record.enrich_report(report))
    assert "m_takedown_status" not in enriched

    record = _record(status=TakedownRequestStatus.ACCEPTED, abuse_email="a@b.com")
    manager_found = _make_manager(FakeMongoEngine(find_one_results=[record]))
    enriched2 = _run(manager_found.enrich_report({"m_url": "https://evil.test"}))
    assert enriched2["m_takedown_status"] == "accepted"
    assert enriched2["m_takedown_disabled"] is True


def test_create_request_missing_target_url():
    manager = _make_manager()
    request = TakedownCreateRequest(target_url="   ")
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_request(request, _user()))
    assert exc.value.status_code == 400


def test_create_request_existing_with_abuse_email():
    existing = _record(abuse_email="known@evil.test")
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), existing]))
    request = TakedownCreateRequest(target_url="evil.test")
    result = _run(manager.create_request(request, _user(tenant_uuid="tenant-x")))
    assert result["abuse_email"] == "known@evil.test"


def test_create_request_capture_error(monkeypatch):
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), None]))

    async def fake_capture(target_url, user_id):
        return {"status": "error", "error_message": "capture failed"}

    monkeypatch.setattr(manager, "_capture_evidence", fake_capture)
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_request(TakedownCreateRequest(target_url="evil.test"), _user()))
    assert exc.value.status_code == 424
    assert exc.value.detail == "capture failed"


def test_create_request_no_abuse_email(monkeypatch):
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), None]))

    async def fake_capture(target_url, user_id):
        return {"result": {"screenshot_path": "/x.png"}}

    monkeypatch.setattr(manager, "_capture_evidence", fake_capture)
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_request(TakedownCreateRequest(target_url="evil.test"), _user()))
    assert exc.value.status_code == 424


def test_create_request_updates_existing_record(monkeypatch):
    existing = _record(abuse_email="", evidence={})
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), existing]))

    async def fake_capture(target_url, user_id):
        return {"result": {"abuse_email_found": "found@evil.test"}}

    monkeypatch.setattr(manager, "_capture_evidence", fake_capture)
    _use_elastic(monkeypatch, FakeElasticConnection())
    result = _run(manager.create_request(TakedownCreateRequest(target_url="evil.test", report_id="r1"), _user()))
    assert result["abuse_email"] == "found@evil.test"
    assert existing.abuse_email == "found@evil.test"


def test_create_request_creates_new_record(monkeypatch):
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), None]))

    async def fake_capture(target_url, user_id):
        return {"result": {"abuse_email_found": "new@evil.test"}}

    monkeypatch.setattr(manager, "_capture_evidence", fake_capture)
    _use_elastic(monkeypatch, FakeElasticConnection())
    result = _run(manager.create_request(TakedownCreateRequest(target_url="evil.test"), _user(username="bob")))
    assert result["abuse_email"] == "new@evil.test"
    assert result["target_domain"] == "evil.test"


def test_create_request_duplicate_key_recovers(monkeypatch):
    existing = _record(abuse_email="dup@evil.test")

    class DupEngine(FakeMongoEngine):
        def __init__(self):
            super().__init__(find_one_results=[_tenant(), None, existing])
            self.save_calls = 0

        async def save(self, model):
            self.save_calls += 1
            if self.save_calls == 1:
                raise DuplicateKeyError("dup")
            return await super().save(model)

    manager = _make_manager(DupEngine())

    async def fake_capture(target_url, user_id):
        return {"result": {"abuse_email_found": "x@evil.test"}}

    monkeypatch.setattr(manager, "_capture_evidence", fake_capture)
    result = _run(manager.create_request(TakedownCreateRequest(target_url="evil.test"), _user()))
    assert result["abuse_email"] == "dup@evil.test"


def test_list_requests_root_user():
    items = [_record(abuse_email="a@evil.test"), _record(abuse_email="b@evil.test")]
    collection = FakeTakedownCollection(items=items, count=2)
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant()]), collection=collection)
    current_user = _user(tenant_uuid=ROOT_ID, role=user_role.ADMIN)
    response = _run(manager.list_requests(current_user, status="all", page=1, limit=20))
    assert response.total == 2
    assert len(response.items) == 2
    assert "requester_tenant_uuid" not in collection.queries[0]


def test_list_requests_analyst_scoped_with_filters():
    collection = FakeTakedownCollection(items=[_record()], count=1)
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant()]), collection=collection)
    current_user = _user(tenant_uuid="tenant-2", user_id="analyst-1", role=user_role.ANALYST)
    response = _run(manager.list_requests(
        current_user, status="pending", q="evil", page=2, limit=10, daterange="2026-01-01,2026-12-31"))
    query = collection.queries[0]
    assert query["requester_tenant_uuid"] == "tenant-2"
    assert query["user_uuid"] == "analyst-1"
    assert query["status"] == "pending"
    assert "$or" in query
    assert "created_at" in query
    assert response.page == 2


def test_get_admin_record_permission_and_lookup():
    manager_forbidden = _make_manager(FakeMongoEngine(find_one_results=[_tenant()]))
    with pytest.raises(HTTPException) as exc:
        _run(manager_forbidden._get_admin_record(ROOT_ID, _user(tenant_uuid=ROOT_ID, role=user_role.ANALYST)))
    assert exc.value.status_code == 403

    manager_invalid = _make_manager(FakeMongoEngine(find_one_results=[_tenant()]))
    with pytest.raises(HTTPException) as exc2:
        _run(manager_invalid._get_admin_record("bad-id", _user(tenant_uuid=ROOT_ID, role=user_role.ADMIN)))
    assert exc2.value.status_code == 400

    manager_missing = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), None]))
    with pytest.raises(HTTPException) as exc3:
        _run(manager_missing._get_admin_record(ROOT_ID, _user(tenant_uuid=ROOT_ID, role=user_role.ADMIN)))
    assert exc3.value.status_code == 404

    record = _record()
    manager_ok = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), record]))
    result = _run(manager_ok._get_admin_record(ROOT_ID, _user(tenant_uuid=ROOT_ID, role=user_role.ADMIN)))
    assert result is record


def _admin_user():
    return _user(tenant_uuid=ROOT_ID, role=user_role.ADMIN)


def test_accept_request_success(monkeypatch):
    record = _record(
        status=TakedownRequestStatus.PENDING,
        abuse_email="a@evil.test",
        evidence={"result": {"screenshot_path": "/s.png", "html_path": "/h.html"}, "custom_message": "please remove"},
    )
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), record]))
    mail = FakeMailManager()
    _use_mail(monkeypatch, mail)
    _use_elastic(monkeypatch, FakeElasticConnection())
    result = _run(manager.accept_request(ROOT_ID, _admin_user()))
    assert result["status"] == "accepted"
    assert mail.takedowns[0]["to_email"] == "a@evil.test"
    assert record.status == TakedownRequestStatus.ACCEPTED


def test_accept_request_denied_conflict():
    record = _record(status=TakedownRequestStatus.DENIED)
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), record]))
    with pytest.raises(HTTPException) as exc:
        _run(manager.accept_request(ROOT_ID, _admin_user()))
    assert exc.value.status_code == 409


def test_accept_request_already_accepted():
    record = _record(status=TakedownRequestStatus.ACCEPTED)
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), record]))
    result = _run(manager.accept_request(ROOT_ID, _admin_user()))
    assert result["status"] == "accepted"


def test_accept_request_no_abuse_email():
    record = _record(status=TakedownRequestStatus.PENDING, abuse_email="", evidence={})
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), record]))
    with pytest.raises(HTTPException) as exc:
        _run(manager.accept_request(ROOT_ID, _admin_user()))
    assert exc.value.status_code == 400


def test_deny_request_success(monkeypatch):
    record = _record(status=TakedownRequestStatus.PENDING)
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), record]))
    _use_elastic(monkeypatch, FakeElasticConnection())
    result = _run(manager.deny_request(ROOT_ID, TakedownDecisionRequest(reason="spam"), _admin_user()))
    assert result["status"] == "denied"
    assert record.denial_reason == "spam"


def test_deny_request_accepted_conflict():
    record = _record(status=TakedownRequestStatus.ACCEPTED)
    manager = _make_manager(FakeMongoEngine(find_one_results=[_tenant(), record]))
    with pytest.raises(HTTPException) as exc:
        _run(manager.deny_request(ROOT_ID, TakedownDecisionRequest(reason=""), _admin_user()))
    assert exc.value.status_code == 409
