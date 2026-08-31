from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from bson import ObjectId

from orion.api.interactive.backup_manager.backup_manager import BackupManager
from orion.services.mongo_manager.shared_model.db_backup_job_model import BackupJobStatus
from orion.services.mongo_manager.shared_model.db_backup_model import BackupType, db_backup_model
from tests.cases.fake_model.fakes import FakeBackupJobStore, FakeMongoEngine
from orion.constants.constant import CONSTANTS


def _run(coro):
    return asyncio.run(coro)


def _make_manager(tmp_path: Path, engine: FakeMongoEngine, job_store: FakeBackupJobStore | None = None) -> BackupManager:
    manager = object.__new__(BackupManager)
    manager._engine = engine
    manager._job_store = job_store or FakeBackupJobStore()
    manager.backup_root = tmp_path / "backups"
    manager.maintenance_flag = tmp_path / "static" / ".maintenance"
    manager.backup_root.mkdir(parents=True, exist_ok=True)
    return manager


def _make_backup_record(filename: str, backup_type: BackupType = BackupType.INSTANT) -> db_backup_model:
    return db_backup_model(filename=filename, backup_type=backup_type, created_at=datetime.now(timezone.utc))


def _stub_perform_backup(manager: BackupManager, calls: list[Path] | None = None):
    async def _perform(backup_dir: Path):
        backup_dir.mkdir(parents=True, exist_ok=True)
        mongo_dir = backup_dir / "mongo"
        mongo_dir.mkdir(parents=True, exist_ok=True)
        (mongo_dir / "placeholder.json").write_text("[]", encoding="utf-8")
        if calls is not None:
            calls.append(backup_dir)

    manager._perform_backup = _perform


def _seed_backup_dir(manager: BackupManager, filename: str, with_mongo_data: bool = True) -> Path:
    backup_dir = manager.backup_root / filename
    mongo_dir = backup_dir / "mongo"
    mongo_dir.mkdir(parents=True, exist_ok=True)
    if with_mongo_data:
        (mongo_dir / "db_user_account.json").write_text("[]", encoding="utf-8")
    return backup_dir


def test_create_backup_saves_record_and_writes_backup_dir(tmp_path):
    engine = FakeMongoEngine()
    manager = _make_manager(tmp_path, engine)
    _stub_perform_backup(manager)

    result = _run(manager.create_backup(BackupType.INSTANT))

    assert result["backup_type"] == "instant"
    assert len(engine.saved) == 1
    saved = engine.saved[0]
    assert saved.filename == result["filename"]
    assert (manager.backup_root / saved.filename / "mongo").is_dir()


def test_create_backup_under_limit_does_not_delete_anything(tmp_path):
    records = []
    for i in range(CONSTANTS.MAX_BACKUPS - 1):
        filename = f"2026_01_0{i + 1}_00_00_00"
        (tmp_path / "backups" / filename / "mongo").mkdir(parents=True, exist_ok=True)
        records.append(_make_backup_record(filename))
    engine = FakeMongoEngine(records=records)
    manager = _make_manager(tmp_path, engine)
    _stub_perform_backup(manager)

    result = _run(manager.create_backup(BackupType.INSTANT))

    assert engine.deleted == []
    assert engine.saved[-1].filename == result["filename"]


def test_create_backup_at_limit_deletes_oldest_from_disk_and_db(tmp_path):
    records = []
    for i in range(CONSTANTS.MAX_BACKUPS):
        filename = f"2026_01_0{i + 1}_00_00_00"
        (tmp_path / "backups" / filename / "mongo").mkdir(parents=True, exist_ok=True)
        records.append(_make_backup_record(filename))
    oldest = records[0]
    engine = FakeMongoEngine(records=list(records))
    manager = _make_manager(tmp_path, engine)
    _stub_perform_backup(manager)

    result = _run(manager.create_backup(BackupType.AUTO))

    assert engine.deleted == [oldest]
    assert not (manager.backup_root / oldest.filename).exists()
    assert result["filename"] not in [record.filename for record in records]
    assert engine.saved[-1].filename == result["filename"]


