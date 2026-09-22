from __future__ import annotations

import io
import zipfile
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi import HTTPException

from orion.api.interactive.backup_manager.backup_report import REPORT_NAME, BackupReport
from orion.api.interactive.backup_manager.backup_store_io import BackupStoreIO
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
            {"_id": ObjectId(USER_A), "tenant_id": TENANT_A, "username": "alpha-admin", "licenses": ["maintainer"]},
            {"_id": ObjectId(USER_B), "tenant_id": TENANT_B, "username": "beta-admin", "licenses": ["maintainer"]},
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


def test_restore_never_writes_archive_rows_that_belong_to_another_tenant(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    mongo_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A / CONSTANTS.BACKUP_TENANT_MONGO_DIR
    with (mongo_dir / "db_user_account.ndjson").open("a", encoding="utf-8") as handle:
        handle.write('{"_id": {"$oid": "607f1f77bcf86cd799439099"}, "tenant_id": "%s", "username": "backdoor", "role": "admin"}\n' % TENANT_B)
        handle.write('{"_id": {"$oid": "%s"}, "tenant_id": "%s", "username": "beta-admin"}\n' % (USER_B, TENANT_A))
    with (mongo_dir / "social.ndjson").open("a", encoding="utf-8") as handle:
        handle.write('{"_id": {"$oid": "707f1f77bcf86cd799439099"}, "user_id": "%s", "handle": "planted"}\n' % USER_B)

    tenant_dir = mongo_dir.parent
    scope = _run(manager._tenant._tenant_restore_scope(manager._engine.database, TENANT_A, tenant_dir))
    assert scope.user_ids == [USER_A]
    report = _run(manager._tenant._run_tenant_restore_engine(tenant_dir, scope))

    assert [document["username"] for document in collections["db_user_account"].documents if document["tenant_id"] == TENANT_B] == ["beta-admin"]
    assert "backdoor" not in [document["username"] for document in collections["db_user_account"].documents]
    assert [document["handle"] for document in collections["social"].documents] == ["beta", "alpha"]
    assert report["mongo"]["db_user_account"]["skipped"] == 2
    assert report["mongo"]["social"]["skipped"] == 1


def test_restore_rejects_a_nested_child_folder_the_tenant_does_not_own(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    backup_dir = tmp_path / "backups" / "snapshot"
    tenants_dir = backup_dir / CONSTANTS.BACKUP_TENANTS_DIR
    (tenants_dir / TENANT_A / CONSTANTS.BACKUP_TENANTS_DIR).mkdir()
    (tenants_dir / TENANT_B).rename(tenants_dir / TENANT_A / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_B)
    beta_users_before = [dict(document) for document in collections["db_user_account"].documents if document["tenant_id"] == TENANT_B]

    with pytest.raises(HTTPException) as exc:
        _run(manager._tenant.restore_tenant("snapshot", TENANT_A))

    assert exc.value.status_code == 403
    assert [document for document in collections["db_user_account"].documents if document["tenant_id"] == TENANT_B] == beta_users_before


class _Upload:
    def __init__(self, data: bytes):
        self._buffer = io.BytesIO(data)

    async def read(self, size: int) -> bytes:
        return self._buffer.read(size)

    async def close(self) -> None:
        return None


def _exported_bytes(manager, tmp_path):
    tenant_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A
    report = BackupReport.render_export({"backup": "snapshot", "created_at": "2026-09-21", "exported_at": "2026-09-21", "tenants": [{"tenant_id": TENANT_A, "slug": "alpha", "users": 1, "mongo": {"cases": 1}, "elastic": {}, "files": 0}]})
    return b"".join(BackupStoreIO.iter_export(tenant_dir, f"snapshot_{TENANT_A}", report))


def test_export_is_a_static_summary_plus_an_opaque_payload(tmp_path, monkeypatch):
    manager = _make_tenant_manager(tmp_path, _collections(), monkeypatch)
    _export(manager, tmp_path)
    with zipfile.ZipFile(io.BytesIO(_exported_bytes(manager, tmp_path))) as outer:
        names = sorted(entry.rsplit("/", 1)[-1] for entry in outer.namelist())
        page = outer.read(f"snapshot_{TENANT_A}/{REPORT_NAME}").decode("utf-8")
        payload = outer.read(f"snapshot_{TENANT_A}/{CONSTANTS.BACKUP_EXPORT_PAYLOAD_NAME}")
    assert names == sorted([CONSTANTS.BACKUP_EXPORT_PAYLOAD_NAME, REPORT_NAME])
    assert "alpha" in page and "<script" not in page and "fetch(" not in page
    assert b"alpha-admin" not in payload and b".ndjson" not in payload


def test_import_accepts_only_an_untouched_export_from_this_server(tmp_path, monkeypatch):
    manager = _make_tenant_manager(tmp_path, _collections(), monkeypatch)
    _export(manager, tmp_path)
    exported = _exported_bytes(manager, tmp_path)

    tenant_id, document = _run(manager._tenant._stage_tenant_import(_Upload(exported), tmp_path / "stage_ok"))
    assert tenant_id == TENANT_A
    assert document["slug"] == "alpha"
    assert (tmp_path / "stage_ok" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A / CONSTANTS.BACKUP_TENANT_MONGO_DIR / "db_user_account.ndjson").is_file()

    with zipfile.ZipFile(io.BytesIO(exported)) as outer:
        sealed = bytearray(outer.read(f"snapshot_{TENANT_A}/{CONSTANTS.BACKUP_EXPORT_PAYLOAD_NAME}"))
    sealed[-1] ^= 0x01
    tampered = io.BytesIO()
    with zipfile.ZipFile(tampered, "w") as outer:
        outer.writestr(f"x/{CONSTANTS.BACKUP_EXPORT_PAYLOAD_NAME}", bytes(sealed))
    with pytest.raises(HTTPException) as exc:
        _run(manager._tenant._stage_tenant_import(_Upload(tampered.getvalue()), tmp_path / "stage_tampered"))
    assert exc.value.status_code == 422

    plain = b"".join(BackupStoreIO.iter_zip(tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A, "old"))
    with pytest.raises(HTTPException) as exc:
        _run(manager._tenant._stage_tenant_import(_Upload(plain), tmp_path / "stage_plain"))
    assert exc.value.status_code == 422


def test_import_takes_the_job_lock_before_staging_and_answers_409_when_busy(tmp_path, monkeypatch):
    manager = _make_tenant_manager(tmp_path, _collections(), monkeypatch)
    _export(manager, tmp_path)
    manager._job_store.can_begin = False

    with pytest.raises(HTTPException) as exc:
        _run(manager._tenant.start_tenant_import(_Upload(_exported_bytes(manager, tmp_path)), TENANT_A))

    assert exc.value.status_code == 409
    assert not any(entry.name.startswith(CONSTANTS.IMPORT_TENANT_STAGE_PREFIX) for entry in manager.backup_root.iterdir())


def test_import_releases_the_job_lock_when_staging_is_rejected(tmp_path, monkeypatch):
    manager = _make_tenant_manager(tmp_path, _collections(), monkeypatch)
    _export(manager, tmp_path)

    with pytest.raises(HTTPException) as exc:
        _run(manager._tenant.start_tenant_import(_Upload(_exported_bytes(manager, tmp_path)), TENANT_B))

    assert exc.value.status_code == 403
    assert manager._job_store.begun and manager._job_store.finished
    assert not any(entry.name.startswith(CONSTANTS.IMPORT_TENANT_STAGE_PREFIX) for entry in manager.backup_root.iterdir())


def test_import_rejects_an_archive_that_inflates_too_much(tmp_path, monkeypatch):
    manager = _make_tenant_manager(tmp_path, _collections(), monkeypatch)
    monkeypatch.setattr(CONSTANTS, "BACKUP_IMPORT_MAX_INFLATION", 2)
    bomb = tmp_path / "bomb.zip"
    with zipfile.ZipFile(bomb, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("x/mongo/db_tenant_model.ndjson", b"0" * (4 * 1024 * 1024))

    (tmp_path / "unpacked").mkdir()
    with pytest.raises(HTTPException) as exc:
        manager._tenant._extract_archive(bomb, tmp_path / "unpacked")

    assert exc.value.status_code == 413
    assert not (tmp_path / "unpacked" / "x").exists()


def test_restore_keeps_admin_owned_tenant_fields_from_the_live_record(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    tenant_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A
    tenant_file = tenant_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR / "db_tenant_model.ndjson"
    tenant_file.write_text('{"_id": {"$oid": "%s"}, "name": "Alpha", "slug": "root", "user_quota": 500, "is_default": true, "is_primary": true, "status": "active"}\n' % TENANT_A, encoding="utf-8")
    live = next(document for document in collections["db_tenant_model"].documents if document["_id"] == ObjectId(TENANT_A))
    live.update({"user_quota": 5, "is_default": False, "is_primary": False, "status": "disable"})

    scope = _run(manager._tenant._tenant_restore_scope(manager._engine.database, TENANT_A, tenant_dir))
    _run(manager._tenant._run_tenant_restore_engine(tenant_dir, scope))

    restored = next(document for document in collections["db_tenant_model"].documents if document["_id"] == ObjectId(TENANT_A))
    assert (restored["slug"], restored["user_quota"], restored["is_default"], restored["is_primary"], restored["status"]) == ("alpha", 5, False, False, "disable")

    collections["db_tenant_model"].documents = [document for document in collections["db_tenant_model"].documents if document["_id"] != ObjectId(TENANT_A)]
    _run(manager._tenant._run_tenant_restore_engine(tenant_dir, scope))
    recreated = next(document for document in collections["db_tenant_model"].documents if document["_id"] == ObjectId(TENANT_A))
    assert recreated["is_default"] is False and recreated["user_quota"] == 500


def test_elastic_restore_writes_only_this_tenants_hits_without_overwriting(tmp_path, monkeypatch):
    manager = _make_tenant_manager(tmp_path, _collections(), monkeypatch)
    source_dir = tmp_path / "elastic"
    source_dir.mkdir()
    index_name = next(iter(CONSTANTS.BACKUP_TENANT_ELASTIC_INDICES))
    (source_dir / f"{index_name}.ndjson").write_text(
        '{"_id": "own", "_source": {"tenant_id": "%s", "title": "mine"}}\n{"_id": "theirs", "_source": {"tenant_id": "%s", "title": "planted"}}\n' % (TENANT_A, TENANT_B),
        encoding="utf-8",
    )
    calls = {}

    class _Indices:
        async def exists(self, index):
            return True

        async def refresh(self, index):
            return None

    class _Conn:
        indices = _Indices()

        async def delete_by_query(self, **kwargs):
            calls["deleted"] = kwargs["body"]

    async def fake_bulk(conn, actions, **kwargs):
        calls["actions"] = list(actions)
        return len(calls["actions"]), 0

    monkeypatch.setattr("orion.api.interactive.backup_manager.tenant_backup_manager.elastic_controller.get_instance", staticmethod(lambda: SimpleNamespace(get_connection=lambda: _Conn())))
    monkeypatch.setattr("orion.api.interactive.backup_manager.tenant_backup_manager.es_helpers.async_bulk", fake_bulk)

    report = _run(manager._tenant._restore_tenant_elastic(source_dir, TENANT_A))

    assert calls["deleted"] == {"query": {"term": {"tenant_id": TENANT_A}}}
    assert [action["_id"] for action in calls["actions"]] == ["own"]
    assert calls["actions"][0]["_op_type"] == "create"
    assert report[index_name] == 1


def test_restore_fences_the_tenant_before_the_rollback_snapshot_and_releases_on_failure(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    seen = {}
    original = manager._tenant._export_tenant

    async def failing_export(tenant_dir, scope, owned, layout=None):
        from orion.api.interactive.backup_manager.maintenance_state import maintenance_state
        seen["fenced_during_snapshot"] = maintenance_state.get_instance().is_tenant_fenced(TENANT_A)
        raise RuntimeError("disk full")

    monkeypatch.setattr(manager._tenant, "_export_tenant", failing_export)
    with pytest.raises(HTTPException) as exc:
        _run(manager._tenant.restore_tenant("snapshot", TENANT_A))

    from orion.api.interactive.backup_manager.maintenance_state import maintenance_state
    assert exc.value.status_code == 500
    assert seen["fenced_during_snapshot"] is True
    assert maintenance_state.get_instance().is_tenant_fenced(TENANT_A) is False
    monkeypatch.setattr(manager._tenant, "_export_tenant", original)


def test_restore_of_a_primary_does_not_resurrect_a_secondary_deleted_since(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    for document in collections["db_tenant_model"].documents:
        if document["_id"] == ObjectId(TENANT_B):
            document["parent_tenant_id"] = TENANT_A
    _export(manager, tmp_path)
    tenants_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR
    assert (tenants_dir / TENANT_A / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_B).is_dir()
    collections["db_tenant_model"].documents = [document for document in collections["db_tenant_model"].documents if document["_id"] != ObjectId(TENANT_B)]
    collections["db_user_account"].documents = [document for document in collections["db_user_account"].documents if document["tenant_id"] != TENANT_B]

    result = _run(manager._tenant.restore_tenant("snapshot", TENANT_A))

    assert result["sub_tenants"] == []
    assert [document["_id"] for document in collections["db_tenant_model"].documents] == [ObjectId(TENANT_A)]
    assert all(document["tenant_id"] != TENANT_B for document in collections["db_user_account"].documents)


def test_restore_leaves_out_a_user_whose_username_now_belongs_to_another_tenant(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    collections["db_user_account"].documents = [document for document in collections["db_user_account"].documents if document["tenant_id"] != TENANT_A]
    collections["db_user_account"].documents.append({"_id": ObjectId(), "tenant_id": TENANT_B, "username": "alpha-admin"})

    tenant_dir = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A
    scope = _run(manager._tenant._tenant_restore_scope(manager._engine.database, TENANT_A, tenant_dir))
    report = _run(manager._tenant._run_tenant_restore_engine(tenant_dir, scope))

    owners = [document["tenant_id"] for document in collections["db_user_account"].documents if document["username"] == "alpha-admin"]
    assert owners == [TENANT_B]
    assert report["mongo"]["db_user_account"] == {"removed": 0, "written": 0, "skipped": 1}


def test_restore_rolls_back_an_archive_that_would_leave_the_tenant_without_a_maintainer(tmp_path, monkeypatch):
    collections = _collections()
    manager = _make_tenant_manager(tmp_path, collections, monkeypatch)
    _export(manager, tmp_path)
    user_file = tmp_path / "backups" / "snapshot" / CONSTANTS.BACKUP_TENANTS_DIR / TENANT_A / CONSTANTS.BACKUP_TENANT_MONGO_DIR / "db_user_account.ndjson"
    user_file.write_text("", encoding="utf-8")

    with pytest.raises(HTTPException) as exc:
        _run(manager._tenant.restore_tenant("snapshot", TENANT_A))

    assert "no maintainer" in exc.value.detail
    assert [document["username"] for document in collections["db_user_account"].documents if document["tenant_id"] == TENANT_A] == ["alpha-admin"]
    assert not manager.tenant_restore_marker.exists()
