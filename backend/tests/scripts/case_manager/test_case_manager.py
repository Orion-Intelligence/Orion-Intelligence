from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from orion.api.interactive.case_manager.models.case_models import (
    CaseArtifactModel,
    CaseCommentModel,
    CaseStatusBoardConfig,
    CaseStatusBoardItem,
    CaseTaskModel,
    UpdateCaseStatusRequest,
)
from orion.services.mongo_manager.shared_model.db_case_model import (
    CaseComment,
    CaseLink,
    CaseStatus,
    CaseTask,
    TaskStatus,
)
from tests.model.fakes import FakeMongoEngine
from tests.scripts.case_manager.fakes import FakeArtifactFileHelper
from tests.scripts.case_manager.helpers import (
    _admin,
    _analyst,
    _closure_model,
    _closure_record,
    _comment_model,
    _entity_model,
    _link_model,
    _maintainer,
    _make_account,
    _make_create_request,
    _make_entity,
    _make_manager,
    _make_record,
    _make_rich_record,
    _make_update_request,
    _member,
    _run,
    _task_model,
    use_audit,
    use_cipher,
    use_search,
    use_status_config,
)


def test_has_case_management_permission_true_and_false():
    manager = _make_manager(FakeMongoEngine())
    from orion.services.permission_manager.permission_models import UserPermission

    good = SimpleNamespace(permissions=[UserPermission.CASE_MANAGEMENT])
    bad = SimpleNamespace(permissions=[])
    none_perm = SimpleNamespace(permissions=None)
    assert manager._has_case_management_permission(good) is True
    assert manager._has_case_management_permission(bad) is False
    assert manager._has_case_management_permission(none_perm) is False


def test_serialize_case_users_maps_fields():
    manager = _make_manager(FakeMongoEngine())
    account = _make_account()
    result = manager._serialize_case_users([account])
    assert result == [
        {
            "id": "analyst-1",
            "username": "ana",
            "email": "ana@example.com",
            "role": "analyst",
            "status": "active",
        }
    ]


def test_get_tenant_analyst_ids_filters_by_permission():
    with_perm = _make_account(account_id="a1")
    without_perm = _make_account(account_id="a2", permissions=[])
    engine = FakeMongoEngine(records=[with_perm, without_perm])
    manager = _make_manager(engine)

    result = _run(manager._get_tenant_analyst_ids(_maintainer()))

    assert result == {"a1"}


def test_validate_case_analysts_empty_returns():
    manager = _make_manager(FakeMongoEngine())
    _run(manager._validate_case_analysts([], _maintainer()))


def test_validate_case_analysts_valid_passes():
    engine = FakeMongoEngine(records=[_make_account(account_id="a1")])
    manager = _make_manager(engine)
    _run(manager._validate_case_analysts(["a1"], _maintainer()))


def test_validate_case_analysts_invalid_raises_400():
    engine = FakeMongoEngine(records=[_make_account(account_id="a1")])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager._validate_case_analysts(["nope"], _maintainer()))
    assert exc.value.status_code == 400


def test_validate_work_assignments_variants():
    manager = _make_manager(FakeMongoEngine())
    manager._validate_work_assignments([_task_model(assigned_to="")], [])
    manager._validate_work_assignments([_task_model(assigned_to="a1")], ["a1"])
    with pytest.raises(HTTPException) as exc:
        manager._validate_work_assignments([_task_model(assigned_to="x")], ["a1"])
    assert exc.value.status_code == 400


def test_task_assignments_changed():
    manager = _make_manager(FakeMongoEngine())
    record = _make_record(tasks=[CaseTask(taskId="t1", title="T", assignedTo="a1")])
    assert manager._task_assignments_changed(record, [_task_model(task_id="t1", assigned_to="a1")]) is False
    assert manager._task_assignments_changed(record, [_task_model(task_id="t1", assigned_to="a2")]) is True


def test_linked_cases_changed():
    manager = _make_manager(FakeMongoEngine())
    record = _make_record(linked=[CaseLink(targetCaseId="00002", reason="dup")])
    assert manager._linked_cases_changed(record, [_link_model(target="00002", reason="dup")]) is False
    assert manager._linked_cases_changed(record, [_link_model(target="00002", reason="other")]) is True


def test_validate_linked_cases_duplicate_target_raises():
    manager = _make_manager(FakeMongoEngine())
    with pytest.raises(HTTPException) as exc:
        _run(manager._validate_linked_cases("00001", [_link_model("00002"), _link_model("00002")], _maintainer()))
    assert exc.value.status_code == 400


