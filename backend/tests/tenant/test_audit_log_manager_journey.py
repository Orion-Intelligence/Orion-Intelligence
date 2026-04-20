from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.auditlog_manager.models.audit_log_param_model import audit_log_param_model
from orion.services.mongo_manager.shared_model.db_audit_log import db_audit_log
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, db_user_account, user_role


class _AuditEngine:
    def __init__(self, items=None):
        self.items = items or []
        self.saved = []
        self.last_find = None
        self.find_calls = []

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
        self.find_calls.append(self.last_find)
        if model is db_user_account:
            return [
                SimpleNamespace(id="507f1f77bcf86cd799439011", username="member-one", tenant_uuid="tenant-1", licenses=[], email=""),
                SimpleNamespace(id="507f1f77bcf86cd799439012", username="member-two", tenant_uuid="tenant-1", licenses=[], email=""),
                SimpleNamespace(
                    id="507f1f77bcf86cd799439013",
                    username="tenant-admin",
                    tenant_uuid="tenant-1",
                    licenses=[LicenseName.MAINTAINER],
                    email="tenant@example.com",
                ),
            ]
        return self.items

    async def find_one(self, model, query):
        if model is db_user_account:
            return SimpleNamespace(id="507f1f77bcf86cd799439011", username="member-one", tenant_uuid="tenant-1", licenses=[], email="")
        return None


def _audit_manager(engine) -> AuditLogManager:
    manager = object.__new__(AuditLogManager)
    manager._engine = engine
    return manager


def test_audit_log_manager_register_and_get_for_member_and_maintainer():
    now = datetime.now(UTC)
    member_1_id = "507f1f77bcf86cd799439011"
    member_2_id = "507f1f77bcf86cd799439012"
    admin_id = "507f1f77bcf86cd799439013"
    items = [
        db_audit_log(tenant_id="tenant-1", actor_id=member_1_id, event="User login", ts=now - timedelta(hours=1)),
        db_audit_log(tenant_id="tenant-1", actor_id=member_2_id, event="Tenant update", ts=now),
    ]
    engine = _AuditEngine(items=items)
    manager = _audit_manager(engine)

    log_id = asyncio.run(manager.register("tenant-1", member_1_id, "User login"))
    assert log_id
    assert engine.saved[0].event == "User login"

    member_out = asyncio.run(
        manager.get(
            audit_log_param_model(page=1),
            SimpleNamespace(id=member_1_id, role=user_role.MEMBER, tenant_uuid="tenant-1", licenses=[]),
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
                id=admin_id,
                role=user_role.ADMIN,
                tenant_uuid="tenant-1",
                licenses=[LicenseName.MAINTAINER],
            ),
        )
    )
    assert maintainer_out["page"] == 2
    audit_find_calls = [call for call in engine.find_calls if call["model"] is db_audit_log]
    assert audit_find_calls[-1]["skip"] == 100
    assert audit_find_calls[-1]["limit"] == 100
