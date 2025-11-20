import asyncio
import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
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
        tz = ZoneInfo("Australia/Sydney")
        while True:
            now_local = datetime.now(tz)
            now_local = datetime.now(tz)

            next_midnight = datetime.combine(now_local.date(), datetime.min.time()).replace(tzinfo=tz)
            if now_local >= next_midnight:
                next_midnight += timedelta(days=1)

            seconds_until_next = (next_midnight - now_local).total_seconds()

            print(f"[{datetime.utcnow()}] Next alert run scheduled in {seconds_until_next/3600:.2f} hours")

            await asyncio.sleep(seconds_until_next)

            try:
                print(f"[{datetime.utcnow()}] Running all category alert jobs for {next_midnight.date()}")
                await alert_job.get_instance().run_all_categories()
            except Exception as e:
                print(f"[{datetime.utcnow()}] ALERT JOB ERROR: {e}")
