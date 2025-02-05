from backend.management.jobs.insight_job import insight_job
from backend.constants.constant import CONSTANTS
from backend.management.managers.scheduler import RepeatedTimer


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
      await insight_job.get_instance().init_trending_insights_daily()
      await insight_job.get_instance().init_trending_insights_weekly()

  async def init(self):
    await self.__init_handles()
    RepeatedTimer(CONSTANTS.S_SETTINGS_INDEX_STATS_DAILY_TIMEOUT, insight_job.get_instance().init_trending_insights_daily, False)
    RepeatedTimer(CONSTANTS.S_SETTINGS_INDEX_STATS_WEEKLY_TIMEOUT, insight_job.get_instance().init_trending_insights_weekly, False)
    # RepeatedTimer(CONSTANTS.S_SETTINGS_INDEX_EXPIRY_TIMEOUT, elastic_controller.get_instance().purge_old_records, False)
