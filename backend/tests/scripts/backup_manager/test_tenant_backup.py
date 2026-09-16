from __future__ import annotations

from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi import HTTPException

from orion.api.interactive.backup_manager.models.tenant_partition_model import Ownership, TenantScope
from orion.api.interactive.backup_manager.tenant_partition import TenantPartitionRegistry
from orion.constants.constant import CONSTANTS
from tests.model.fakes import FakeMongoEngine
from tests.scripts.backup_manager.fakes import _FakeTenantCollection, _FakeTenantEngine
from tests.scripts.backup_manager.helpers import _make_backup_record, _make_manager, _run

TENANT_A = "507f1f77bcf86cd799439011"
TENANT_B = "507f1f77bcf86cd799439012"
USER_A = "607f1f77bcf86cd799439011"
USER_B = "607f1f77bcf86cd799439012"
PRESERVED = {"db_backup_model", "backup_jobs"}


def _registry():
    return TenantPartitionRegistry(preserved=set(PRESERVED))


def _collections():
    return {
        "db_tenant_model": _FakeTenantCollection([
            {"_id": ObjectId(TENANT_A), "name": "Alpha", "slug": "alpha"},
            {"_id": ObjectId(TENANT_B), "name": "Beta", "slug": "beta"},
        ]),
        "db_user_account": _FakeTenantCollection([
            {"_id": ObjectId(USER_A), "tenant_id": TENANT_A, "username": "alpha-admin"},
            {"_id": ObjectId(USER_B), "tenant_id": TENANT_B, "username": "beta-admin"},
        ]),
        "cases": _FakeTenantCollection([
            {"_id": ObjectId(), "tenant_id": TENANT_A, "title": "alpha case"},
            {"_id": ObjectId(), "tenant_id": TENANT_B, "title": "beta case"},
        ]),
        "social": _FakeTenantCollection([
            {"_id": ObjectId(), "user_id": USER_A, "handle": "alpha"},
            {"_id": ObjectId(), "user_id": USER_B, "handle": "beta"},
        ]),
        "takedown_requests": _FakeTenantCollection([
            {"_id": ObjectId(), "tenant_id": TENANT_A, "target_domain": "alpha.example"},
            {"_id": ObjectId(), "tenant_id": TENANT_B, "target_domain": "beta.example"},
        ]),
        "db_url_data_model": _FakeTenantCollection([
            {"_id": ObjectId(), "url": "http://shared.example"},
        ]),
        "db_backup_model": _FakeTenantCollection([]),
        "backup_jobs": _FakeTenantCollection([]),
    }


def _make_tenant_manager(tmp_path, collections, monkeypatch):
    engine = _FakeTenantEngine(collections)
    manager = _make_manager(tmp_path, FakeMongoEngine())
    manager._engine = engine
    manager._partition_registry = _registry()
    monkeypatch.setattr(
        "orion.api.interactive.backup_manager.backup_manager.elastic_controller.get_instance",
        staticmethod(lambda: SimpleNamespace(get_connection=lambda: None)),
    )
    return manager


def _export(manager, tmp_path):
    return _run(manager._tenant._export_tenants(tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR))


def test_registry_reproduces_the_audited_ownership():
    registry = _registry()

    assert registry.rule_for("db_tenant_model").tenant_field == "_id"
    assert registry.rule_for("db_tenant_model").as_object_id is True
    assert registry.rule_for("db_user_account").ownership == Ownership.DIRECT
    assert registry.rule_for("cases").tenant_field == "tenant_id"
    assert registry.rule_for("social").ownership == Ownership.TRANSITIVE
    assert registry.rule_for("db_url_data_model").ownership == Ownership.GLOBAL
    assert registry.rule_for("db_backup_model").ownership == Ownership.PRESERVED


def test_takedown_requests_are_tenant_scoped():
    rule = _registry().rule_for("takedown_requests")

    assert rule.ownership == Ownership.DIRECT
    assert rule.tenant_field == "tenant_id"
    assert rule.source == "inferred"


def test_unknown_collection_is_global_and_never_deleted_per_tenant():
    registry = _registry()

    rule = registry.rule_for("a_collection_added_next_year")

    assert rule.ownership == Ownership.GLOBAL
    assert rule.is_tenant_owned is False
    assert TenantPartitionRegistry.tenant_query(rule, TenantScope(tenant_id=TENANT_A, user_ids=[USER_A])) is None