def test_validate_linked_cases_self_link_raises():
    manager = _make_manager(FakeMongoEngine())
    with pytest.raises(HTTPException) as exc:
        _run(manager._validate_linked_cases("00001", [_link_model("00001")], _maintainer()))
    assert "itself" in exc.value.detail


def test_validate_linked_cases_missing_target_raises():
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager._validate_linked_cases("00001", [_link_model("00002")], _maintainer()))
    assert "access" in exc.value.detail


def test_validate_linked_cases_ok():
    target = _make_record(case_id="00002", created_by="maint-1")
    engine = FakeMongoEngine(find_one_results=[target])
    manager = _make_manager(engine)
    _run(manager._validate_linked_cases("00001", [_link_model("00002")], _maintainer()))


def test_get_cases_analyst_archived_forbidden():
    manager = _make_manager(FakeMongoEngine())
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_cases(_analyst(), archived=True))
    assert exc.value.status_code == 403


def test_get_cases_maintainer_returns_all(monkeypatch):
    use_cipher(monkeypatch)
    audit = use_audit(monkeypatch)
    engine = FakeMongoEngine(records=[_make_record(), _make_record(case_id="00002")])
    manager = _make_manager(engine)

    result = _run(manager.get_cases(_maintainer()))

    assert len(result) == 2
    assert audit.calls


def test_get_cases_non_maintainer_uses_filtered_query(monkeypatch):
    use_cipher(monkeypatch)
    use_audit(monkeypatch)
    engine = FakeMongoEngine(records=[_make_record(created_by="member-1")])
    manager = _make_manager(engine)

    result = _run(manager.get_cases(_member()))

    assert len(result) == 1


def test_create_case_duplicate_id_raises(monkeypatch):
    engine = FakeMongoEngine(find_one_results=[_make_record()])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_case(_make_create_request(), _maintainer()))
    assert exc.value.status_code == 400


def test_create_case_closure_without_permission_raises(monkeypatch):
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    request = _make_create_request(closure=_closure_model())
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_case(request, _member(user_id="not-creator")))
    assert exc.value.status_code == 403


def test_create_case_success_with_nested_collections(monkeypatch):
    use_cipher(monkeypatch)
    audit = use_audit(monkeypatch)
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    request = _make_create_request(
        artifacts=[CaseArtifactModel(title="A")],
        comments=[CaseCommentModel(body="hello")],
        tasks=[CaseTaskModel(title="T")],
    )

    result = _run(manager.create_case(request, _maintainer()))

    assert result.caseId == "00001"
    assert engine.saved
    assert audit.calls


def test_create_case_success_with_closure(monkeypatch):
    use_cipher(monkeypatch)
    use_audit(monkeypatch)
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    request = _make_create_request(closure=_closure_model())

    result = _run(manager.create_case(request, _maintainer()))

    assert result.closure is not None


def test_get_case_analysts_filters_permission():
    engine = FakeMongoEngine(records=[_make_account(account_id="a1"), _make_account(account_id="a2", permissions=[])])
    manager = _make_manager(engine)
    result = _run(manager.get_case_analysts(_maintainer()))
    assert [item["id"] for item in result] == ["a1"]


def test_get_assigned_case_analysts_empty_returns_empty():
    manager = _make_manager(FakeMongoEngine())
    record = _make_record(assigned=[])
    assert _run(manager._get_assigned_case_analysts(record)) == []


def test_get_assigned_case_analysts_returns_matching():
    account = _make_account(account_id="a1")
    engine = FakeMongoEngine(records=[account])
    manager = _make_manager(engine)
    record = _make_record(assigned=["a1"])
    result = _run(manager._get_assigned_case_analysts(record))
    assert [item["id"] for item in result] == ["a1"]


def test_get_case_by_id_not_found(monkeypatch):
    use_audit(monkeypatch)
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_case_by_id("00001", _maintainer()))
    assert exc.value.status_code == 404


def test_get_case_by_id_forbidden(monkeypatch):
    use_audit(monkeypatch)
    engine = FakeMongoEngine(find_one_results=[_make_record(created_by="someone")])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_case_by_id("00001", _member(user_id="other")))
    assert exc.value.status_code == 403


def test_get_case_by_id_success_rich_record(monkeypatch):
    use_cipher(monkeypatch)
    audit = use_audit(monkeypatch)
    engine = FakeMongoEngine(find_one_results=[_make_rich_record()])
    manager = _make_manager(engine)

    result = _run(manager.get_case_by_id("00001", _maintainer()))

    assert result.caseId == "00001"
    assert result.communications and result.communications[0]["hasSession"] is True
    assert audit.calls


def test_has_entity_changed():
    manager = _make_manager(FakeMongoEngine())
    old = _make_entity()
    same = _entity_model()
    changed = _entity_model(value="different@b.com")
    assert manager._has_entity_changed(old, same) is False
    assert manager._has_entity_changed(old, changed) is True