def test_create_backup_cleans_up_directory_and_raises_on_failure(tmp_path):
    engine = FakeMongoEngine()
    manager = _make_manager(tmp_path, engine)

    async def _fail(backup_dir: Path):
        backup_dir.mkdir(parents=True, exist_ok=True)
        raise RuntimeError("mongo dump failed")

    manager._perform_backup = _fail

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.create_backup(BackupType.INSTANT))

    assert exc_info.value.status_code == 500
    assert "Backup failed" in exc_info.value.detail
    assert engine.saved == []
    assert list(manager.backup_root.iterdir()) == []


def test_delete_backup_invalid_id_raises_404(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.delete_backup("not-an-object-id"))

    assert exc_info.value.status_code == 404


def test_delete_backup_not_found_raises_404(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.delete_backup("507f1f77bcf86cd799439011"))

    assert exc_info.value.status_code == 404


def test_delete_backup_removes_folder_and_record(tmp_path):
    record = _make_backup_record("2026_01_01_00_00_00")
    (tmp_path / "backups" / record.filename).mkdir(parents=True, exist_ok=True)
    engine = FakeMongoEngine(records=[record])
    manager = _make_manager(tmp_path, engine)

    result = _run(manager.delete_backup(str(record.id)))

    assert result == {"status": "deleted"}
    assert engine.deleted == [record]
    assert not (manager.backup_root / record.filename).exists()


def test_restore_backup_missing_folder_raises_404(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.restore_backup("does_not_exist"))

    assert exc_info.value.status_code == 404


def test_restore_backup_empty_mongo_dir_raises_404_and_skips_maintenance(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())
    _seed_backup_dir(manager, "2026_01_01_00_00_00", with_mongo_data=False)

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.restore_backup("2026_01_01_00_00_00"))

    assert exc_info.value.status_code == 404
    assert not manager.maintenance_flag.exists()


def test_restore_backup_success_runs_engine_and_clears_maintenance(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())
    _seed_backup_dir(manager, "2026_01_01_00_00_00")
    _stub_perform_backup(manager)

    engine_calls: list[Path] = []

    async def fake_run_restore_engine(source_dir: Path):
        engine_calls.append(source_dir)

    async def fake_validate_restore():
        return True, "ok"

    manager._run_restore_engine = fake_run_restore_engine
    manager._validate_restore = fake_validate_restore

    result = _run(manager.restore_backup("2026_01_01_00_00_00", source="cli"))

    assert result == {"status": "restored", "filename": "2026_01_01_00_00_00"}
    assert engine_calls == [manager.backup_root / "2026_01_01_00_00_00"]
    assert not manager.maintenance_flag.exists()
    assert list(manager.backup_root.iterdir()) == [manager.backup_root / "2026_01_01_00_00_00"]


def test_restore_backup_failure_triggers_successful_rollback(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())
    _seed_backup_dir(manager, "2026_01_02_00_00_00")
    _stub_perform_backup(manager)

    call_count = {"n": 0}

    async def fake_run_restore_engine(source_dir: Path):
        call_count["n"] += 1
        if call_count["n"] == 1:
            raise RuntimeError("mongo restore exploded")

    async def fake_validate_restore():
        return True, "ok"

    manager._run_restore_engine = fake_run_restore_engine
    manager._validate_restore = fake_validate_restore

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.restore_backup("2026_01_02_00_00_00"))

    assert exc_info.value.status_code == 500
    assert "rolled back" in exc_info.value.detail
    assert call_count["n"] == 2
    assert not manager.maintenance_flag.exists()
    assert list(manager.backup_root.iterdir()) == [manager.backup_root / "2026_01_02_00_00_00"]


def test_restore_backup_failure_and_rollback_failure_leaves_maintenance_enabled(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())
    _seed_backup_dir(manager, "2026_01_03_00_00_00")
    _stub_perform_backup(manager)

    async def fake_run_restore_engine(source_dir: Path):
        raise RuntimeError("always fails")

    manager._run_restore_engine = fake_run_restore_engine

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.restore_backup("2026_01_03_00_00_00"))

    assert exc_info.value.status_code == 500
    assert "Manual intervention required" in exc_info.value.detail
    assert manager.maintenance_flag.exists()
    remaining = {path.name for path in manager.backup_root.iterdir()}
    assert "2026_01_03_00_00_00" in remaining
    assert any(name.startswith("rollback_") for name in remaining)


