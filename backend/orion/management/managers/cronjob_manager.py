import asyncio
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from interface import BASE_DIR
from orion.constants.constant import allowed_keys
from orion.helper_manager.helper_controller import helper_controller
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
            self.build_assets()

    @staticmethod
    def build_assets():
        build_dir = BASE_DIR / "build"
        helper_controller.build_assets(build_dir)


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
        tz = ZoneInfo("Australia/Sydney")
        while True:
            if len(allowed_keys) <= 0:
                await asyncio.sleep(60)
                continue

            now_local = datetime.now(tz)

            next_run = datetime.combine(now_local.date(), datetime.min.time()).replace(
                hour=2, minute=0, second=0, microsecond=0, tzinfo=tz)
            if now_local >= next_run:
                next_run += timedelta(days=1)

            seconds_until_next = (next_run - now_local).total_seconds()

            await asyncio.sleep(seconds_until_next)

            try:
                await alert_job.get_instance().run_all_categories()
            except Exception as e:
                pass
