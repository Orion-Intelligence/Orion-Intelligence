from datetime import datetime, timezone
from fastapi import HTTPException
from cryptography.fernet import Fernet
from orion.api.interactive.case_manager.models.case_models import (
    CreateCaseRequest,
    CaseResponse,
)
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
        )
        await self._engine.save(record)
        return self._to_response(record, enc)

    async def validate_case_exists(self, case_id: str, current_user) -> CaseResponse:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id)
            & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
        )
        if not record:
            raise HTTPException(status_code=404, detail="Case not found")
        enc = await self._get_enc(str(current_user.tenant_uuid))
        return self._to_response(record, enc)

    async def get_case_by_id(self, case_id: str, current_user) -> CaseResponse:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id)
            & (db_case_model.tenant_uuid == str(current_user.tenant_uuid)),
        )
        if not record:
            raise HTTPException(status_code=404, detail="Case not found")
        enc = await self._get_enc(str(current_user.tenant_uuid))
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
            raise HTTPException(status_code=404, detail="Case not found")

        enc = await self._get_enc(str(current_user.tenant_uuid))
        e = self._encrypt_str

        record.caseType = e(enc, data.caseType)
        record.owner = e(enc, data.owner)
        record.status = e(enc, data.status)
        record.priority = e(enc, data.priority)
        record.intakeSource = e(enc, data.intakeSource)
        record.entityName = e(enc, data.entityName)
        record.socialMediaProfiles = [
            {"platform": e(enc, p.platform), "username": e(enc, p.username)}
            for p in data.socialMediaProfiles
        ]
        record.webUrls = [e(enc, url) for url in data.webUrls]
        record.emails = [e(enc, email) for email in data.emails]
        record.phoneNumbers = [e(enc, phone) for phone in data.phoneNumbers]
        record.additionalIdentifiers = [
            {"type": e(enc, i.type), "value": e(enc, i.value)}
            for i in data.additionalIdentifiers
        ]
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
        record.linkedCaseId = e(enc, data.linkedCaseId) if data.linkedCaseId else None
        record.linkedReason = e(enc, data.linkedReason) if data.linkedReason else None
        record.modifiedDate = datetime.now(timezone.utc)

        await self._engine.save(record)
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
            return {"exists": record is not None}
        except Exception:
            return {"exists": False}
