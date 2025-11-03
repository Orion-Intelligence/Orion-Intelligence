import asyncio
from orion.management.jobs.insight_job import insight_job
from orion.management.jobs.alert_job import alert_job
from orion.services.elastic_manager.elastic_controller import elastic_controller


class cronjob_manager:
    __instance = None

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
    async def purge_loop():
        while True:
            await elastic_controller.get_instance().purge_old_records()
            await asyncio.sleep(86400)

    @staticmethod
    async def __init_handles():
        asyncio.create_task(insight_job.get_instance().update_insights())

    async def init_jobs(self):
        asyncio.create_task(cronjob_manager.purge_loop())
        asyncio.create_task(cronjob_manager.iocs_alert_loop())
        await self.__init_handles()

    @staticmethod
    async def iocs_alert_loop():
        while True:
            await alert_job.get_instance().run_daily_check()
            await asyncio.sleep(20)
