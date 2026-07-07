import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from interface import BASE_DIR
from orion.constants.constant import allowed_key_titles
from orion.helper_manager.helper_controller import helper_controller
from orion.management.jobs.insight_job import insight_job
from orion.management.jobs.alert.alert_job import alert_job
from orion.management.scheduler import DailyJobConfig, MongoDailyScheduler, IntervalJobConfig
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.log_manager.log_controller import log
from orion.services.redis_manager.redis_enums import REDIS_KEYS


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
        job = insight_job.get_instance()
        await job.update_trending_insights(REDIS_KEYS.INSIGHT_OLD_DAY)
        asyncio.create_task(job.update_insights(run_on_start=False))

    async def init_jobs(self):
        await self.__init_handles()
        asyncio.create_task(cronjob_manager.purge_loop())
        asyncio.create_task(cronjob_manager.iocs_alert_loop())

    @staticmethod
    async def iocs_alert_loop():
        print("1"*100)
        timezone_name = "Australia/Sydney"
        scheduler = MongoDailyScheduler()
        job_config = DailyJobConfig(
            job_key="auto_alert_scan",
            hour=2,
            minute=0,
            timezone_name=timezone_name,
            handler=alert_job.get_instance().run_all_categories,
            stale_after=timedelta(minutes=15),
            heartbeat_interval=timedelta(seconds=60),
        )
        

        tz = ZoneInfo(timezone_name)
        while True:
            if not allowed_key_titles:
                print("2"*100)
                await asyncio.sleep(60)
                continue

            try:
                print("3"*100)
                await scheduler.run_due_daily_job(job_config, reason="startup_or_schedule_check")
            except Exception as e:
                log.g().e(f"IOC alert loop failed: {e}")

            now_local = datetime.now(tz)
            next_run = datetime.combine(now_local.date(), datetime.min.time()).replace(
                hour=job_config.hour, minute=job_config.minute, second=0, microsecond=0, tzinfo=tz)
            if now_local >= next_run:
                next_run += timedelta(days=1)

            seconds_until_next = max(60, (next_run - now_local).total_seconds())
            await asyncio.sleep(seconds_until_next)
