import asyncio

from orion.constants.constant import CONSTANTS
from orion.management.jobs.insight_job import insight_job
from orion.services.elastic_manager.elastic_controller import elastic_controller


class cronjob_manager:
    __instance = None

    # Initializations
    @staticmethod
    def get_instance():
        if cronjob_manager.__instance is None:
            cronjob_manager()
        return cronjob_manager.__instance

    def __init__(self):
        if cronjob_manager.__instance is not None:
            pass
        else:
            cronjob_manager.__instance = self

    @staticmethod
    async def __init_handles():
        asyncio.create_task(insight_job.get_instance().update_insights())

    @staticmethod
    async def purge_loop():
        while True:
            await elastic_controller.get_instance().purge_old_records()
            await asyncio.sleep(86400)

    async def init_jobs(self):
        await self.__init_handles()
        asyncio.create_task(cronjob_manager.get_instance().purge_loop())