def test_normalize_date_for_compare_variants():
    manager = _make_manager(FakeMongoEngine())
    assert manager._normalize_date_for_compare(None) is None
    dt = datetime(2026, 5, 4, tzinfo=timezone.utc)
    assert manager._normalize_date_for_compare(dt) == "2026-05-04"
    assert manager._normalize_date_for_compare("2026-05-04T00:00:00") == "2026-05-04"


def test_has_task_changed():
    manager = _make_manager(FakeMongoEngine())
    old = CaseTask(taskId="t1", title="T")
    same = _task_model(task_id="t1", title="T")
    changed = _task_model(task_id="t1", title="Other")
    assert manager._has_task_changed(old, same) is False
    assert manager._has_task_changed(old, changed) is True


def test_task_non_status_changed_for_analyst():
    manager = _make_manager(FakeMongoEngine())
    old = CaseTask(taskId="t1", title="T", status=TaskStatus.OPEN)
    status_only = _task_model(task_id="t1", title="T", status=TaskStatus.IN_PROGRESS)
    title_change = _task_model(task_id="t1", title="Other", status=TaskStatus.OPEN)
    assert manager._task_non_status_changed_for_analyst(old, status_only) is False
    assert manager._task_non_status_changed_for_analyst(old, title_change) is True


def test_has_comment_changed():
    manager = _make_manager(FakeMongoEngine())
    old = CaseComment(commentId="c1", body="Body")
    assert manager._has_comment_changed(old, _comment_model(comment_id="c1", body="Body")) is False
    assert manager._has_comment_changed(old, _comment_model(comment_id="c1", body="New")) is True


def test_validate_analyst_task_update_add_remove_forbidden():
    manager = _make_manager(FakeMongoEngine())
    record = _make_record(tasks=[CaseTask(taskId="t1", title="T")])
    with pytest.raises(HTTPException) as exc:
        manager._validate_analyst_task_update(record, [], "analyst-1")
    assert exc.value.status_code == 403


def test_validate_analyst_task_update_non_status_change_forbidden():
    manager = _make_manager(FakeMongoEngine())
    record = _make_record(tasks=[CaseTask(taskId="t1", title="T", assignedTo="analyst-1")])
    tasks = [_task_model(task_id="t1", title="Renamed", assigned_to="analyst-1")]
    with pytest.raises(HTTPException) as exc:
        manager._validate_analyst_task_update(record, tasks, "analyst-1")
    assert "only update task status" in exc.value.detail


def test_validate_analyst_task_update_status_same_continues():
    manager = _make_manager(FakeMongoEngine())
    task = CaseTask(taskId="t1", title="T", assignedTo="analyst-1", status=TaskStatus.OPEN)
    record = _make_record(tasks=[task])
    tasks = [_task_model(task_id="t1", title="T", assigned_to="analyst-1", status=TaskStatus.OPEN)]
    manager._validate_analyst_task_update(record, tasks, "analyst-1")


def test_validate_analyst_task_update_not_assigned_forbidden():
    manager = _make_manager(FakeMongoEngine())
    task = CaseTask(taskId="t1", title="T", assignedTo="other", status=TaskStatus.OPEN)
    record = _make_record(tasks=[task])
    tasks = [_task_model(task_id="t1", title="T", assigned_to="other", status=TaskStatus.IN_PROGRESS)]
    with pytest.raises(HTTPException) as exc:
        manager._validate_analyst_task_update(record, tasks, "analyst-1")
    assert "assigned to them" in exc.value.detail


def test_validate_analyst_task_update_invalid_status_forbidden():
    manager = _make_manager(FakeMongoEngine())
    task = CaseTask(taskId="t1", title="T", assignedTo="analyst-1", status=TaskStatus.OPEN)
    record = _make_record(tasks=[task])
    tasks = [_task_model(task_id="t1", title="T", assigned_to="analyst-1", status=TaskStatus.DONE)]
    with pytest.raises(HTTPException) as exc:
        manager._validate_analyst_task_update(record, tasks, "analyst-1")
    assert "in progress or under review" in exc.value.detail


def test_validate_analyst_task_update_allowed_status():
    manager = _make_manager(FakeMongoEngine())
    task = CaseTask(taskId="t1", title="T", assignedTo="analyst-1", status=TaskStatus.OPEN)
    record = _make_record(tasks=[task])
    tasks = [_task_model(task_id="t1", title="T", assigned_to="analyst-1", status=TaskStatus.IN_PROGRESS)]
    manager._validate_analyst_task_update(record, tasks, "analyst-1")