def test_a_new_model_with_a_tenant_field_is_picked_up_without_a_code_change():
    registry = _registry()
    registry._model_fields["a_future_collection"] = {"tenant_id", "title"}

    rule = registry.rule_for("a_future_collection")

    assert rule.ownership == Ownership.DIRECT
    assert rule.source == "inferred"
    assert TenantPartitionRegistry.tenant_query(rule, TenantScope(tenant_id=TENANT_A)) == {"tenant_id": TENANT_A}


@pytest.mark.parametrize(
    "collection_name,scope",
    [
        ("cases", TenantScope(tenant_id="")),
        ("social", TenantScope(tenant_id=TENANT_A, user_ids=[])),
        ("db_tenant_model", TenantScope(tenant_id="not-an-object-id")),
        ("db_url_data_model", TenantScope(tenant_id=TENANT_A, user_ids=[USER_A])),
    ],
)
def test_tenant_query_fails_safe_instead_of_matching_everything(collection_name, scope):
    assert TenantPartitionRegistry.tenant_query(_registry().rule_for(collection_name), scope) is None


def test_export_writes_one_folder_per_tenant_holding_only_that_tenant(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)

    exported = _export(manager, tmp_path)

    root = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR
    assert sorted(entry.name for entry in root.iterdir()) == sorted([TENANT_A, TENANT_B])
    assert set(exported["tenants"]) == {TENANT_A, TENANT_B}

    alpha_cases = (root / TENANT_A / "mongo" / "cases.ndjson").read_text(encoding="utf-8")
    assert "alpha case" in alpha_cases
    assert "beta case" not in alpha_cases
    assert exported["tenants"][TENANT_A]["users"] == 1


def test_export_never_writes_a_global_collection_into_a_tenant_folder(tmp_path, monkeypatch):
    manager = _make_tenant_manager(tmp_path, _collections(), monkeypatch)

    exported = _export(manager, tmp_path)

    root = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR
    assert not (root / TENANT_A / "mongo" / "db_url_data_model.ndjson").exists()
    assert not (root / TENANT_A / "mongo" / "db_backup_model.ndjson").exists()
    assert exported["layout"]["db_url_data_model"]["ownership"] == "global"


def test_restore_tenant_rewinds_that_tenant_and_leaves_every_other_tenant_untouched(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)

    beta_case_before = [dict(document) for document in collections["cases"].documents if document["tenant_id"] == TENANT_B]
    collections["cases"].documents = [
        document for document in collections["cases"].documents if document["tenant_id"] != TENANT_A
    ]
    collections["cases"].documents.append({"_id": ObjectId(), "tenant_id": TENANT_A, "title": "typed by mistake"})
    collections["social"].documents = [
        document for document in collections["social"].documents if document["user_id"] != USER_A
    ]

    tenant_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A
    scope = _run(manager._tenant._tenant_restore_scope(manager._engine.database, TENANT_A, tenant_dir))
    report = _run(manager._tenant._run_tenant_restore_engine(tenant_dir, scope))

    alpha_cases = [document for document in collections["cases"].documents if document["tenant_id"] == TENANT_A]
    assert [document["title"] for document in alpha_cases] == ["alpha case"]
    assert [document for document in collections["cases"].documents if document["tenant_id"] == TENANT_B] == beta_case_before
    assert [document["handle"] for document in collections["social"].documents] == ["beta", "alpha"]
    assert report["mongo"]["cases"]["written"] == 1


