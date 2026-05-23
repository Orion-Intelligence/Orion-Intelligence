from uuid import uuid4
from fastapi import UploadFile
from fastapi.responses import Response
from fastapi import HTTPException

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.case_manager.case_manager_helper import actor_id
from orion.api.interactive.case_manager.case_manager_helper import apply_sensitive_case_values
from orion.api.interactive.case_manager.case_manager_helper import can_close_case
from orion.api.interactive.case_manager.case_manager_helper import can_comment
from orion.api.interactive.case_manager.case_manager_helper import can_manage_case_assignments
from orion.api.interactive.case_manager.case_manager_helper import can_view_case
from orion.api.interactive.case_manager.case_manager_helper import decrypt_value
from orion.api.interactive.case_manager.case_manager_helper import encrypt_value
from orion.api.interactive.case_manager.case_manager_helper import get_case_cipher
from orion.api.interactive.case_manager.case_manager_helper import is_admin
from orion.api.interactive.case_manager.case_manager_helper import is_maintainer
from orion.api.interactive.case_manager.models.case_models import CaseResponse
from orion.api.interactive.case_manager.models.case_models import CreateCaseRequest
from orion.api.interactive.case_manager.models.case_models import UpdateCaseRequest
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.services.mongo_manager.shared_model.db_case_model import CaseArtifact
from orion.services.mongo_manager.shared_model.db_case_model import CaseClosure
from orion.services.mongo_manager.shared_model.db_case_model import CaseComment
from orion.services.mongo_manager.shared_model.db_case_model import CaseEntity
from orion.services.mongo_manager.shared_model.db_case_model import CaseLink
from orion.services.mongo_manager.shared_model.db_case_model import CaseTask
from orion.services.mongo_manager.shared_model.db_case_model import db_case_model
from orion.services.mongo_manager.shared_model.db_case_model import utc_now
from orion.api.interactive.case_manager.case_artifact_file_helper import delete_artifact_file
from orion.api.interactive.case_manager.case_artifact_file_helper import load_decrypted_artifact_file
from orion.api.interactive.case_manager.case_artifact_file_helper import save_encrypted_artifact_file
from orion.api.interactive.case_manager.case_artifact_file_helper import validate_artifact_file


