from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from orion.api.interactive.backup_manager.backup_manager import BackupManager
from orion.services.mongo_manager.shared_model.db_backup_model import BackupType, db_backup_model
from tests.cases.fake_model.fakes import FakeMongoEngine
from orion.constants.constant import CONSTANTS


def _run(coro):
    return asyncio.run(coro)


def _make_manager(tmp_path: Path, engine: FakeMongoEngine) -> BackupManager:
    manager = object.__new__(BackupManager)
    manager._engine = engine
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