def test_update_case_not_found(monkeypatch):
    use_audit(monkeypatch)
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case("00001", _make_update_request(), _maintainer()))
    assert exc.value.status_code == 404


def test_update_case_archived_forbidden(monkeypatch):
    engine = FakeMongoEngine(find_one_results=[_make_record(is_archived=True)])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case("00001", _make_update_request(), _maintainer()))
    assert "Archived" in exc.value.detail


def test_update_case_view_forbidden(monkeypatch):
    engine = FakeMongoEngine(find_one_results=[_make_record(created_by="someone")])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case("00001", _make_update_request(), _member(user_id="other")))
    assert exc.value.status_code == 403


def test_update_case_closed_cannot_edit(monkeypatch):
    use_cipher(monkeypatch)
    engine = FakeMongoEngine(find_one_results=[_make_record(closure=_closure_record())])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case("00001", _make_update_request(), _maintainer()))
    assert "Closed cases cannot be edited" in exc.value.detail


def test_update_case_assigned_analysts_change_forbidden(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_record(created_by="someone", assigned=["member-1"])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    request = _make_update_request(assignedAnalystIds=["another"])
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case("00001", request, _member(user_id="member-1")))
    assert "update case analysts" in exc.value.detail


def test_update_case_task_assignment_change_forbidden(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_record(created_by="someone", assigned=["member-1"])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    request = _make_update_request(assignedAnalystIds=["member-1"], tasks=[_task_model(task_id="t1", assigned_to="")])
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case("00001", request, _member(user_id="member-1")))
    assert "assign tasks" in exc.value.detail


def test_update_case_linked_change_forbidden(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_record(created_by="someone", assigned=["member-1"])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    request = _make_update_request(assignedAnalystIds=["member-1"], linkedCases=[_link_model("00002")])
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case("00001", request, _member(user_id="member-1")))
    assert "link cases" in exc.value.detail


def test_update_case_closure_permission_forbidden(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_record(created_by="someone", assigned=["member-1"], status=CaseStatus.RESOLVED)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    request = _make_update_request(assignedAnalystIds=["member-1"], closure=_closure_model())
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case("00001", request, _member(user_id="member-1")))
    assert "close cases" in exc.value.detail


def test_update_case_closure_requires_resolved_status(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_record(created_by="member-1", status=CaseStatus.NEW)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    request = _make_update_request(closure=_closure_model())
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case("00001", request, _member(user_id="member-1")))
    assert "resolved status" in exc.value.detail


def test_update_case_status_change_requires_board(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_record(created_by="maint-1", status=CaseStatus.NEW)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    request = _make_update_request(status=CaseStatus.UNDER_INVESTIGATION)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case("00001", request, _maintainer()))
    assert "tracking board" in exc.value.detail


def test_update_case_success_maintainer(monkeypatch):
    use_cipher(monkeypatch)
    audit = use_audit(monkeypatch)
    record = _make_record(created_by="maint-1")
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    request = _make_update_request()

    result = _run(manager.update_case("00001", request, _maintainer()))

    assert result.caseId == "00001"
    assert engine.saved
    assert audit.calls


def test_update_case_success_analyst_limited(monkeypatch):
    use_cipher(monkeypatch)
    use_audit(monkeypatch)
    task = CaseTask(taskId="t1", title="T", assignedTo="analyst-1", status=TaskStatus.OPEN)
    record = _make_record(created_by="maint-1", assigned=["analyst-1"], tasks=[task])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    request = _make_update_request(
        tasks=[_task_model(task_id="t1", title="T", assigned_to="analyst-1", status=TaskStatus.IN_PROGRESS)],
    )

    result = _run(manager.update_case("00001", request, _analyst()))

    assert result.caseId == "00001"


def test_update_case_success_existing_children_unchanged(monkeypatch):
    use_cipher(monkeypatch)
    use_audit(monkeypatch)
    entity = _make_entity(entity_id="e1")
    task = CaseTask(taskId="t1", title="T", assignedTo="")
    comment = CaseComment(commentId="c1", body="Body")
    link = CaseLink(targetCaseId="00002", reason="dup")
    record = _make_record(
        created_by="maint-1",
        entities=[entity],
        tasks=[task],
        comments=[comment],
        linked=[link],
    )
    target = _make_record(case_id="00002", created_by="maint-1")
    engine = FakeMongoEngine(find_one_results=[record, target])
    manager = _make_manager(engine)
    request = _make_update_request(
        tasks=[_task_model(task_id="t1", title="T", assigned_to="")],
        comments=[_comment_model(comment_id="c1", body="Body")],
        linkedCases=[_link_model("00002", reason="dup")],
    )

    result = _run(manager.update_case("00001", request, _maintainer()))

    assert result.caseId == "00001"