def test_restore_backup_rollback_creation_failure_disables_maintenance(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())
    _seed_backup_dir(manager, "2026_01_04_00_00_00")

    async def fail_perform_backup(backup_dir: Path):
        raise RuntimeError("disk full")

    manager._perform_backup = fail_perform_backup

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.restore_backup("2026_01_04_00_00_00"))

    assert exc_info.value.status_code == 500
    assert "could not create rollback point" in exc_info.value.detail
    assert not manager.maintenance_flag.exists()


def test_restore_backup_by_id_invalid_id_raises_404(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.restore_backup_by_id("not-an-object-id"))

    assert exc_info.value.status_code == 404


def test_restore_backup_by_id_not_found_raises_404(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())

    with pytest.raises(HTTPException) as exc_info:
        _run(manager.restore_backup_by_id("507f1f77bcf86cd799439011"))

    assert exc_info.value.status_code == 404


def test_restore_backup_by_id_delegates_to_restore_backup(tmp_path):
    record = _make_backup_record("2026_01_05_00_00_00")
    engine = FakeMongoEngine(records=[record])
    manager = _make_manager(tmp_path, engine)

    calls = []

    async def fake_restore_backup(filename, source="cli"):
        calls.append((filename, source))
        return {"status": "restored", "filename": filename}

    manager.restore_backup = fake_restore_backup

    result = _run(manager.restore_backup_by_id(str(record.id)))

    assert calls == [(record.filename, "ui")]
    assert result == {"status": "restored", "filename": record.filename}


class _FakeCollection:
    def __init__(self):
        self.deleted = 0
        self.inserted: list = []

    async def delete_many(self, _query):
        self.deleted += 1

    async def insert_many(self, documents):
        self.inserted.extend(documents)


class _FakeDatabase:
    def __init__(self):
        self.collections: dict[str, _FakeCollection] = {}

    def __getitem__(self, name):
        return self.collections.setdefault(name, _FakeCollection())


class _FakeEngineWithDatabase:
    def __init__(self):
        self.database = _FakeDatabase()

    def get_collection(self, _model):
        return SimpleNamespace(name="db_backup_model")


def test_restore_mongo_skips_catalog_collection(tmp_path):
    manager = _make_manager(tmp_path, FakeMongoEngine())
    manager._engine = _FakeEngineWithDatabase()

    source_dir = tmp_path / "source" / "mongo"
    source_dir.mkdir(parents=True)
    (source_dir / "db_backup_model.json").write_text("[]", encoding="utf-8")
    (source_dir / "db_user_account.json").write_text("[]", encoding="utf-8")

    _run(manager._restore_mongo(source_dir))

    assert "db_backup_model" not in manager._engine.database.collections
    assert "db_user_account" in manager._engine.database.collections
    assert manager._engine.database.collections["db_user_account"].deleted == 1


class _FakeCursor:
    def __init__(self, documents):
        self._documents = list(documents)

    def __aiter__(self):
        return self._iterate()

    async def _iterate(self):
        for document in self._documents:
            yield document


class _FakeStreamingCollection:
    def __init__(self, documents=None):
        self.documents = list(documents or [])
        self.deleted = 0
        self.inserted_batches: list[list] = []

    def find(self, _query, batch_size=None):
        return _FakeCursor(self.documents)

    async def delete_many(self, _query):
        self.deleted += 1

    async def insert_many(self, documents):
        self.inserted_batches.append(list(documents))


class _FakeStreamingDatabase:
    def __init__(self, collections):
        self.collections = collections

    def __getitem__(self, name):
        return self.collections.setdefault(name, _FakeStreamingCollection())

    async def list_collection_names(self):
        return list(self.collections.keys())


class _FakeStreamingEngine:
    def __init__(self, collections):
        self.database = _FakeStreamingDatabase(collections)

    def get_collection(self, _model):
        return SimpleNamespace(name="db_backup_model")


