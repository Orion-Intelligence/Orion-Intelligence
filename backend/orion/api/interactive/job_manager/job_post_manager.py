from typing import List
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.job_manager.models.job_models import CreateJobPostRequest
from orion.api.interactive.job_manager.models.job_models import JobPostListResponse
from orion.api.interactive.job_manager.models.job_models import JobPostResponse
from orion.api.interactive.job_manager.models.job_models import ScreeningQuestionModel
from orion.api.interactive.job_manager.models.job_models import UpdateJobPostRequest
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_job_model import EDITABLE_JOB_POST_STATUSES
from orion.services.mongo_manager.shared_model.db_job_model import JobPostStatus
from orion.services.mongo_manager.shared_model.db_job_model import ScreeningQuestion
from orion.services.mongo_manager.shared_model.db_job_model import db_job_post_model
from orion.services.mongo_manager.shared_model.db_job_model import utc_now


class JobPostManager:
    __instance = None

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        if JobPostManager.__instance is not None:
            raise Exception("This class is a singleton!")
        JobPostManager.__instance = self

    @staticmethod
    def get_instance():
        if JobPostManager.__instance is None:
            JobPostManager()
        return JobPostManager.__instance

    async def _find_job_record(self, job_id: str, current_user) -> Optional[db_job_post_model]:
        return await self._engine.find_one(
            db_job_post_model,
            (db_job_post_model.jobId == job_id)
            & (db_job_post_model.tenant_id == str(current_user.tenant_id)),
        )

    async def _load_job_record(self, job_id: str, current_user) -> db_job_post_model:
        record = await self._find_job_record(job_id, current_user)
        if record is None or record.isArchived:
            raise HTTPException(status_code=404, detail="Job post not found")
        return record

    @staticmethod
    def _build_screening_questions(questions: List[ScreeningQuestionModel]) -> List[ScreeningQuestion]:
        return [
            ScreeningQuestion(
                questionId=question.questionId or str(uuid4()),
                prompt=question.prompt,
                answerType=question.answerType,
                choices=list(question.choices),
                required=question.required,
            )
            for question in questions
        ]

    @classmethod
    def _apply_mutation(cls, record: db_job_post_model, payload) -> None:
        record.title = payload.title
        record.shortDescription = payload.shortDescription
        record.description = payload.description
        record.keyResponsibilities = list(payload.keyResponsibilities)

        record.role = payload.role
        record.roleOtherValue = payload.roleOtherValue
        record.engagementType = payload.engagementType
        record.clearanceLevel = payload.clearanceLevel
        record.workMode = payload.workMode
        record.location = payload.location

        record.requiredCertifications = list(payload.requiredCertifications)
        record.additionalCertifications = list(payload.additionalCertifications)
        record.frameworkExperience = list(payload.frameworkExperience)
        record.additionalFrameworks = list(payload.additionalFrameworks)
        record.technicalStack = list(payload.technicalStack)

        record.salaryMin = payload.salaryMin
        record.salaryMax = payload.salaryMax
        record.salaryCurrency = payload.salaryCurrency
        record.salaryPeriod = payload.salaryPeriod
        record.salaryUndisclosed = payload.salaryUndisclosed

        if payload.screeningQuestions is not None:
            record.screeningQuestions = cls._build_screening_questions(payload.screeningQuestions)

        record.audience = payload.audience
        record.expiresAt = payload.expiresAt

    @staticmethod
    def _to_response(record: db_job_post_model) -> JobPostResponse:
        data = {
            "jobId": record.jobId,
            "tenant_id": record.tenant_id,
            "title": record.title,
            "shortDescription": record.shortDescription,
            "description": record.description,
            "keyResponsibilities": list(record.keyResponsibilities),
            "role": record.role,
            "roleOtherValue": record.roleOtherValue,
            "engagementType": record.engagementType,
            "clearanceLevel": record.clearanceLevel,
            "workMode": record.workMode,
            "location": record.location,
            "requiredCertifications": list(record.requiredCertifications),
            "additionalCertifications": list(record.additionalCertifications),
            "frameworkExperience": list(record.frameworkExperience),
            "additionalFrameworks": list(record.additionalFrameworks),
            "technicalStack": list(record.technicalStack),
            "salaryMin": record.salaryMin,
            "salaryMax": record.salaryMax,
            "salaryCurrency": record.salaryCurrency,
            "salaryPeriod": record.salaryPeriod,
            "salaryUndisclosed": record.salaryUndisclosed,
            "screeningQuestions": [question.dict() for question in record.screeningQuestions],
            "audience": record.audience,
            "status": record.status,
            "applicationCount": record.applicationCount,
            "createdBy": record.createdBy,
            "createdAt": record.createdAt,
            "updatedAt": record.updatedAt,
            "publishedAt": record.publishedAt,
            "expiresAt": record.expiresAt,
            "closedAt": record.closedAt,
        }
        return JobPostResponse(**data)

    async def _audit(self, current_user, message: str) -> None:
        await AuditLogManager.get_instance().register(
            str(current_user.tenant_id), str(current_user.id), message
        )

    async def create_post(self, payload: CreateJobPostRequest, current_user) -> JobPostResponse:
        now = utc_now()
        record = db_job_post_model(
            jobId=str(uuid4()),
            tenant_id=str(current_user.tenant_id),
            title=payload.title,
            role=payload.role,
            engagementType=payload.engagementType,
            status=JobPostStatus.DRAFT,
            createdBy=str(current_user.id),
            createdAt=now,
            updatedAt=now,
        )
        self._apply_mutation(record, payload)
        await self._engine.save(record)
        await self._audit(current_user, f"Job post created: jobId={record.jobId}, title={record.title}")
        return self._to_response(record)

    async def get_post(self, job_id: str, current_user) -> JobPostResponse:
        record = await self._load_job_record(job_id, current_user)
        return self._to_response(record)

    async def update_post(self, job_id: str, payload: UpdateJobPostRequest, current_user) -> JobPostResponse:
        record = await self._load_job_record(job_id, current_user)

        if record.status not in EDITABLE_JOB_POST_STATUSES:
            raise HTTPException(status_code=409, detail="A closed job post cannot be edited")

        self._apply_mutation(record, payload)
        record.updatedAt = utc_now()
        await self._engine.save(record)
        await self._audit(current_user, f"Job post updated: jobId={record.jobId}")
        return self._to_response(record)

    async def list_posts(self, current_user) -> JobPostListResponse:
        raise NotImplementedError

    async def publish_post(self, job_id: str, current_user) -> JobPostResponse:
        raise NotImplementedError

    async def expire_post(self, job_id: str, current_user) -> JobPostResponse:
        raise NotImplementedError

    async def archive_post(self, job_id: str, current_user) -> dict:
        raise NotImplementedError