def test_update_case_maintainer_changes_assignments_and_links(monkeypatch):
    use_cipher(monkeypatch)
    use_audit(monkeypatch)
    record = _make_record(created_by="maint-1", assigned=[])
    target = _make_record(case_id="00002", created_by="maint-1")
    account = _make_account(account_id="a1")
    engine = FakeMongoEngine(records=[account], find_one_results=[record, target])
    manager = _make_manager(engine)
    request = _make_update_request(
        assignedAnalystIds=["a1"],
        linkedCases=[_link_model("00002", reason="dup")],
    )

    result = _run(manager.update_case("00001", request, _maintainer()))

    assert result.caseId == "00001"
    assert record.assignedAnalystIds == ["a1"]


def test_update_case_closure_cleared(monkeypatch):
    use_cipher(monkeypatch)
    use_audit(monkeypatch)
    record = _make_record(created_by="maint-1", status=CaseStatus.NEW)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    request = _make_update_request(closure=None)

    result = _run(manager.update_case("00001", request, _maintainer()))

    assert result.closure is None


def test_update_case_closing_from_details(monkeypatch):
    use_cipher(monkeypatch)
    use_audit(monkeypatch)
    record = _make_record(created_by="member-1", status=CaseStatus.RESOLVED)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    request = _make_update_request(status=CaseStatus.CLOSED, closure=_closure_model())

    result = _run(manager.update_case("00001", request, _member(user_id="member-1")))

    assert result.status == CaseStatus.CLOSED


def test_delete_case_not_found():
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_case("00001", _maintainer()))
    assert exc.value.status_code == 404


def test_delete_case_archived_forbidden():
    engine = FakeMongoEngine(find_one_results=[_make_record(is_archived=True)])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_case("00001", _maintainer()))
    assert "Archived" in exc.value.detail


def test_delete_case_closed_forbidden():
    engine = FakeMongoEngine(find_one_results=[_make_record(closure=_closure_record())])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_case("00001", _maintainer()))
    assert "Closed" in exc.value.detail


def test_delete_case_non_maintainer_forbidden():
    engine = FakeMongoEngine(find_one_results=[_make_record(created_by="member-1")])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_case("00001", _member(user_id="member-1")))
    assert "maintainers can delete" in exc.value.detail


def test_delete_case_success(monkeypatch):
    audit = use_audit(monkeypatch)
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)

    result = _run(manager.delete_case("00001", _maintainer()))

    assert result == {"success": True}
    assert engine.deleted == [record]
    assert audit.calls


def test_get_next_case_id():
    engine = FakeMongoEngine()
    engine.count_result = 41
    manager = _make_manager(engine)
    assert _run(manager.get_next_case_id(_maintainer())) == {"nextCaseId": "00042"}


def test_upload_artifact_files_analyst_forbidden():
    record = _make_rich_record(created_by="analyst-1")
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.upload_artifact_files("00001", "art-1", [object()], _analyst()))
    assert "Analysts cannot upload" in exc.value.detail


def test_upload_artifact_files_no_files():
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.upload_artifact_files("00001", "art-1", [], _maintainer()))
    assert exc.value.status_code == 400


def test_upload_artifact_files_artifact_not_found(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    files = [SimpleNamespace(filename="a.txt", content_type="text/plain")]
    with pytest.raises(HTTPException) as exc:
        _run(manager.upload_artifact_files("00001", "missing", files, _maintainer()))
    assert exc.value.status_code == 404


def test_upload_artifact_files_success(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    helper = FakeArtifactFileHelper()
    manager = _make_manager(engine, helper)
    files = [SimpleNamespace(filename="a.txt", content_type="text/plain")]

    result = _run(manager.upload_artifact_files("00001", "art-1", files, _maintainer()))

    assert len(result["files"]) == 1
    assert helper.saved
    assert engine.saved


def test_load_viewable_case_not_found():
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager._load_viewable_case("00001", _maintainer()))
    assert exc.value.status_code == 404


def test_load_viewable_case_forbidden():
    engine = FakeMongoEngine(find_one_results=[_make_record(created_by="someone")])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager._load_viewable_case("00001", _member(user_id="other")))
    assert exc.value.status_code == 403


def test_resolve_artifact_file_variants():
    record = _make_rich_record()
    with pytest.raises(HTTPException) as exc:
        _make_manager(FakeMongoEngine())._resolve_artifact_file(record, "missing", "file-1")
    assert exc.value.status_code == 404

    with pytest.raises(HTTPException) as exc2:
        _make_manager(FakeMongoEngine())._resolve_artifact_file(record, "art-1", "missing")
    assert exc2.value.status_code == 404

    artifact, artifact_file = _make_manager(FakeMongoEngine())._resolve_artifact_file(record, "art-1", "file-1")
    assert artifact.artifactId == "art-1"
    assert artifact_file.fileId == "file-1"


