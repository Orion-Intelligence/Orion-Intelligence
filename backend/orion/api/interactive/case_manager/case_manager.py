from datetime import datetime, timezone
from fastapi import HTTPException
from orion.api.interactive.case_manager.models.case_models import CreateCaseRequest, CaseResponse
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_case_model import db_case_model


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

    def _to_response(self, record: db_case_model) -> CaseResponse:
        return CaseResponse(
            id=str(record.id),
            caseId=record.caseId,
            caseType=record.caseType,
            owner=record.owner,
            createdDate=record.createdDate,
            modifiedDate=record.modifiedDate,
            status=record.status,
            priority=record.priority,
            intakeSource=record.intakeSource,
            entityName=record.entityName,
            socialMediaProfiles=[
                {
                    "platform": p.platform,
                    "username": p.username,
                }
                for p in record.socialMediaProfiles
            ],
            webUrls=record.webUrls,
            emails=record.emails,
            phoneNumbers=record.phoneNumbers,
            additionalIdentifiers=[
                {
                    "type": i.type,
                    "value": i.value,
                }
                for i in record.additionalIdentifiers
            ],
            relatedEntities=[
                {
                    "name": e.name,
                    "socialMediaProfiles": [
                        {
                            "platform": p.platform,
                            "username": p.username,
                        }
                        for p in e.socialMediaProfiles
                    ],
                    "webUrls": e.webUrls,
                    "emails": e.emails,
                    "phoneNumbers": e.phoneNumbers,
                    "additionalIdentifiers": [
                        {
                            "type": i.type,
                            "value": i.value,
                        }
                        for i in e.additionalIdentifiers
                    ],
                }
                for e in record.relatedEntities
            ],
            linkedCaseId=record.linkedCaseId,
            linkedReason=record.linkedReason,
        )

    async def get_cases(self, current_user) -> list[CaseResponse]:
        records = await self._engine.find(
            db_case_model,
            db_case_model.tenant_uuid == str(current_user.tenant_uuid)
        )
        return [self._to_response(r) for r in records]

    async def create_case(self, data: CreateCaseRequest, current_user) -> CaseResponse:
        existing = await self._engine.find_one(
            db_case_model,
            db_case_model.caseId == data.caseId
        )
        if existing:
            raise HTTPException(status_code=400, detail="Case ID already exists")

        record = db_case_model(
            caseId=data.caseId,
            caseType=data.caseType,
            owner=data.owner,
            status=data.status,
            priority=data.priority,
            intakeSource=data.intakeSource,
            entityName=data.entityName,
            socialMediaProfiles=[p.model_dump() for p in data.socialMediaProfiles],
            webUrls=data.webUrls,
            emails=data.emails,
            phoneNumbers=data.phoneNumbers,
            additionalIdentifiers=[i.model_dump() for i in data.additionalIdentifiers],
            relatedEntities=[
                {
                    **e.model_dump(exclude={"socialMediaProfiles", "additionalIdentifiers"}),
                    "socialMediaProfiles": [p.model_dump() for p in e.socialMediaProfiles],
                    "additionalIdentifiers": [i.model_dump() for i in e.additionalIdentifiers],
                }
                for e in data.relatedEntities
            ],
            linkedCaseId=data.linkedCaseId,
            linkedReason=data.linkedReason,
            tenant_uuid=str(current_user.tenant_uuid),
        )
        await self._engine.save(record)
        return self._to_response(record)

    async def validate_case_exists(self, case_id: str, current_user) -> CaseResponse:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id) &
            (db_case_model.tenant_uuid == str(current_user.tenant_uuid))
        )
        if not record:
            raise HTTPException(status_code=404, detail="Case not found")
        return self._to_response(record)

    async def get_case_by_id(self, case_id: str, current_user) -> CaseResponse:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id) &
            (db_case_model.tenant_uuid == str(current_user.tenant_uuid))
        )
        if not record:
            raise HTTPException(status_code=404, detail="Case not found")
        return self._to_response(record)

    async def update_case(self, case_id: str, data: CreateCaseRequest, current_user) -> CaseResponse:
        record = await self._engine.find_one(
            db_case_model,
            (db_case_model.caseId == case_id) &
            (db_case_model.tenant_uuid == str(current_user.tenant_uuid))
        )
        if not record:
            raise HTTPException(status_code=404, detail="Case not found")
        
        record.caseType = data.caseType
        record.owner = data.owner
        record.status = data.status
        record.priority = data.priority
        record.intakeSource = data.intakeSource
        record.entityName = data.entityName
        record.socialMediaProfiles = [p.model_dump() for p in data.socialMediaProfiles]
        record.webUrls = data.webUrls
        record.emails = data.emails
        record.phoneNumbers = data.phoneNumbers
        record.additionalIdentifiers = [i.model_dump() for i in data.additionalIdentifiers]
        record.relatedEntities = [
            {
                **e.model_dump(exclude={"socialMediaProfiles", "additionalIdentifiers"}),
                "socialMediaProfiles": [p.model_dump() for p in e.socialMediaProfiles],
                "additionalIdentifiers": [i.model_dump() for i in e.additionalIdentifiers],
            }
            for e in data.relatedEntities
        ]
        record.linkedCaseId = data.linkedCaseId
        record.linkedReason = data.linkedReason
        record.modifiedDate = datetime.now(timezone.utc)
        
        await self._engine.save(record)
        return self._to_response(record)

    async def get_next_case_id(self, current_user) -> dict:
        records = await self._engine.find(
            db_case_model,
            db_case_model.tenant_uuid == str(current_user.tenant_uuid)
        )
        next_id = str(len(records) + 1).zfill(5)
        return {"nextCaseId": next_id}

    async def check_case_exists_safe(self, case_id: str, current_user) -> dict:
        """Safe check without raising exceptions - returns exists flag"""
        try:
            record = await self._engine.find_one(
                db_case_model,
                (db_case_model.caseId == case_id) &
                (db_case_model.tenant_uuid == str(current_user.tenant_uuid))
            )
            return {"exists": record is not None}
        except Exception:
            return {"exists": False}