def test_backup_mongo_writes_one_ndjson_line_per_document(tmp_path):
    collections = {
        "db_user_account": _FakeStreamingCollection([{"_id": ObjectId(), "name": f"user-{index}"} for index in range(5)]),
        "db_tenant_model": _FakeStreamingCollection([{"_id": ObjectId(), "title": "tenant"}]),
    }
    manager = _make_manager(tmp_path, FakeMongoEngine())
    manager._engine = _FakeStreamingEngine(collections)
    output_dir = tmp_path / "dump" / "mongo"

    _run(manager._backup_mongo(output_dir))

    assert len((output_dir / "db_user_account.ndjson").read_text(encoding="utf-8").splitlines()) == 5
    assert len((output_dir / "db_tenant_model.ndjson").read_text(encoding="utf-8").splitlines()) == 1


def test_backup_mongo_reports_progress_for_every_collection(tmp_path):
    collections = {name: _FakeStreamingCollection([{"value": name}]) for name in ("alpha", "beta", "gamma", "delta")}
    manager = _make_manager(tmp_path, FakeMongoEngine())
    manager._engine = _FakeStreamingEngine(collections)
    reported: list[float] = []

    async def report(fraction: float):
        reported.append(fraction)

    _run(manager._backup_mongo(tmp_path / "dump" / "mongo", report))

    assert reported == [0.25, 0.5, 0.75, 1.0]


def test_dump_and_read_documents_round_trip_preserves_bson_types(tmp_path):
    document_id = ObjectId()
    created_at = datetime(2026, 3, 26, 10, 30, tzinfo=timezone.utc)
    collections = {"db_user_account": _FakeStreamingCollection([{"_id": document_id, "created_at": created_at}])}
    manager = _make_manager(tmp_path, FakeMongoEngine())
    manager._engine = _FakeStreamingEngine(collections)
    path = tmp_path / "db_user_account.ndjson"

    _run(manager._dump_collection(manager._engine.database, "db_user_account", path))

    async def collect():
        return [batch async for batch in manager._read_documents(path)]

    batches = _run(collect())

    assert batches == [[{"_id": document_id, "created_at": created_at.replace(tzinfo=None)}]]


def test_read_documents_streams_ndjson_in_batches(tmp_path, monkeypatch):
    monkeypatch.setattr(CONSTANTS, "BACKUP_BATCH_SIZE", 2)
    path = tmp_path / "db_user_account.ndjson"
    path.write_text("".join(f'{{"index": {index}}}\n' for index in range(5)), encoding="utf-8")
    manager = _make_manager(tmp_path, FakeMongoEngine())

    async def collect():
        return [batch async for batch in manager._read_documents(path)]

    batches = _run(collect())

    assert [len(batch) for batch in batches] == [2, 2, 1]
    assert batches[0] == [{"index": 0}, {"index": 1}]


def test_read_documents_still_reads_legacy_json_array_dumps(tmp_path, monkeypatch):
    monkeypatch.setattr(CONSTANTS, "BACKUP_BATCH_SIZE", 2)
    path = tmp_path / "db_user_account.json"
    path.write_text('[{"index": 0}, {"index": 1}, {"index": 2}]', encoding="utf-8")
    manager = _make_manager(tmp_path, FakeMongoEngine())

    async def collect():
        return [batch async for batch in manager._read_documents(path)]

    batches = _run(collect())

    assert [len(batch) for batch in batches] == [2, 1]


def test_restore_mongo_inserts_in_batches_and_prefers_ndjson_over_legacy_json(tmp_path, monkeypatch):
    monkeypatch.setattr(CONSTANTS, "BACKUP_BATCH_SIZE", 2)
    source_dir = tmp_path / "source" / "mongo"
    source_dir.mkdir(parents=True)
    (source_dir / "db_user_account.json").write_text('[{"stale": true}]', encoding="utf-8")
    (source_dir / "db_user_account.ndjson").write_text("".join(f'{{"index": {index}}}\n' for index in range(3)), encoding="utf-8")
    (source_dir / "db_backup_model.ndjson").write_text('{"index": 0}\n', encoding="utf-8")

    collections: dict[str, _FakeStreamingCollection] = {}
    manager = _make_manager(tmp_path, FakeMongoEngine())
    manager._engine = _FakeStreamingEngine(collections)

    _run(manager._restore_mongo(source_dir))

    assert "db_backup_model" not in collections
    account = collections["db_user_account"]
    assert account.deleted == 1
    assert [len(batch) for batch in account.inserted_batches] == [2, 1]
    assert account.inserted_batches[0] == [{"index": 0}, {"index": 1}]


