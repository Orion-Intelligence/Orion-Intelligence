from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from orion.api.interactive.backup_manager.backup_job_store import BackupJobStore
from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.shared_model.db_backup_job_model import BackupJobStatus
from tests.model.fakes import FakeBackupJobCollection


def _run(coro):
    return asyncio.run(coro)


def _make_store(collection: FakeBackupJobCollection) -> BackupJobStore:
    store = object.__new__(BackupJobStore)
    store._collection = collection
    return store


def _running_document(age_seconds: int = 0) -> dict:
    updated_at = datetime.now(timezone.utc) - timedelta(seconds=age_seconds)
    return {
        "job_key": CONSTANTS.BACKUP_JOB_KEY,
        "operation": "backup",
        "status": BackupJobStatus.RUNNING.value,
        "progress": 20,
        "message": "Exporting MongoDB",
        "filename": "",
        "started_at": updated_at,
        "updated_at": updated_at,
    }
