from typing import Optional

from orion.api.interactive.job_manager.models.job_models import CreateJobPostRequest
from orion.api.interactive.job_manager.models.job_models import JobPostListResponse
from orion.api.interactive.job_manager.models.job_models import JobPostResponse
from orion.api.interactive.job_manager.models.job_models import UpdateJobPostRequest
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_job_model import db_job_post_model


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

    async def list_posts(self, current_user) -> JobPostListResponse:
        raise NotImplementedError

    async def get_post(self, job_id: str, current_user) -> JobPostResponse:
        raise NotImplementedError

    async def create_post(self, payload: CreateJobPostRequest, current_user) -> JobPostResponse:
        raise NotImplementedError

    async def update_post(self, job_id: str, payload: UpdateJobPostRequest, current_user) -> JobPostResponse:
        raise NotImplementedError

    async def publish_post(self, job_id: str, current_user) -> JobPostResponse:
        raise NotImplementedError

    async def expire_post(self, job_id: str, current_user) -> JobPostResponse:
        raise NotImplementedError

    async def archive_post(self, job_id: str, current_user) -> dict:
        raise NotImplementedError