def test_get_artifact_file_response_success(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    helper = FakeArtifactFileHelper(verify_result=True, file_data=b"data")
    manager = _make_manager(engine, helper)

    response = _run(manager.get_artifact_file_response("00001", "art-1", "file-1", _maintainer()))

    assert response.body == b"data"
    assert "attachment" in response.headers["Content-Disposition"]


def test_get_artifact_file_response_integrity_failure(monkeypatch):
    use_cipher(monkeypatch)
    audit = use_audit(monkeypatch)
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    helper = FakeArtifactFileHelper(verify_result=False)
    manager = _make_manager(engine, helper)

    with pytest.raises(HTTPException) as exc:
        _run(manager.get_artifact_file_response("00001", "art-1", "file-1", _maintainer()))

    assert exc.value.status_code == 409
    assert audit.calls
    assert engine.saved


def test_delete_artifact_file_analyst_forbidden():
    record = _make_rich_record(created_by="analyst-1")
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_artifact_file_from_case("00001", "art-1", "file-1", _analyst()))
    assert "Analysts cannot delete" in exc.value.detail


def test_delete_artifact_file_success(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    helper = FakeArtifactFileHelper()
    manager = _make_manager(engine, helper)

    result = _run(manager.delete_artifact_file_from_case("00001", "art-1", "file-1", _maintainer()))

    assert result == {"success": True}
    assert helper.deleted == ["res-1"]


def test_extract_report_id_and_title():
    manager = _make_manager(FakeMongoEngine())
    assert manager._extract_report_id("not-a-dict") == ""
    assert manager._extract_report_id({"m_id": "42"}) == "42"
    assert manager._extract_report_title("not-a-dict") == ""
    assert manager._extract_report_title({"m_title": "Report"}) == "Report"
    assert manager._extract_report_title({}) == "Untitled Report"


@pytest.mark.parametrize(
    "source",
    ["strategic", "breach", "defacement", "social", "exploit", "feed", "stealerlogs"],
)
def test_get_artifact_reports_each_source(monkeypatch, source):
    use_search(monkeypatch, result={"Result": []})
    manager = _make_manager(FakeMongoEngine())
    assert _run(manager.get_artifact_reports(source, _maintainer())) == []


def test_get_artifact_reports_invalid_source(monkeypatch):
    use_search(monkeypatch)
    manager = _make_manager(FakeMongoEngine())
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_artifact_reports("bogus", _maintainer()))
    assert exc.value.status_code == 400


def test_get_artifact_reports_dedup_and_limit(monkeypatch):
    rows = {
        "Result": [
            {"m_id": "1", "m_title": "One"},
            {"m_id": "1", "m_title": "Dup"},
            {"m_id": "", "m_title": "NoId"},
            {"m_id": "2", "m_title": "Two"},
            {"m_id": "3", "m_title": "Three"},
        ]
    }
    use_search(monkeypatch, result=rows)
    manager = _make_manager(FakeMongoEngine())

    result = _run(manager.get_artifact_reports("strategic", _maintainer(), q="x", limit=2))

    assert result == [{"id": "1", "title": "One"}, {"id": "2", "title": "Two"}]


def test_archive_case_not_found():
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.archive_case("00001", _maintainer()))
    assert exc.value.status_code == 404


def test_archive_case_permission_forbidden():
    engine = FakeMongoEngine(find_one_results=[_make_record(created_by="someone")])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.archive_case("00001", _member(user_id="other")))
    assert "archive cases" in exc.value.detail


def test_archive_case_requires_closed():
    engine = FakeMongoEngine(find_one_results=[_make_record(created_by="maint-1")])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.archive_case("00001", _maintainer()))
    assert "closed cases can be archived" in exc.value.detail


def test_archive_case_already_archived():
    record = _make_record(created_by="maint-1", closure=_closure_record(), is_archived=True)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    result = _run(manager.archive_case("00001", _maintainer()))
    assert result["message"] == "Case is already archived"


def test_archive_case_success(monkeypatch):
    audit = use_audit(monkeypatch)
    record = _make_record(created_by="maint-1", closure=_closure_record())
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)

    result = _run(manager.archive_case("00001", _maintainer()))

    assert result == {"success": True}
    assert record.isArchived is True
    assert audit.calls


def test_unarchive_case_non_admin_forbidden():
    manager = _make_manager(FakeMongoEngine())
    with pytest.raises(HTTPException) as exc:
        _run(manager.unarchive_case("00001", _maintainer()))
    assert "admins can unarchive" in exc.value.detail


