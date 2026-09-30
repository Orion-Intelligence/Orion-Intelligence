from typing import Optional

from fastapi.responses import Response

from orion.api.interactive.job_manager.models.job_models import ApplicationDetailResponse
from orion.api.interactive.job_manager.models.job_models import ApplicationListResponse
from orion.api.interactive.job_manager.models.job_models import ContactApplicantRequest
from orion.api.interactive.job_manager.models.job_models import UpdateApplicationStatusRequest
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_job_model import APPLICATION_STATUS_FLOW
from orion.services.mongo_manager.shared_model.db_job_model import APPLICATION_TERMINAL_STATUSES
from orion.services.mongo_manager.shared_model.db_job_model import ApplicationStatus
from orion.services.mongo_manager.shared_model.db_job_model import db_job_application_model


class JobApplicationManager:
    __instance = None

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        if JobApplicationManager.__instance is not None:
            raise Exception("This class is a singleton!")
        JobApplicationManager.__instance = self

    @staticmethod
    def get_instance():
        if JobApplicationManager.__instance is None:
            JobApplicationManager()
        return JobApplicationManager.__instance

    async def _find_application_record(self, application_id: str, current_user) -> Optional[db_job_application_model]:
        return await self._engine.find_one(
            db_job_application_model,
            (db_job_application_model.applicationId == application_id)
            & (db_job_application_model.tenant_id == str(current_user.tenant_id)),
        )

    @staticmethod
    def assert_status_transition(from_status: ApplicationStatus, to_status: ApplicationStatus) -> None:
        raise NotImplementedError

    async def list_applications(self, job_id: str, current_user) -> ApplicationListResponse:
        raise NotImplementedError

    async def get_application(self, application_id: str, current_user) -> ApplicationDetailResponse:
        raise NotImplementedError

    async def update_status(self, application_id: str, payload: UpdateApplicationStatusRequest, current_user) -> ApplicationDetailResponse:
        raise NotImplementedError

    async def resume_file_response(self, application_id: str, current_user) -> Response:
        raise NotImplementedError

    async def contact_applicant(self, application_id: str, payload: ContactApplicantRequest, current_user) -> dict:
        raise NotImplementedError
