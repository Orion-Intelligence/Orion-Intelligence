from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace

from cryptography.fernet import Fernet

import orion.api.interactive.case_manager.case_manager as case_module
from orion.api.interactive.case_manager.case_manager import CaseManager
from orion.api.interactive.case_manager.models.case_models import (
    CaseClosureModel,
    CaseCommentModel,
    CaseEntityModel,
    CaseLinkModel,
    CaseTaskModel,
    CreateCaseRequest,
    UpdateCaseRequest,
)
from orion.services.mongo_manager.shared_model.db_auth_models import (
    LicenseName,
    UserStatus,
    user_role,
)
from orion.services.mongo_manager.shared_model.db_case_model import (
    ArtifactType,
    CaseArtifact,
    CaseArtifactFile,
    CaseClosure,
    CaseComment,
    CaseCommunication,
    CaseEntity,
    CaseLink,
    CaseStatus,
    CaseTask,
    CaseType,
    ClosureReason,
    EntityRole,
    EntityType,
    TaskStatus,
    db_case_model,
)
from orion.services.permission_manager.permission_models import UserPermission
from tests.model.fakes import FakeAuditManager
from tests.scripts.case_manager.fakes import FakeArtifactFileHelper, FakeSearchManager

TENANT = "tenant-1"
CIPHER = Fernet(Fernet.generate_key())

AWARE = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)


def _run(coro):
    return asyncio.run(coro)


def _make_manager(engine, artifact_helper=None) -> CaseManager:
    manager = object.__new__(CaseManager)
    manager._engine = engine
    manager._artifact_file_helper = artifact_helper or FakeArtifactFileHelper()
    return manager


def _make_user(
    *,
    user_id="user-1",
    role=user_role.MEMBER,
    licenses=None,
    permissions=None,
    tenant_uuid=TENANT,
):
    return SimpleNamespace(
        id=user_id,
        tenant_uuid=tenant_uuid,
        role=role,
        licenses=licenses if licenses is not None else [],
        permissions=permissions if permissions is not None else [],
    )


def _maintainer(user_id="maint-1"):
    return _make_user(user_id=user_id, role=user_role.MEMBER, licenses=[LicenseName.MAINTAINER])


def _admin(user_id="admin-1"):
    return _make_user(user_id=user_id, role=user_role.ADMIN)


def _analyst(user_id="analyst-1"):
    return _make_user(
        user_id=user_id,
        role=user_role.ANALYST,
        permissions=[UserPermission.CASE_MANAGEMENT],
    )


def _member(user_id="member-1"):
    return _make_user(user_id=user_id, role=user_role.MEMBER)


def _make_account(
    *,
    account_id="analyst-1",
    username="ana",
    email="ana@example.com",
    role=user_role.ANALYST,
    status=UserStatus.ACTIVE,
    permissions=None,
    tenant_uuid=TENANT,
):
    return SimpleNamespace(
        id=account_id,
        username=username,
        email=email,
        role=role,
        status=status,
        tenant_uuid=tenant_uuid,
        permissions=permissions if permissions is not None else [UserPermission.CASE_MANAGEMENT],
    )


def _make_entity(entity_id="e1", value="a@b.com", role=EntityRole.PRIMARY):
    return CaseEntity(entityId=entity_id, type=EntityType.EMAIL, value=value, role=role)


def _make_record(
    *,
    case_id="00001",
    created_by="maint-1",
    status=CaseStatus.NEW,
    assigned=None,
    is_archived=False,
    closure=None,
    entities=None,
    tasks=None,
    comments=None,
    linked=None,
    artifacts=None,
    communications=None,
) -> db_case_model:
    return db_case_model(
        caseId=case_id,
        tenant_uuid=TENANT,
        title="Title",
        description="Desc",
        status=status,
        createdBy=created_by,
        assignedAnalystIds=assigned if assigned is not None else [],
        primaryEntityId="e1",
        isArchived=is_archived,
        entities=entities if entities is not None else [_make_entity()],
        tasks=tasks if tasks is not None else [],
        comments=comments if comments is not None else [],
        linkedCases=linked if linked is not None else [],
        artifacts=artifacts if artifacts is not None else [],
        communications=communications if communications is not None else [],
        closure=closure,
    )