def test_unarchive_case_not_found():
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.unarchive_case("00001", _admin()))
    assert exc.value.status_code == 404


def test_unarchive_case_already_unarchived():
    record = _make_record(created_by="admin-1", is_archived=False)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    result = _run(manager.unarchive_case("00001", _admin()))
    assert result["message"] == "Case is already unarchived"


def test_unarchive_case_success(monkeypatch):
    audit = use_audit(monkeypatch)
    record = _make_record(created_by="admin-1", is_archived=True)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)

    result = _run(manager.unarchive_case("00001", _admin()))

    assert result == {"success": True}
    assert record.isArchived is False
    assert audit.calls


def test_verify_file_integrity_sets_status():
    helper = FakeArtifactFileHelper(verify_result=True)
    manager = _make_manager(FakeMongoEngine(), helper)
    record = _make_rich_record()
    artifact_file = record.artifacts[0].files[0]
    assert manager._verify_file_integrity(artifact_file, object()) is True
    assert artifact_file.integrityStatus == "verified"

    helper.verify_result = False
    assert manager._verify_file_integrity(artifact_file, object()) is False
    assert artifact_file.integrityStatus == "failed"


def test_verify_artifact_file_artifact_not_found(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.verify_artifact_file("00001", "missing", "file-1", _maintainer()))
    assert exc.value.status_code == 404


def test_verify_artifact_file_file_not_found(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.verify_artifact_file("00001", "art-1", "missing", _maintainer()))
    assert exc.value.status_code == 404


def test_verify_artifact_file_valid(monkeypatch):
    use_cipher(monkeypatch)
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    helper = FakeArtifactFileHelper(verify_result=True)
    manager = _make_manager(engine, helper)

    result = _run(manager.verify_artifact_file("00001", "art-1", "file-1", _maintainer()))

    assert result["success"] is True
    assert result["status"] == "verified"


def test_verify_artifact_file_invalid(monkeypatch):
    use_cipher(monkeypatch)
    audit = use_audit(monkeypatch)
    record = _make_rich_record()
    engine = FakeMongoEngine(find_one_results=[record])
    helper = FakeArtifactFileHelper(verify_result=False)
    manager = _make_manager(engine, helper)

    result = _run(manager.verify_artifact_file("00001", "art-1", "file-1", _maintainer()))

    assert result["success"] is False
    assert result["status"] == "failed"
    assert audit.calls


def _board_config(*items):
    return CaseStatusBoardConfig(statuses=list(items))


def test_update_case_status_not_found():
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.INTAKE_REVIEW, reason="r")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case_status("00001", data, _maintainer()))
    assert exc.value.status_code == 404


def test_update_case_status_view_forbidden():
    engine = FakeMongoEngine(find_one_results=[_make_record(created_by="someone")])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.INTAKE_REVIEW, reason="r")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case_status("00001", data, _member(user_id="other")))
    assert exc.value.status_code == 403


def test_update_case_status_manage_forbidden():
    record = _make_record(created_by="someone", assigned=["member-1"])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.INTAKE_REVIEW, reason="r")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case_status("00001", data, _member(user_id="member-1")))
    assert "update case status" in exc.value.detail


def test_update_case_status_archived_forbidden():
    record = _make_record(created_by="maint-1", closure=_closure_record(), is_archived=True)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.INTAKE_REVIEW, reason="r")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case_status("00001", data, _maintainer()))
    assert "Archived" in exc.value.detail


def test_update_case_status_closed_forbidden():
    record = _make_record(created_by="maint-1", status=CaseStatus.CLOSED)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.INTAKE_REVIEW, reason="r")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case_status("00001", data, _maintainer()))
    assert "Closed cases cannot be moved" in exc.value.detail


def test_update_case_status_not_enabled(monkeypatch):
    config = _board_config(
        CaseStatusBoardItem(value="new", label="New", enabled=True),
        CaseStatusBoardItem(value="closed", label="Closed", enabled=True),
    )
    use_status_config(monkeypatch, config)
    record = _make_record(created_by="maint-1", status=CaseStatus.UNDER_INVESTIGATION)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.INTAKE_REVIEW, reason="r")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case_status("00001", data, _maintainer()))
    assert "not enabled" in exc.value.detail


def test_update_case_status_cannot_move_to_new(monkeypatch):
    config = _board_config(
        CaseStatusBoardItem(value="new", label="New", enabled=True),
        CaseStatusBoardItem(value="intake_review", label="Intake", enabled=True),
        CaseStatusBoardItem(value="closed", label="Closed", enabled=True),
    )
    use_status_config(monkeypatch, config)
    record = _make_record(created_by="maint-1", status=CaseStatus.INTAKE_REVIEW)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.NEW, reason="r")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case_status("00001", data, _maintainer()))
    assert "back to new" in exc.value.detail