def test_restore_tenant_does_not_touch_global_collections(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    global_before = [dict(document) for document in collections["db_url_data_model"].documents]

    tenant_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A
    scope = _run(manager._tenant._tenant_restore_scope(manager._engine.database, TENANT_A, tenant_dir))
    _run(manager._tenant._run_tenant_restore_engine(tenant_dir, scope))

    assert collections["db_url_data_model"].documents == global_before


def test_restore_tenant_ignores_a_folder_for_a_collection_that_went_global(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)

    tenant_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A
    (tenant_dir / "mongo" / "db_url_data_model.ndjson").write_text(
        '{"_id": {"$oid": "707f1f77bcf86cd799439011"}, "url": "http://smuggled.example"}\n', encoding="utf-8"
    )
    scope = _run(manager._tenant._tenant_restore_scope(manager._engine.database, TENANT_A, tenant_dir))
    report = _run(manager._tenant._run_tenant_restore_engine(tenant_dir, scope))

    assert "db_url_data_model" not in report["mongo"]
    assert all(document["url"] != "http://smuggled.example" for document in collections["db_url_data_model"].documents)


def test_restore_tenant_skips_a_document_another_tenant_owns_now(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)

    moved = next(document for document in collections["cases"].documents if document["tenant_id"] == TENANT_A)
    moved["tenant_id"] = TENANT_B

    tenant_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A
    scope = _run(manager._tenant._tenant_restore_scope(manager._engine.database, TENANT_A, tenant_dir))
    report = _run(manager._tenant._run_tenant_restore_engine(tenant_dir, scope))

    assert report["mongo"]["cases"] == {"removed": 0, "written": 0, "skipped": 1}
    assert moved["tenant_id"] == TENANT_B


def test_restore_tenant_recreates_the_tenants_own_takedowns(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    collections["takedown_requests"].documents = [
        document for document in collections["takedown_requests"].documents
        if document["tenant_id"] != TENANT_A
    ]

    tenant_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A
    scope = _run(manager._tenant._tenant_restore_scope(manager._engine.database, TENANT_A, tenant_dir))
    report = _run(manager._tenant._run_tenant_restore_engine(tenant_dir, scope))

    domains = sorted(document["target_domain"] for document in collections["takedown_requests"].documents)
    assert domains == ["alpha.example", "beta.example"]
    assert report["mongo"]["takedown_requests"] == {"removed": 0, "written": 1, "skipped": 0}


def test_restore_tenant_recreates_a_takedown_another_tenant_also_filed_for(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    collections["takedown_requests"].documents = [
        {"_id": ObjectId(), "tenant_id": TENANT_B, "target_domain": "alpha.example"},
    ]

    tenant_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A
    scope = _run(manager._tenant._tenant_restore_scope(manager._engine.database, TENANT_A, tenant_dir))
    report = _run(manager._tenant._run_tenant_restore_engine(tenant_dir, scope))

    assert report["mongo"]["takedown_requests"]["written"] == 1
    assert report["mongo"]["takedown_requests"]["skipped"] == 0
    assert sorted(document["tenant_id"] for document in collections["takedown_requests"].documents) == sorted([TENANT_A, TENANT_B])
    assert [document["target_domain"] for document in collections["takedown_requests"].documents].count("alpha.example") == 2


def test_restore_scope_covers_users_that_only_exist_in_the_backup(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    collections["db_user_account"].documents = [
        document for document in collections["db_user_account"].documents
        if document["tenant_id"] != TENANT_A
    ]

    tenant_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A
    scope = _run(manager._tenant._tenant_restore_scope(manager._engine.database, TENANT_A, tenant_dir))

    assert scope.user_ids == [USER_A]


def test_restore_tenant_missing_from_the_backup_raises_404(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    record = _make_backup_record("snapshot")
    manager._engine = _FakeTenantEngine(collections)
    _export(manager, tmp_path)

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.restore_tenant("snapshot", "507f1f77bcf86cd799439099"))

    assert exc_info.value.status_code == 404
    assert record.filename == "snapshot"


def test_restore_tenant_rolls_the_tenant_back_when_validation_fails(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    collections["cases"].documents.append({"_id": ObjectId(), "tenant_id": TENANT_A, "title": "live only"})
    live_before = [dict(document) for document in collections["cases"].documents]

    attempts = []

    async def _fail_once(_scope):
        attempts.append(1)
        return (False, "forced failure") if len(attempts) == 1 else (True, "ok")

    manager._tenant._validate_tenant_restore = _fail_once

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.restore_tenant("snapshot", TENANT_A))

    assert exc_info.value.status_code == 500
    assert "rolled back" in exc_info.value.detail
    assert sorted(document["title"] for document in collections["cases"].documents) == sorted(
        document["title"] for document in live_before
    )
    assert not manager.tenant_restore_marker.exists()
    assert not any(entry.name.startswith(CONSTANTS.RESTORE_TENANT_ROLLBACK_PREFIX) for entry in manager.backup_root.iterdir())
