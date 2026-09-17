from __future__ import annotations

import asyncio
from types import SimpleNamespace

from orion.api.interactive.scan_job_manager.scan_job_manager import ScanJobManager
from tests.model.fakes import FakeMongoEngine


def _run(coro):
    return asyncio.run(coro)


def _make_manager(engine: FakeMongoEngine) -> ScanJobManager:
    manager = object.__new__(ScanJobManager)
    manager._engine = engine
    return manager


def _make_user(**overrides):
    data = {
        "id": "507f1f77bcf86cd799439011",
        "tenant_id": "507f1f77bcf86cd799439012",
    }
    data.update(overrides)
    return SimpleNamespace(**data)
