from django.core.management.base import BaseCommand
from trustly.management.managers.insight_job import insight_job
from trustly.app.constants.constant import CONSTANTS
from trustly.management.commands.scheduler import RepeatedTimer


class Command(BaseCommand):

  @staticmethod
  def init_handles():
    insight_job.get_instance().init_trending_insights_daily()
    insight_job.get_instance().init_trending_insights_weekly()

  def handle(self, *args, **kwargs):
    self.init_handles()
    #RepeatedTimer(CONSTANTS.S_SETTINGS_INDEX_EXPIRY_TIMEOUT, elastic_controller.get_instance().purge_old_records, False)
    RepeatedTimer(CONSTANTS.S_SETTINGS_INDEX_STATS_DAILY_TIMEOUT, insight_job.get_instance().init_trending_insights_daily, False)
    RepeatedTimer(CONSTANTS.S_SETTINGS_INDEX_STATS_WEEKLY_TIMEOUT, insight_job.get_instance().init_trending_insights_weekly, False)
