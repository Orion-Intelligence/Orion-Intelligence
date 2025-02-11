from backend.management.jobs.insight_job import insight_job
from backend.services.redis_manager.redis_enums import REDIS_KEYS


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
      await insight_job.get_instance().update_trending_insights_daily(REDIS_KEYS.INSIGHT_NEW_DAY)
      await insight_job.get_instance().update_trending_insights_weekly(REDIS_KEYS.INSIGHT_NEW_WEEK)

  async def init(self):
    await self.__init_handles()
    # RepeatedTimer(CONSTANTS.S_SETTINGS_INDEX_EXPIRY_TIMEOUT, elastic_controller.get_instance().purge_old_records, False)
