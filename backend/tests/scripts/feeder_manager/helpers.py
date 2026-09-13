from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

from bson import ObjectId
from cryptography.fernet import Fernet

from orion.api.interactive.feeder_manager.feeder_helper import FeederHelper
from orion.api.interactive.feeder_manager.feeder_manager import FeederManager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role


def _run(coro):
    return asyncio.run(coro)


def _make_helper(parser_root: Path, engine) -> FeederHelper:
    helper = object.__new__(FeederHelper)
    helper._engine = engine
    helper._parser_root = parser_root
    helper._cipher = Fernet(Fernet.generate_key())
    return helper


def _make_manager(engine, helper: FeederHelper) -> FeederManager:
    manager = object.__new__(FeederManager)
    manager._engine = engine
    manager._helper = helper
    return manager


def _user(role=user_role.ADMIN, permissions=None, user_id="507f1f77bcf86cd799439011", username="admin", tenant="tenant-1"):
    return SimpleNamespace(
        id=ObjectId(user_id) if isinstance(user_id, str) and len(user_id) == 24 else user_id,
        username=username,
        email=f"{username}@example.com",
        tenant_uuid=tenant,
        role=role,
        permissions=permissions if permissions is not None else [],
    )


def _feeder(**overrides):
    base = dict(
        author_id="507f1f77bcf86cd799439011",
        author_name="admin",
        index_date=datetime(2026, 1, 1, tzinfo=timezone.utc),
        index_status=True,
        last_failure_date=None,
        last_failure_message=None,
        last_success_date=None,
        last_success_message=None,
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def _record(name="_script.py", rule_key="shared", entry_kind="script", url=None, values=None, feeder=None, record_id=None):
    return SimpleNamespace(
        id=ObjectId(record_id) if record_id else ObjectId(),
        name=name,
        rule_key=rule_key,
        entry_kind=entry_kind,
        url=url,
        values=values if values is not None else [],
        feeder=feeder if feeder is not None else _feeder(),
    )