def _make_rich_record(created_by="maint-1") -> db_case_model:
    artifact = CaseArtifact(
        artifactId="art-1",
        title="Artifact",
        type=ArtifactType.FILE,
        capturedAt=AWARE,
        files=[
            CaseArtifactFile(
                fileId="file-1",
                fileName="a.txt",
                fileType="text/plain",
                fileResourceId="res-1",
                fileHash="hash-1",
            )
        ],
    )
    task = CaseTask(taskId="t1", title="Task", assignedTo="analyst-1", dueAt=AWARE, status=TaskStatus.OPEN)
    comment = CaseComment(commentId="c1", body="Body")
    link = CaseLink(targetCaseId="00002", reason="dup")
    comm = CaseCommunication(communicationId="cm1", name="Chat", url="https://x.test", sessionResourceId="sess-1")
    return _make_record(
        created_by=created_by,
        artifacts=[artifact],
        tasks=[task],
        comments=[comment],
        linked=[link],
        communications=[comm],
        entities=[_make_entity()],
    )


def _make_create_request(**overrides):
    data = {
        "caseId": "00001",
        "title": "Title",
        "caseType": CaseType.PHISHING,
        "primaryEntityId": "e1",
        "entities": [CaseEntityModel(entityId="e1", type=EntityType.EMAIL, value="a@b.com", role=EntityRole.PRIMARY)],
    }
    data.update(overrides)
    return CreateCaseRequest(**data)


def _make_update_request(**overrides):
    data = {
        "title": "Title",
        "caseType": CaseType.PHISHING,
        "primaryEntityId": "e1",
        "entities": [CaseEntityModel(entityId="e1", type=EntityType.EMAIL, value="a@b.com", role=EntityRole.PRIMARY)],
    }
    data.update(overrides)
    return UpdateCaseRequest(**data)


def _entity_model(entity_id="e1", value="a@b.com", role=EntityRole.PRIMARY):
    return CaseEntityModel(entityId=entity_id, type=EntityType.EMAIL, value=value, role=role)


def _task_model(task_id="t1", title="Task", assigned_to="", status=TaskStatus.OPEN):
    return CaseTaskModel(taskId=task_id, title=title, assignedTo=assigned_to, status=status)


def _comment_model(comment_id="c1", body="Body"):
    return CaseCommentModel(commentId=comment_id, body=body)


def _link_model(target="00002", reason="dup"):
    return CaseLinkModel(targetCaseId=target, reason=reason)


def _closure_model(reason=ClosureReason.REMEDIATED):
    return CaseClosureModel(reason=reason, summary="done", resolution="fixed")


def _closure_record():
    return CaseClosure(reason=ClosureReason.REMEDIATED, summary="s", resolution="r")


def use_cipher(monkeypatch):
    async def _cipher(current_user):
        return CIPHER

    monkeypatch.setattr(case_module.CaseHelperMethods, "get_case_cipher", staticmethod(_cipher))


def use_audit(monkeypatch):
    audit = FakeAuditManager()
    monkeypatch.setattr(case_module.AuditLogManager, "get_instance", staticmethod(lambda: audit))
    return audit


def use_search(monkeypatch, result=None):
    fake = FakeSearchManager(result=result)
    monkeypatch.setattr(case_module.search_manager, "getInstance", fake.getInstance)
    return fake


def use_status_config(monkeypatch, config):
    async def _get_effective_config(current_user):
        return config

    monkeypatch.setattr(
        case_module.StatusBoardConfigManager,
        "get_effective_config",
        staticmethod(_get_effective_config),
    )
