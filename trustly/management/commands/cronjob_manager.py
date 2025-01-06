from django.core.management.base import BaseCommand
import ast
from trustly.management.managers.insight_job import insight_job
from trustly.services.elastic_manager.elastic_controller import elastic_controller
from trustly.app.constants.constant import CONSTANTS
from trustly.management.commands.scheduler import RepeatedTimer
from trustly.services.redis_manager.redis_controller import redis_controller
from trustly.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS, REDIS_DEFAULT


class Command(BaseCommand):

  @staticmethod
  def init_handles():
    #insight = ast.literal_eval(redis_controller().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_STAT_DAY, REDIS_DEFAULT.INSIGHT_STAT_DEFAULT, None]))
    #if insight['generic_model'][0]['Document Count']['value'] == 0:
      insight_job.get_instance().init_trending_insights_daily()
      insight_job.get_instance().init_trending_insights_weekly()

  def handle(self, *args, **kwargs):
    self.init_handles()
    RepeatedTimer(CONSTANTS.S_SETTINGS_INDEX_STATS_DAILY_TIMEOUT, insight_job.get_instance().init_trending_insights_daily, False)
    RepeatedTimer(CONSTANTS.S_SETTINGS_INDEX_STATS_WEEKLY_TIMEOUT, insight_job.get_instance().init_trending_insights_weekly, False)
    # RepeatedTimer(CONSTANTS.S_SETTINGS_INDEX_EXPIRY_TIMEOUT, elastic_controller.get_instance().purge_old_records, False)
