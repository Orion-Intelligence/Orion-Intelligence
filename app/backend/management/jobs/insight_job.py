import asyncio
import json
from datetime import datetime
from backend.constants.constant import CONSTANTS
from backend.management.models.insight_model import GENERIC_AGGREGATION_MAPPING, LEAK_AGGREGATION_MAPPING, InsightData
from backend.management.models.insight_model_comparison import InsightComparisonModel
from backend.services.elastic_manager.elastic_controller import elastic_controller
from backend.services.redis_manager.redis_controller import redis_controller
from backend.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS


class insight_job:
  __instance = None

  # Initializations
  @staticmethod
  def get_instance():
    if insight_job.__instance is None:
      insight_job()
    return insight_job.__instance

  def __init__(self):
    if insight_job.__instance is not None:
      pass
    else:
      insight_job.__instance = self
      self.__m_session = insight_job()

  @staticmethod
  async def __fetch_elastic_insight():
    m_status, m_documents = await elastic_controller.get_instance().get_insight()
    return m_documents

  @staticmethod
  def populate_comparison_model(insight_old, insight_new, daily: bool):
    comparison = InsightComparisonModel()

    REVERSE_GENERIC_MAPPING = {v: k for k, v in GENERIC_AGGREGATION_MAPPING.items()}
    REVERSE_LEAK_MAPPING = {v: k for k, v in LEAK_AGGREGATION_MAPPING.items()}

    for section in ["general", "leak"]:
      old_model = getattr(insight_old, section)
      new_model = getattr(insight_new, section)
      comparison_model = getattr(comparison, section)
      mapping = REVERSE_GENERIC_MAPPING if section == "general" else REVERSE_LEAK_MAPPING

      for field in new_model.__dict__:
        new_value = getattr(new_model, field)
        old_value = getattr(old_model, field)

        if isinstance(new_value, datetime):
          new_value = new_value.date().isoformat()

        if isinstance(new_value, int) and isinstance(old_value, int):
          if new_value == 0 and old_value == 0:
            change_percentage = "0%"
          elif old_value != 0:
            change_percentage = f"{((new_value - old_value) / abs(old_value)) * 100:.2f}%"
          elif old_value == 0 and new_value != 0:
            change_percentage = "100%"
          else:
            change_percentage = "-"
        else:
          change_percentage = "-"

        metric = getattr(comparison_model, field)
        metric.key = mapping.get(field, field)
        metric.value = new_value

        if isinstance(new_value, int):
          if daily:
            metric.change_daily = change_percentage
          else:
            metric.change_weekly = change_percentage

    return comparison

  @staticmethod
  async def get_trending_insights():
    insight_old = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_NEW_DAY, json.dumps(InsightData().model_dump()), None])
    insight = eval(insight_old)

    return insight

  async def update_trending_insights(self, args):
    try:
      insight_new = await self.__fetch_elastic_insight()
      insight_old = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [args, None, None])
      if insight_old is None:
        insight_old = InsightData()
      else:
        insight_old = InsightData.model_validate(json.loads(insight_old))

      insight_comparison = self.populate_comparison_model(insight_old, insight_new, args == REDIS_KEYS.INSIGHT_NEW_DAY)
      await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_OLD_DAY, insight_old.model_dump_json(), None])
      await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_NEW_DAY, insight_new.model_dump_json(), None])
      await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_STAT, insight_comparison.model_dump_json(), None])
    except Exception as ex:
      print(ex)
      return

  async def update_trending_insights_daily(self, args):
    while True:
      await self.update_trending_insights(args)
      await asyncio.sleep(CONSTANTS.S_SETTINGS_INDEX_STATS_DAILY_TIMEOUT)


  async def update_trending_insights_weekly(self, args):
    while True:
      await self.update_trending_insights(args)
      await asyncio.sleep(CONSTANTS.S_SETTINGS_INDEX_STATS_WEEKLY_TIMEOUT)