class CaseManager:
    __instance = None

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        if CaseManager.__instance is not None:
            raise Exception("Singleton!")
        CaseManager.__instance = self

    @staticmethod
    def get_instance():
        if CaseManager.__instance is None:
            CaseManager()
        return CaseManager.__instance

    async def _to_response(self, record: db_case_model, current_user) -> CaseResponse:
        enc = await get_case_cipher(current_user)
        apply_sensitive_case_values(record, lambda value: decrypt_value(enc, value))
        data = record.model_dump()
        data["id"] = str(record.id)
        return CaseResponse(**data)

    async def _get_tenant_analyst_ids(self, current_user) -> set[str]:
        users = await self._engine.find(
            db_user_account,
            (db_user_account.tenant_uuid == str(current_user.tenant_uuid))
            & (db_user_account.role == user_role.ANALYST)
            & (db_user_account.status == UserStatus.ACTIVE),
        )
        return {str(user.id) for user in users}

    async def _validate_case_analysts(self, analyst_ids: list[str], current_user) -> None:
        requested_ids = set(analyst_ids or [])
        if not requested_ids:
            return
        tenant_analyst_ids = await self._get_tenant_analyst_ids(current_user)
        invalid_ids = requested_ids - tenant_analyst_ids
        if invalid_ids:
            raise HTTPException(status_code=400, detail="Case analysts must be active analysts in this tenant")

    def _validate_work_assignments(self, tasks, allowed_analyst_ids: list[str]) -> None:
        assigned_ids = {task.assignedTo for task in tasks if task.assignedTo}
        if not assigned_ids:
            return
        allowed_ids = set(allowed_analyst_ids or [])
        invalid_ids = assigned_ids - allowed_ids
        if invalid_ids:
            raise HTTPException(status_code=400, detail="Tasks and remediation steps can only be assigned to analysts on this case")

    def _task_assignments_changed(self, record: db_case_model, tasks) -> bool:
        current_assignments = {task.taskId: task.assignedTo for task in (record.tasks or [])}
        next_assignments = {task.taskId: task.assignedTo for task in tasks}
        return current_assignments != next_assignments

    def _linked_cases_changed(self, record: db_case_model, linked_cases) -> bool:
        current_links = {
            linked_case.targetCaseId: (linked_case.relationship, linked_case.reason)
            for linked_case in (record.linkedCases or [])
        }
        next_links = {
            linked_case.targetCaseId: (linked_case.relationship, linked_case.reason)
            for linked_case in linked_cases
        }
        return current_links != next_links

    async def _validate_linked_cases(self, case_id: str, linked_cases, current_user) -> None:
        target_case_ids = {linked_case.targetCaseId for linked_case in linked_cases}
        if case_id in target_case_ids:
            raise HTTPException(status_code=400, detail="A case cannot be linked to itself")
        for target_case_id in target_case_ids:
            target_record = await self._engine.find_one(
                db_case_model,
                (db_case_model.caseId == target_case_id)
                & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
            )
            if not target_record or not can_view_case(target_record, current_user):
                raise HTTPException(status_code=400, detail="Linked cases must be cases you can access")

    async def get_cases(self, current_user) -> list[CaseResponse]:
        if is_maintainer(current_user):
            records = await self._engine.find(
                db_case_model, db_case_model.tenant_uuid == str(current_user.tenant_uuid)
            )
        else:
            current_actor_id = actor_id(current_user)
            records = await self._engine.find(
                db_case_model,
                {
                    "tenant_uuid": str(current_user.tenant_uuid),
                    "$or": [
                        {"createdBy": current_actor_id},
                        {"assignedAnalystIds": {"$elemMatch": {"$eq": current_actor_id}}},
                    ],
                },
            )

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            f"All cases retrieved: total_count={len(records)}",
        )

        return [await self._to_response(r, current_user) for r in records]

    async def create_case(self, data: CreateCaseRequest, current_user) -> CaseResponse:
        existing = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == data.caseId)
            & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
        )
        if existing:
            raise HTTPException(status_code=400, detail="Case ID already exists")

        current_actor_id = actor_id(current_user)
        server_now = utc_now()
        await self._validate_case_analysts(data.assignedAnalystIds, current_user)
        self._validate_work_assignments(data.tasks, data.assignedAnalystIds)
        await self._validate_linked_cases(data.caseId, data.linkedCases, current_user)
        if data.closure and not (is_maintainer(current_user) or is_admin(current_user) or current_actor_id in data.assignedAnalystIds):
            raise HTTPException(status_code=403, detail="Only assigned analysts, admins, or maintainers can close cases")
        entities = [
            CaseEntity(
                **entity.model_dump(),
                createdBy=current_actor_id,
                updatedBy=current_actor_id,
                createdAt=server_now,
                updatedAt=server_now,
            )
            for entity in data.entities
        ]
        record = db_case_model(
            caseId=data.caseId,
            tenant_uuid=str(current_user.tenant_uuid),
            title=data.title,
            description=data.description,
            caseType=data.caseType,
            status=data.status,
            severity=data.severity,
            priority=data.priority,
            intakeSource=data.intakeSource,
            caseTypeOtherValue=data.caseTypeOtherValue,
            intakeSourceOtherValue=data.intakeSourceOtherValue,
            tags=data.tags,
            createdBy=current_actor_id,
            assignedAnalystIds=data.assignedAnalystIds,
            primaryEntityId=data.primaryEntityId,
            entities=entities,
            artifacts=[
                CaseArtifact(
                    **artifact.model_dump(exclude={"artifactId"}),
                    artifactId=artifact.artifactId or str(uuid4()),
                    createdBy=current_actor_id,
                    createdAt=server_now,
                )
                for artifact in data.artifacts
            ],
            comments=[
                CaseComment(**comment.model_dump(), createdBy=current_actor_id, createdAt=server_now, updatedAt=server_now)
                for comment in data.comments
            ],
            tasks=[
                CaseTask(
                    **task.model_dump(exclude={"taskId"}),
                    taskId=task.taskId or str(uuid4()),
                    createdBy=current_actor_id,
                    createdAt=server_now,
                    updatedAt=server_now,
                )
                for task in data.tasks
            ],
            linkedCases=[
                CaseLink(**linked_case.model_dump(), createdBy=current_actor_id, createdAt=server_now)
                for linked_case in data.linkedCases
            ],
            closure=CaseClosure(**data.closure.model_dump(), closedBy=current_actor_id, closedAt=server_now) if data.closure else None,
            closedAt=server_now if data.closure else None,
        )
        enc = await get_case_cipher(current_user)
        apply_sensitive_case_values(record, lambda value: encrypt_value(enc, value))
        await self._engine.save(record)

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            f"Case created: caseId={record.caseId}, title={data.title}, caseType={record.caseType}, status={record.status}, priority={record.priority}, severity={record.severity}, intakeSource={record.intakeSource}, entities_count={len(record.entities)}",
        )

        return await self._to_response(record, current_user)

    async def get_case_analysts(self, current_user) -> list[dict]:
        users = await self._engine.find(
            db_user_account,
            (db_user_account.tenant_uuid == str(current_user.tenant_uuid))
            & (db_user_account.role == user_role.ANALYST)
            & (db_user_account.status == UserStatus.ACTIVE),
        )
        return [
            {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "role": user.role.value if user.role else "",
                "status": user.status.value if user.status else "",
            }
            for user in users
        ]

    async def get_case_by_id(self, case_id: str, current_user) -> CaseResponse:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id)
            & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
        )
        if not record:
            await AuditLogManager.get_instance().register(
                str(current_user.tenant_uuid),
                str(current_user.id),
                f"Case retrieval failed: caseId={case_id}, case_not_found",
            )
            raise HTTPException(status_code=404, detail="Case not found")
        if not can_view_case(record, current_user):
            raise HTTPException(status_code=403, detail="Access forbidden")

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            f"Case retrieved: caseId={case_id}",
        )

        return await self._to_response(record, current_user)

    async def update_case(self, case_id: str, data: UpdateCaseRequest, current_user) -> CaseResponse:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id)
            & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
        )
        if not record:
            await AuditLogManager.get_instance().register(
                str(current_user.tenant_uuid),
                str(current_user.id),
                f"Case update failed: caseId={case_id}, case_not_found",
            )
            raise HTTPException(status_code=404, detail="Case not found")

        current_actor_id = actor_id(current_user)
        server_now = utc_now()
        if not can_view_case(record, current_user):
            raise HTTPException(status_code=403, detail="Access forbidden")
        enc = await get_case_cipher(current_user)
        apply_sensitive_case_values(record, lambda value: decrypt_value(enc, value))
        if record.closure is not None:
            raise HTTPException(status_code=403, detail="Closed cases cannot be edited")
        if data.assignedAnalystIds != (record.assignedAnalystIds or []) and not can_manage_case_assignments(record, current_user):
            raise HTTPException(status_code=403, detail="Only admins, maintainers, or the case creator can update case analysts")
        if self._task_assignments_changed(record, data.tasks) and not can_manage_case_assignments(record, current_user):
            raise HTTPException(status_code=403, detail="Only admins, maintainers, or the case creator can assign tasks")
        if self._linked_cases_changed(record, data.linkedCases) and not can_manage_case_assignments(record, current_user):
            raise HTTPException(status_code=403, detail="Only admins, maintainers, or the case creator can link cases")
        await self._validate_case_analysts(data.assignedAnalystIds, current_user)
        self._validate_work_assignments(data.tasks, data.assignedAnalystIds)
        await self._validate_linked_cases(case_id, data.linkedCases, current_user)
        if data.comments is not None and not can_comment(record, current_user):
            raise HTTPException(status_code=403, detail="Only assigned analysts, admins, maintainers, or the case creator can comment on cases")
        closure_provided = "closure" in data.model_fields_set
        if closure_provided and (data.closure is not None or record.closure is not None) and not can_close_case(record, current_user):
            raise HTTPException(status_code=403, detail="Only assigned analysts, admins, or maintainers can close cases")
        existing_entities = {
            entity.entityId: entity
            for entity in record.entities
        }
        entities = [
            CaseEntity(
                **entity.model_dump(),
                createdBy=existing_entities[entity.entityId].createdBy if entity.entityId in existing_entities else current_actor_id,
                updatedBy=current_actor_id,
                createdAt=existing_entities[entity.entityId].createdAt if entity.entityId in existing_entities else server_now,
                updatedAt=server_now,
            )
            for entity in data.entities
        ]
        record.title = data.title
        record.description = data.description
        record.caseType = data.caseType
        record.status = data.status
        record.severity = data.severity
        record.priority = data.priority
        record.intakeSource = data.intakeSource
        record.caseTypeOtherValue = data.caseTypeOtherValue
        record.intakeSourceOtherValue = data.intakeSourceOtherValue
        record.tags = data.tags
        record.assignedAnalystIds = data.assignedAnalystIds
        record.primaryEntityId = data.primaryEntityId
        record.entities = entities
        existing_artifacts = {
            artifact.artifactId: artifact
            for artifact in record.artifacts
        }
        record.artifacts = [
            CaseArtifact(
                **artifact.model_dump(exclude={"artifactId"}),
                artifactId=artifact.artifactId or str(uuid4()),
                createdBy=existing_artifacts[artifact.artifactId].createdBy if artifact.artifactId in existing_artifacts else current_actor_id,
                createdAt=existing_artifacts[artifact.artifactId].createdAt if artifact.artifactId in existing_artifacts else server_now,
            )
            for artifact in data.artifacts
        ]
        existing_tasks = {
            task.taskId: task
            for task in record.tasks
        }
        record.tasks = [
            CaseTask(
                **task.model_dump(exclude={"taskId"}),
                taskId=task.taskId or str(uuid4()),
                createdBy=existing_tasks[task.taskId].createdBy if task.taskId in existing_tasks else current_actor_id,
                createdAt=existing_tasks[task.taskId].createdAt if task.taskId in existing_tasks else server_now,
                updatedAt=server_now,
            )
            for task in data.tasks
        ]
        existing_linked_cases = {
            linked_case.targetCaseId: linked_case
            for linked_case in record.linkedCases
        }
        record.linkedCases = [
            CaseLink(
                **linked_case.model_dump(),
                createdBy=existing_linked_cases[linked_case.targetCaseId].createdBy if linked_case.targetCaseId in existing_linked_cases else current_actor_id,
                createdAt=existing_linked_cases[linked_case.targetCaseId].createdAt if linked_case.targetCaseId in existing_linked_cases else server_now,
            )
            for linked_case in data.linkedCases
        ]
        if data.comments is not None:
            existing_comments = {
                comment.commentId: comment
                for comment in record.comments
            }
            record.comments = [
                CaseComment(
                    **comment.model_dump(exclude={"commentId"}),
                    commentId=comment.commentId or str(uuid4()),
                    createdBy=existing_comments[comment.commentId].createdBy if comment.commentId in existing_comments else current_actor_id,
                    createdAt=existing_comments[comment.commentId].createdAt if comment.commentId in existing_comments else server_now,
                    updatedAt=server_now,
                )
                for comment in data.comments
            ]
        if closure_provided and data.closure is not None:
            record.closure = CaseClosure(**data.closure.model_dump(), closedBy=current_actor_id, closedAt=server_now)
            record.closedAt = server_now
        elif closure_provided:
            record.closure = None
            record.closedAt = None
        record.updatedAt = utc_now()

        apply_sensitive_case_values(record, lambda value: encrypt_value(enc, value))
        await self._engine.save(record)

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            f"Case updated: caseId={case_id}",
        )

        return await self._to_response(record, current_user)

    async def delete_case(self, case_id: str, current_user) -> dict:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id)
            & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
        )
        if not record:
            raise HTTPException(status_code=404, detail="Case not found")
        if record.closure is not None:
            raise HTTPException(status_code=403, detail="Closed cases cannot be deleted")
        if not is_maintainer(current_user):
            raise HTTPException(status_code=403, detail="Only maintainers can delete cases")

        await self._engine.delete(record)
        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            f"Case deleted: caseId={case_id}",
        )
        return {"success": True}

    async def get_next_case_id(self, current_user) -> dict:
        records = await self._engine.find(
            db_case_model, db_case_model.tenant_uuid == str(current_user.tenant_uuid)
        )
        next_id = str(len(records) + 1).zfill(5)
        return {"nextCaseId": next_id}
    
    async def upload_artifact_file(self, case_id: str, artifact_id: str, file: UploadFile, current_user) -> dict:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id)
            & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
        )
        
        if not record:
            raise HTTPException(status_code=404, detail="Case not found")
        
        if not can_view_case(record, current_user):
            raise HTTPException(status_code=403, detail="Access forbidden")

        enc = await get_case_cipher(current_user)
        apply_sensitive_case_values(record, lambda value: decrypt_value(enc, value))

        artifact = next((item for item in record.artifacts if item.artifactId == artifact_id), None)

        if not artifact:
            raise HTTPException(status_code=404, detail="Artifact not found")

        validate_artifact_file(artifact.type.value, file)

        if artifact.fileResourceId:
            delete_artifact_file(artifact.fileResourceId)

        resource_id, file_size = await save_encrypted_artifact_file(file, enc)

        artifact.fileName = file.filename or ""
        artifact.fileType = file.content_type or ""
        artifact.fileSize = file_size
        artifact.fileResourceId = resource_id
        record.updatedAt = utc_now()

        apply_sensitive_case_values(record, lambda value: encrypt_value(enc, value))
        await self._engine.save(record)

        return {
            "fileName": file.filename or "",
            "fileType": file.content_type or "",
            "fileSize": file_size,
            "fileResourceId": resource_id,
        }
    
    async def get_artifact_file_response(self, case_id: str, artifact_id: str, current_user, download: bool = False) -> Response:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id)
            & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
        )

        if not record:
            raise HTTPException(status_code=404, detail="Case not found")

        if not can_view_case(record, current_user):
            raise HTTPException(status_code=403, detail="Access forbidden")

        enc = await get_case_cipher(current_user)
        apply_sensitive_case_values(record, lambda value: decrypt_value(enc, value))

        artifact = next((item for item in record.artifacts if item.artifactId == artifact_id), None)

        if not artifact or not artifact.fileResourceId:
            raise HTTPException(status_code=404, detail="Artifact file not found")

        file_data = load_decrypted_artifact_file(artifact.fileResourceId, enc)

        disposition = "attachment" if download else "inline"
        file_name = artifact.fileName or "artifact-file"

        return Response(
            content=file_data,
            media_type=artifact.fileType or "application/octet-stream",
            headers={
                "Content-Disposition": f'{disposition}; filename="{file_name}"'
            },
        )
    
    async def delete_artifact_file_from_case(self, case_id: str, artifact_id: str, current_user) -> dict:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id)
            & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
        )

        if not record:
            raise HTTPException(status_code=404, detail="Case not found")

        if not can_view_case(record, current_user):
            raise HTTPException(status_code=403, detail="Access forbidden")

        enc = await get_case_cipher(current_user)
        apply_sensitive_case_values(record, lambda value: decrypt_value(enc, value))

        artifact = next((item for item in record.artifacts if item.artifactId == artifact_id), None)

        if not artifact:
            raise HTTPException(status_code=404, detail="Artifact not found")

        delete_artifact_file(artifact.fileResourceId)

        artifact.fileName = ""
        artifact.fileType = ""
        artifact.fileSize = 0
        artifact.fileResourceId = ""
        record.updatedAt = utc_now()

        apply_sensitive_case_values(record, lambda value: encrypt_value(enc, value))
        await self._engine.save(record)

        return {"success": True}
