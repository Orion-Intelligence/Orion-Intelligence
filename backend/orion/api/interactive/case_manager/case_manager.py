from datetime import datetime, timezone
from fastapi import HTTPException
from cryptography.fernet import Fernet
from orion.api.interactive.case_manager.models.case_models import (
    CreateCaseRequest,
    CaseResponse,
)
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_case_model import db_case_model
from orion.services.encryption_manager.key_manager import KeyManager


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

    async def _get_enc(self, tenant_id: str) -> Fernet:
        dek = await KeyManager.get_instance().get_or_create_dek(str(tenant_id))
        return Fernet(dek)

    def _encrypt_str(self, enc: Fernet, value: str) -> str:
        return enc.encrypt((value or "").encode()).decode()

    def _decrypt_str(self, enc: Fernet, value: str) -> str:
        return enc.decrypt((value or "").encode()).decode() if value else ""

    def _to_response(self, record: db_case_model, enc: Fernet) -> CaseResponse:
        d = self._decrypt_str
        return CaseResponse(
            id=str(record.id),
            caseId=record.caseId,
            caseType=d(enc, record.caseType),
            owner=d(enc, record.owner),
            createdDate=record.createdDate,
            modifiedDate=record.modifiedDate,
            status=d(enc, record.status),
            priority=d(enc, record.priority),
            intakeSource=d(enc, record.intakeSource),
            entityName=d(enc, record.entityName),
            socialMediaProfiles=[
                {
                    "platform": d(enc, p.platform),
                    "username": d(enc, p.username),
                }
                for p in record.socialMediaProfiles
            ],
            webUrls=[d(enc, url) for url in record.webUrls],
            emails=[d(enc, email) for email in record.emails],
            phoneNumbers=[d(enc, phone) for phone in record.phoneNumbers],
            additionalIdentifiers=[
                {
                    "type": d(enc, i.type),
                    "value": d(enc, i.value),
                }
                for i in record.additionalIdentifiers
            ],
            relatedEntities=[
                {
                    "name": d(enc, e.name),
                    "socialMediaProfiles": [
                        {
                            "platform": d(enc, p.platform),
                            "username": d(enc, p.username),
                        }
                        for p in e.socialMediaProfiles
                    ],
                    "webUrls": [d(enc, url) for url in e.webUrls],
                    "emails": [d(enc, email) for email in e.emails],
                    "phoneNumbers": [d(enc, phone) for phone in e.phoneNumbers],
                    "additionalIdentifiers": [
                        {
                            "type": d(enc, i.type),
                            "value": d(enc, i.value),
                        }
                        for i in e.additionalIdentifiers
                    ],
                }
                for e in record.relatedEntities
            ],
            linkedCaseId=d(enc, record.linkedCaseId) if record.linkedCaseId else None,
            linkedReason=d(enc, record.linkedReason) if record.linkedReason else None,
        )

    async def get_cases(self, current_user) -> list[CaseResponse]:
        records = await self._engine.find(
            db_case_model, db_case_model.tenant_uuid == str(current_user.tenant_uuid)
        )
        enc = await self._get_enc(str(current_user.tenant_uuid))

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            f"All cases retrieved: total_count={len(records)}",
        )

        return [self._to_response(r, enc) for r in records]

    async def create_case(self, data: CreateCaseRequest, current_user) -> CaseResponse:
        existing = await self._engine.find_one(
            db_case_model, db_case_model.caseId == data.caseId
        )
        if existing:
            raise HTTPException(status_code=400, detail="Case ID already exists")

        enc = await self._get_enc(str(current_user.tenant_uuid))
        e = self._encrypt_str

        record = db_case_model(
            caseId=data.caseId,
            caseType=e(enc, data.caseType),
            owner=e(enc, data.owner),
            status=e(enc, data.status),
            priority=e(enc, data.priority),
            intakeSource=e(enc, data.intakeSource),
            entityName=e(enc, data.entityName),
            socialMediaProfiles=[
                {"platform": e(enc, p.platform), "username": e(enc, p.username)}
                for p in data.socialMediaProfiles
            ],
            webUrls=[e(enc, url) for url in data.webUrls],
            emails=[e(enc, email) for email in data.emails],
            phoneNumbers=[e(enc, phone) for phone in data.phoneNumbers],
            additionalIdentifiers=[
                {"type": e(enc, i.type), "value": e(enc, i.value)}
                for i in data.additionalIdentifiers
            ],
            relatedEntities=[
                {
                    **{
                        k: v
                        for k, v in rel.model_dump(
                            exclude={
                                "socialMediaProfiles",
                                "additionalIdentifiers",
                                "webUrls",
                                "emails",
                                "phoneNumbers",
                            }
                        ).items()
                    },
                    "name": e(enc, rel.name),
                    "socialMediaProfiles": [
                        {"platform": e(enc, p.platform), "username": e(enc, p.username)}
                        for p in rel.socialMediaProfiles
                    ],
                    "webUrls": [e(enc, url) for url in rel.webUrls],
                    "emails": [e(enc, email) for email in rel.emails],
                    "phoneNumbers": [e(enc, phone) for phone in rel.phoneNumbers],
                    "additionalIdentifiers": [
                        {"type": e(enc, i.type), "value": e(enc, i.value)}
                        for i in rel.additionalIdentifiers
                    ],
                }
                for rel in data.relatedEntities
            ],
            linkedCaseId=e(enc, data.linkedCaseId) if data.linkedCaseId else None,
            linkedReason=e(enc, data.linkedReason) if data.linkedReason else None,
            tenant_uuid=str(current_user.tenant_uuid),
            createdDate=datetime.now(timezone.utc),
        )
        await self._engine.save(record)

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            f"Case created: caseId={data.caseId}, caseType={data.caseType}, owner={data.owner}, status={data.status}, priority={data.priority}, intakeSource={data.intakeSource}, entityName={data.entityName}, socialMediaProfiles_count={len(data.socialMediaProfiles)}, webUrls_count={len(data.webUrls)}, emails_count={len(data.emails)}, phoneNumbers_count={len(data.phoneNumbers)}, additionalIdentifiers_count={len(data.additionalIdentifiers)}, relatedEntities_count={len(data.relatedEntities)}",
        )

        return self._to_response(record, enc)

    async def validate_case_exists(self, case_id: str, current_user) -> CaseResponse:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id)
            & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
        )
        if not record:
            await AuditLogManager.get_instance().register(
                str(current_user.tenant_uuid),
                str(current_user.id),
                f"Case existence validation failed: caseId={case_id}, exists=false",
            )
            raise HTTPException(status_code=404, detail="Case not found")

        enc = await self._get_enc(str(current_user.tenant_uuid))

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            f"Case existence validated: caseId={case_id}, exists=true",
        )

        return self._to_response(record, enc)

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

        enc = await self._get_enc(str(current_user.tenant_uuid))

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            f"Case retrieved: caseId={case_id}",
        )

        return self._to_response(record, enc)

    async def update_case(
        self, case_id: str, data: CreateCaseRequest, current_user
    ) -> CaseResponse:
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

        enc = await self._get_enc(str(current_user.tenant_uuid))
        e = self._encrypt_str
        d = self._decrypt_str

        changes = []

        old_caseType = d(enc, record.caseType) if record.caseType else ""
        new_caseType = data.caseType
        if old_caseType != new_caseType:
            changes.append(f"caseType: '{old_caseType}' → '{new_caseType}'")
        record.caseType = e(enc, data.caseType)

        old_owner = d(enc, record.owner) if record.owner else ""
        new_owner = data.owner
        if old_owner != new_owner:
            changes.append(f"owner: '{old_owner}' → '{new_owner}'")
        record.owner = e(enc, data.owner)

        old_status = d(enc, record.status) if record.status else ""
        new_status = data.status
        if old_status != new_status:
            changes.append(f"status: '{old_status}' → '{new_status}'")
        record.status = e(enc, data.status)

        old_priority = d(enc, record.priority) if record.priority else ""
        new_priority = data.priority
        if old_priority != new_priority:
            changes.append(f"priority: '{old_priority}' → '{new_priority}'")
        record.priority = e(enc, data.priority)

        old_intakeSource = d(enc, record.intakeSource) if record.intakeSource else ""
        new_intakeSource = data.intakeSource
        if old_intakeSource != new_intakeSource:
            changes.append(f"intakeSource: '{old_intakeSource}' → '{new_intakeSource}'")
        record.intakeSource = e(enc, data.intakeSource)

        old_entityName = d(enc, record.entityName) if record.entityName else ""
        new_entityName = data.entityName
        if old_entityName != new_entityName:
            changes.append(f"entityName: '{old_entityName}' → '{new_entityName}'")
        record.entityName = e(enc, data.entityName)

        old_socialMediaProfiles_count = len(record.socialMediaProfiles or [])
        new_socialMediaProfiles_count = len(data.socialMediaProfiles or [])
        if old_socialMediaProfiles_count != new_socialMediaProfiles_count:
            changes.append(
                f"socialMediaProfiles_count: {old_socialMediaProfiles_count} → {new_socialMediaProfiles_count}"
            )
        record.socialMediaProfiles = [
            {"platform": e(enc, p.platform), "username": e(enc, p.username)}
            for p in data.socialMediaProfiles
        ]

        old_webUrls_count = len(record.webUrls or [])
        new_webUrls_count = len(data.webUrls or [])
        if old_webUrls_count != new_webUrls_count:
            changes.append(f"webUrls_count: {old_webUrls_count} → {new_webUrls_count}")
        record.webUrls = [e(enc, url) for url in data.webUrls]

        old_emails_count = len(record.emails or [])
        new_emails_count = len(data.emails or [])
        if old_emails_count != new_emails_count:
            changes.append(f"emails_count: {old_emails_count} → {new_emails_count}")
        record.emails = [e(enc, email) for email in data.emails]

        old_phoneNumbers_count = len(record.phoneNumbers or [])
        new_phoneNumbers_count = len(data.phoneNumbers or [])
        if old_phoneNumbers_count != new_phoneNumbers_count:
            changes.append(
                f"phoneNumbers_count: {old_phoneNumbers_count} → {new_phoneNumbers_count}"
            )
        record.phoneNumbers = [e(enc, phone) for phone in data.phoneNumbers]

        old_additionalIdentifiers_count = len(record.additionalIdentifiers or [])
        new_additionalIdentifiers_count = len(data.additionalIdentifiers or [])
        if old_additionalIdentifiers_count != new_additionalIdentifiers_count:
            changes.append(
                f"additionalIdentifiers_count: {old_additionalIdentifiers_count} → {new_additionalIdentifiers_count}"
            )
        record.additionalIdentifiers = [
            {"type": e(enc, i.type), "value": e(enc, i.value)}
            for i in data.additionalIdentifiers
        ]

        old_relatedEntities_count = len(record.relatedEntities or [])
        new_relatedEntities_count = len(data.relatedEntities or [])
        if old_relatedEntities_count != new_relatedEntities_count:
            changes.append(
                f"relatedEntities_count: {old_relatedEntities_count} → {new_relatedEntities_count}"
            )
        record.relatedEntities = [
            {
                **{
                    k: v
                    for k, v in rel.model_dump(
                        exclude={
                            "socialMediaProfiles",
                            "additionalIdentifiers",
                            "webUrls",
                            "emails",
                            "phoneNumbers",
                        }
                    ).items()
                },
                "name": e(enc, rel.name),
                "socialMediaProfiles": [
                    {"platform": e(enc, p.platform), "username": e(enc, p.username)}
                    for p in rel.socialMediaProfiles
                ],
                "webUrls": [e(enc, url) for url in rel.webUrls],
                "emails": [e(enc, email) for email in rel.emails],
                "phoneNumbers": [e(enc, phone) for phone in rel.phoneNumbers],
                "additionalIdentifiers": [
                    {"type": e(enc, i.type), "value": e(enc, i.value)}
                    for i in rel.additionalIdentifiers
                ],
            }
            for rel in data.relatedEntities
        ]

        old_linkedCaseId = d(enc, record.linkedCaseId) if record.linkedCaseId else ""
        new_linkedCaseId = data.linkedCaseId if data.linkedCaseId else ""
        if old_linkedCaseId != new_linkedCaseId:
            changes.append(f"linkedCaseId: '{old_linkedCaseId}' → '{new_linkedCaseId}'")
        record.linkedCaseId = e(enc, data.linkedCaseId) if data.linkedCaseId else None

        old_linkedReason = d(enc, record.linkedReason) if record.linkedReason else ""
        new_linkedReason = data.linkedReason if data.linkedReason else ""
        if old_linkedReason != new_linkedReason:
            changes.append(f"linkedReason: '{old_linkedReason}' → '{new_linkedReason}'")
        record.linkedReason = e(enc, data.linkedReason) if data.linkedReason else None

        record.modifiedDate = datetime.now(timezone.utc)

        await self._engine.save(record)

        changes_summary = " | ".join(changes) if changes else "No changes detected"
        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            f"Case updated: caseId={case_id}, changes: {changes_summary}",
        )

        return self._to_response(record, enc)

    async def get_next_case_id(self, current_user) -> dict:
        records = await self._engine.find(
            db_case_model, db_case_model.tenant_uuid == str(current_user.tenant_uuid)
        )
        next_id = str(len(records) + 1).zfill(5)
        return {"nextCaseId": next_id}

    async def check_case_exists_safe(self, case_id: str, current_user) -> dict:
        try:
            record = await self._engine.find_one(
                db_case_model,
                (db_case_model.caseId == case_id)
                & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
            )
            exists = record is not None

            await AuditLogManager.get_instance().register(
                str(current_user.tenant_uuid),
                str(current_user.id),
                f"Case existence check (safe): caseId={case_id}, exists={exists}",
            )

            return {"exists": exists}
        except Exception as e:
            await AuditLogManager.get_instance().register(
                str(current_user.tenant_uuid),
                str(current_user.id),
                f"Case existence check (safe) failed: caseId={case_id}, error={str(e)}",
            )
            return {"exists": False}
