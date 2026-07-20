from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from orion.api.interactive.case_manager.case_manager import CaseManager
from orion.api.interactive.case_manager.status_board_config import CaseStatusBoardConfig, CaseStatusBoardItem
from orion.api.interactive.case_manager.status_board_config import StatusBoardConfigManager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.services.mongo_manager.shared_model.db_case_model import db_case_model


def test_status_board_config_rejects_duplicate_display_names():
    with pytest.raises(ValidationError):
        CaseStatusBoardConfig(
            statuses=[
                CaseStatusBoardItem(value="new", label="New"),
                CaseStatusBoardItem(value="intake_review", label="Review"),
                CaseStatusBoardItem(value="under_investigation", label="Review"),
                CaseStatusBoardItem(value="closed", label="Closed"),
            ]
        )


@pytest.mark.anyio
async def test_update_case_status_allows_skipping_skippable_status(monkeypatch):
    manager = CaseManager.get_instance()
    record = db_case_model(
        caseId="CASE-SKIP",
        tenant_uuid="tenant-1",
        title="Skip case",
        status="new",
        createdBy="user-1",
    )
    saved = []

    class Engine:
        async def find_one(self, *_args, **_kwargs):
            return record

        async def save(self, model):
            saved.append(model)
            return model

    async def effective_config(_current_user):
        return CaseStatusBoardConfig(
            statuses=[
                CaseStatusBoardItem(value="new", label="New", enabled=True, skippable=False, order=0),
                CaseStatusBoardItem(value="intake_review", label="Intake Review", enabled=True, skippable=True, order=1),
                CaseStatusBoardItem(value="under_investigation", label="Under Investigation", enabled=True, skippable=False, order=2),
                CaseStatusBoardItem(value="closed", label="Closed", enabled=True, skippable=False, order=3),
            ]
        )

    async def to_response(updated_record, _current_user):
        return updated_record

    async def register_audit(*_args, **_kwargs):
        return None

    monkeypatch.setattr(manager, "_engine", Engine())
    monkeypatch.setattr(StatusBoardConfigManager, "get_effective_config", effective_config)
    monkeypatch.setattr(manager, "_to_response", to_response)
    monkeypatch.setattr(
        "orion.api.interactive.case_manager.case_manager.AuditLogManager.get_instance",
        staticmethod(lambda: SimpleNamespace(register=register_audit)),
    )

    current_user = SimpleNamespace(id="user-1", tenant_uuid="tenant-1", role=user_role.ADMIN, licenses=[], permissions=[])
    payload = SimpleNamespace(status="under_investigation", reason="Skip configured intake")

    updated = await manager.update_case_status("CASE-SKIP", payload, current_user)

    assert updated.status == "under_investigation"
    assert saved[0].status == "under_investigation"
    assert saved[0].statusReasons[-1].status == "under_investigation"


@pytest.mark.anyio
async def test_update_case_status_rejects_skipping_non_skippable_status(monkeypatch):
    manager = CaseManager.get_instance()
    record = db_case_model(
        caseId="CASE-NO-SKIP",
        tenant_uuid="tenant-1",
        title="No skip case",
        status="new",
        createdBy="user-1",
    )

    class Engine:
        async def find_one(self, *_args, **_kwargs):
            return record

    async def effective_config(_current_user):
        return CaseStatusBoardConfig(
            statuses=[
                CaseStatusBoardItem(value="new", label="New", enabled=True, skippable=False, order=0),
                CaseStatusBoardItem(value="intake_review", label="Intake Review", enabled=True, skippable=False, order=1),
                CaseStatusBoardItem(value="under_investigation", label="Under Investigation", enabled=True, skippable=False, order=2),
                CaseStatusBoardItem(value="closed", label="Closed", enabled=True, skippable=False, order=3),
            ]
        )

    monkeypatch.setattr(manager, "_engine", Engine())
    monkeypatch.setattr(StatusBoardConfigManager, "get_effective_config", effective_config)

    current_user = SimpleNamespace(id="user-1", tenant_uuid="tenant-1", role=user_role.ADMIN, licenses=[], permissions=[])
    payload = SimpleNamespace(status="under_investigation", reason="Invalid skip")

    with pytest.raises(HTTPException) as exc:
        await manager.update_case_status("CASE-NO-SKIP", payload, current_user)

    assert exc.value.status_code == 400
    assert exc.value.detail == "Case can only move one step forward or backward"
