from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

from orion.api.interactive.backup_manager.backup_manager import BackupManager
from orion.services.mongo_manager.shared_model.db_backup_model import BackupType, db_backup_model
from tests.model.fakes import FakeBackupJobStore, FakeMongoEngine


def _run(coro):
    return asyncio.run(coro)


def _make_manager(tmp_path: Path, engine: FakeMongoEngine, job_store: FakeBackupJobStore | None = None) -> BackupManager:
    manager = object.__new__(BackupManager)
    engine.append_on_save = True
    manager._engine = engine
    manager._job_store = job_store or FakeBackupJobStore()
    manager.backup_root = tmp_path / "backups"
    manager.maintenance_flag = tmp_path / "static" / ".maintenance"
    manager.backup_root.mkdir(parents=True, exist_ok=True)
    return manager


def _make_backup_record(filename: str, backup_type: BackupType = BackupType.INSTANT) -> db_backup_model:
    return db_backup_model(filename=filename, backup_type=backup_type, created_at=datetime.now(timezone.utc))


def _stub_perform_backup(manager: BackupManager, calls: list[Path] | None = None):
    async def _perform(backup_dir: Path, window=(0, 90)):
        backup_dir.mkdir(parents=True, exist_ok=True)
        mongo_dir = backup_dir / "mongo"
        mongo_dir.mkdir(parents=True, exist_ok=True)
        (mongo_dir / "placeholder.json").write_text("[]", encoding="utf-8")
        (backup_dir / "manifest.json").write_text('{"version": 1, "completed": true}', encoding="utf-8")
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


def _use_elastic(monkeypatch, connection):
    monkeypatch.setattr(
        "orion.api.interactive.backup_manager.backup_manager.elastic_controller.get_instance",
        staticmethod(lambda: SimpleNamespace(get_connection=lambda: connection)),
    )

    async def fake_async_bulk(client, actions, **_kwargs):
        collected = list(actions)
        connection.bulked.extend(collected)
        return len(collected), []

    monkeypatch.setattr("orion.api.interactive.backup_manager.backup_manager.es_helpers.async_bulk", fake_async_bulk)


def _use_arango(monkeypatch, database):
    monkeypatch.setattr(
        "orion.api.interactive.backup_manager.backup_manager.arango_controller.get_instance",
        staticmethod(lambda: SimpleNamespace(get_db=lambda: database)),
    )