def test_update_case_status_cannot_move_to_closed(monkeypatch):
    config = _board_config(
        CaseStatusBoardItem(value="new", label="New", enabled=True),
        CaseStatusBoardItem(value="resolved", label="Resolved", enabled=True),
        CaseStatusBoardItem(value="closed", label="Closed", enabled=True),
    )
    use_status_config(monkeypatch, config)
    record = _make_record(created_by="maint-1", status=CaseStatus.RESOLVED)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.CLOSED, reason="r")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case_status("00001", data, _maintainer()))
    assert "closure section" in exc.value.detail


def test_update_case_status_too_many_steps(monkeypatch):
    config = _board_config(
        CaseStatusBoardItem(value="new", label="New", enabled=True),
        CaseStatusBoardItem(value="intake_review", label="Intake", enabled=True, skippable=False),
        CaseStatusBoardItem(value="under_investigation", label="Investigation", enabled=True),
        CaseStatusBoardItem(value="closed", label="Closed", enabled=True),
    )
    use_status_config(monkeypatch, config)
    record = _make_record(created_by="maint-1", status=CaseStatus.NEW)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.UNDER_INVESTIGATION, reason="r")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case_status("00001", data, _maintainer()))
    assert "one step" in exc.value.detail


def test_update_case_status_empty_reason(monkeypatch):
    record = _make_record(created_by="maint-1", status=CaseStatus.NEW)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest.model_construct(status=CaseStatus.INTAKE_REVIEW, reason="   ")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_case_status("00001", data, _maintainer()))
    assert "reason is required" in exc.value.detail


def test_update_case_status_success_single_step(monkeypatch):
    use_cipher(monkeypatch)
    audit = use_audit(monkeypatch)
    use_status_config(monkeypatch, __import__(
        "orion.api.interactive.case_manager.status_board_config",
        fromlist=["StatusBoardConfigManager"],
    ).StatusBoardConfigManager.default_status_board_config())
    record = _make_record(created_by="maint-1", status=CaseStatus.NEW)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.INTAKE_REVIEW, reason="moving forward")

    result = _run(manager.update_case_status("00001", data, _maintainer()))

    assert result.status == CaseStatus.INTAKE_REVIEW
    assert audit.calls


def test_update_case_status_success_with_skip(monkeypatch):
    use_cipher(monkeypatch)
    use_audit(monkeypatch)
    config = _board_config(
        CaseStatusBoardItem(value="new", label="New", enabled=True),
        CaseStatusBoardItem(value="intake_review", label="Intake", enabled=True, skippable=True),
        CaseStatusBoardItem(value="under_investigation", label="Investigation", enabled=True),
        CaseStatusBoardItem(value="closed", label="Closed", enabled=True),
    )
    use_status_config(monkeypatch, config)
    record = _make_record(created_by="maint-1", status=CaseStatus.NEW)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = UpdateCaseStatusRequest(status=CaseStatus.UNDER_INVESTIGATION, reason="skip ahead")

    result = _run(manager.update_case_status("00001", data, _maintainer()))

    assert result.status == CaseStatus.UNDER_INVESTIGATION


def test_assign_case_analyst_not_found():
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    data = SimpleNamespace(analystId="a1")
    with pytest.raises(HTTPException) as exc:
        _run(manager.assign_case_analyst("00001", data, _maintainer()))
    assert exc.value.status_code == 404


def test_assign_case_analyst_archived():
    record = _make_record(created_by="maint-1", is_archived=True)
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = SimpleNamespace(analystId="a1")
    with pytest.raises(HTTPException) as exc:
        _run(manager.assign_case_analyst("00001", data, _maintainer()))
    assert "Archived" in exc.value.detail


def test_assign_case_analyst_manage_forbidden():
    record = _make_record(created_by="someone", assigned=["member-1"])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = SimpleNamespace(analystId="a1")
    with pytest.raises(HTTPException) as exc:
        _run(manager.assign_case_analyst("00001", data, _member(user_id="member-1")))
    assert "assign analysts" in exc.value.detail


def test_assign_case_analyst_success(monkeypatch):
    use_cipher(monkeypatch)
    audit = use_audit(monkeypatch)
    record = _make_record(created_by="maint-1")
    account = _make_account(account_id="a1")
    engine = FakeMongoEngine(records=[account], find_one_results=[record])
    manager = _make_manager(engine)
    data = SimpleNamespace(analystId="a1")

    result = _run(manager.assign_case_analyst("00001", data, _maintainer()))

    assert record.assignedAnalystIds == ["a1"]
    assert audit.calls
    assert result.caseId == "00001"
