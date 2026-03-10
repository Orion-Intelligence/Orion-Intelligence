from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.auditlog_manager.models.audit_log_param_model import audit_log_param_model
from orion.services.mongo_manager.shared_model.db_audit_log import db_audit_log
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, user_role


class _AuditEngine:
    def __init__(self, items=None):
        self.items = items or []
        self.saved = []
        self.last_find = None

    async def save(self, doc):
        self.saved.append(doc)
        return doc

    async def find(self, model, query, sort=None, skip=0, limit=100):
        self.last_find = {
            "model": model,
            "query": query,
            "sort": sort,
            "skip": skip,
            "limit": limit,
        }
        return self.items


def _audit_manager(engine) -> AuditLogManager:
    manager = object.__new__(AuditLogManager)
    manager._engine = engine
    return manager


def test_audit_log_manager_register_and_get_for_member_and_maintainer():
    now = datetime.now(UTC)
    items = [
        db_audit_log(tenant_id="tenant-1", actor_id="member-1", event="User login", ts=now - timedelta(hours=1)),
        db_audit_log(tenant_id="tenant-1", actor_id="member-2", event="Tenant update", ts=now),
    ]
    engine = _AuditEngine(items=items)
    manager = _audit_manager(engine)

    log_id = asyncio.run(manager.register("tenant-1", "member-1", "User login"))
    assert log_id
    assert engine.saved[0].event == "User login"

    member_out = asyncio.run(
        manager.get(
            audit_log_param_model(page=1),
            SimpleNamespace(id="member-1", role=user_role.MEMBER, tenant_uuid="tenant-1", licenses=[]),
        )
    )
    assert member_out["page"] == 1
    assert len(member_out["items"]) == 2
    assert engine.last_find["skip"] == 0

    maintainer_out = asyncio.run(
        manager.get(
            audit_log_param_model(
                page=2,
                daterange=f"{(now - timedelta(days=1)).isoformat()},{(now + timedelta(days=1)).isoformat()}",
            ),
            SimpleNamespace(
                id="admin-1",
                role=user_role.ADMIN,
                tenant_uuid="tenant-1",
                licenses=[LicenseName.MAINTAINER],
            ),
        )
    )
    assert maintainer_out["page"] == 2
    assert engine.last_find["skip"] == 100
    assert engine.last_find["limit"] == 100