def test_iter_documents_batches_ndjson_and_legacy_arango_dumps(tmp_path, monkeypatch):
    monkeypatch.setattr(CONSTANTS, "BACKUP_BATCH_SIZE", 2)
    manager = _make_manager(tmp_path, FakeMongoEngine())

    ndjson_path = tmp_path / "edges.ndjson"
    ndjson_path.write_text("".join(f'{{"index": {index}}}\n' for index in range(3)), encoding="utf-8")
    json_path = tmp_path / "edges.json"
    json_path.write_text('[{"index": 0}, {"index": 1}, {"index": 2}]', encoding="utf-8")

    assert [len(batch) for batch in manager._iter_documents(ndjson_path)] == [2, 1]
    assert [len(batch) for batch in manager._iter_documents(json_path)] == [2, 1]


def test_read_hits_returns_bulk_actions_up_to_the_batch_limit(tmp_path):
    path = tmp_path / "index.ndjson"
    path.write_text("".join(f'{{"_id": "{index}", "_source": {{"index": {index}}}}}\n' for index in range(3)), encoding="utf-8")
    manager = _make_manager(tmp_path, FakeMongoEngine())

    with path.open("r", encoding="utf-8") as handle:
        first = manager._read_hits(handle, "orion_index", 2)
        second = manager._read_hits(handle, "orion_index", 2)
        third = manager._read_hits(handle, "orion_index", 2)

    assert [len(first), len(second), len(third)] == [2, 1, 0]
    assert first[0] == {"_op_type": "index", "_index": "orion_index", "_id": "0", "_source": {"index": 0}}


def test_run_backup_now_skips_when_another_job_holds_the_lock(tmp_path):
    job_store = FakeBackupJobStore(can_begin=False)
    manager = _make_manager(tmp_path, FakeMongoEngine(), job_store)
    calls: list[Path] = []
    _stub_perform_backup(manager, calls)

    assert _run(manager.run_backup_now(BackupType.AUTO)) is False
    assert calls == []
    assert job_store.finished == []


def test_run_backup_now_marks_the_shared_job_done(tmp_path):
    job_store = FakeBackupJobStore()
    engine = FakeMongoEngine()
    manager = _make_manager(tmp_path, engine, job_store)
    _stub_perform_backup(manager)

    assert _run(manager.run_backup_now(BackupType.AUTO)) is True

    status, message, filename = job_store.finished[0]
    assert status == BackupJobStatus.DONE
    assert message == "Backup completed successfully"
    assert filename == engine.saved[-1].filename


def test_run_backup_now_marks_the_shared_job_failed(tmp_path):
    job_store = FakeBackupJobStore()
    manager = _make_manager(tmp_path, FakeMongoEngine(), job_store)

    async def _fail(backup_dir: Path):
        raise RuntimeError("disk full")

    manager._perform_backup = _fail

    assert _run(manager.run_backup_now(BackupType.AUTO)) is True

    status, message, filename = job_store.finished[0]
    assert status == BackupJobStatus.FAILED
    assert "disk full" in message
    assert filename == ""


def test_perform_backup_publishes_progress_across_the_window(tmp_path):
    job_store = FakeBackupJobStore()
    manager = _make_manager(tmp_path, FakeMongoEngine(), job_store)
    manager._progress_window = (0, 90)

    async def fake_backup_mongo(output_dir: Path, report=None):
        if report is not None:
            await report(1.0)

    async def fake_backup_elastic(output_dir: Path):
        return None

    manager._backup_mongo = fake_backup_mongo
    manager._backup_elastic = fake_backup_elastic
    manager._backup_arango = lambda output_dir: None
    manager._copy_folder = lambda source, destination: None

    _run(manager._perform_backup(tmp_path / "backups" / "2026_01_01_00_00_00"))

    values = [progress for progress, _ in job_store.progressed]
    assert values[0] == 0
    assert values[-1] == 90
    assert values == sorted(values)
    assert [message for _, message in job_store.progressed][-1] == "Finalizing"
