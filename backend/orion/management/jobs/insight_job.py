import asyncio
import json
from datetime import datetime
from orion.constants.constant import CONSTANTS
from orion.management.models.insight_model import GENERIC_AGGREGATION_MAPPING, LEAK_AGGREGATION_MAPPING, InsightData
from orion.management.models.insight_model_comparison import InsightComparisonModel
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS


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
    _, m_documents = await elastic_controller.get_instance().get_insight()
    return m_documents

  @staticmethod
  def populate_comparison_model(insight_old_daily, insight_new, insight_old_weekly=None):
    comparison = InsightComparisonModel()

    REVERSE_GENERIC_MAPPING = {v: k for k, v in GENERIC_AGGREGATION_MAPPING.items()}
    REVERSE_LEAK_MAPPING = {v: k for k, v in LEAK_AGGREGATION_MAPPING.items()}

    for section in ["general", "leak"]:
      old_model_daily = getattr(insight_old_daily, section)
      new_model = getattr(insight_new, section)
      comparison_model = getattr(comparison, section)
      mapping = REVERSE_GENERIC_MAPPING if section == "general" else REVERSE_LEAK_MAPPING

      for field in new_model.__dict__:
        new_value = getattr(new_model, field)
        old_value_daily = getattr(old_model_daily, field)
        old_value_weekly = getattr(getattr(insight_old_weekly, section), field) if insight_old_weekly else None

        if isinstance(new_value, datetime):
          new_value = new_value.date().isoformat()

        if isinstance(new_value, int) and isinstance(old_value_daily, int):
          if (new_value < 0 and old_value_daily == 0) or (new_value == old_value_daily):
            change_percentage_daily = "0%"
          elif old_value_daily != 0:
            change_percentage_daily = f"{((new_value - old_value_daily) / abs(old_value_daily)) * 100:.2f}%"
          elif old_value_daily == 0 and new_value != 0:
            change_percentage_daily = "100%"
          else:
            change_percentage_daily = "-"
        else:
          change_percentage_daily = "-"

        if isinstance(new_value, int) and old_value_weekly is not None and isinstance(old_value_weekly, int):
          if (new_value < 0 and old_value_weekly == 0) or (new_value == old_value_weekly):
            change_percentage_weekly = "0%"
          elif old_value_weekly != 0:
            change_percentage_weekly = f"{((new_value - old_value_weekly) / abs(old_value_weekly)) * 100:.2f}%"
          elif old_value_weekly == 0 and new_value != 0:
            change_percentage_weekly = "100%"
          else:
            change_percentage_weekly = "-"
        else:
          change_percentage_weekly = "-"

        metric = getattr(comparison_model, field)
        metric.key = mapping.get(field, field)
        metric.value = new_value

        if isinstance(new_value, int):
          metric.change_daily = change_percentage_daily
          metric.change_weekly = change_percentage_weekly

    return comparison

  async def update_trending_insights(self, args):
    try:
      insight_new = await self.__fetch_elastic_insight()
      insight_old_daily = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_OLD_DAY, None, None])
      insight_old_weekly = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_OLD_WEEK, None, None])

      print("::::::::::::::::::::::::::::::::::::::")
      print("::::::::::::::::::::::::::::::::::::::")
      print(insight_new)
      print("::::::::::::::::::::::::::::::::::::::")
      print("::::::::::::::::::::::::::::::::::::::")

      if insight_old_daily is None:
        insight_old_daily = InsightData()
      else:
        insight_old_daily = InsightData.model_validate(json.loads(insight_old_daily))

      if insight_old_weekly is None:
        insight_old_weekly = InsightData()
      else:
        insight_old_weekly = InsightData.model_validate(json.loads(insight_old_weekly))

      insight_comparison = self.populate_comparison_model(insight_old_daily, insight_new, insight_old_weekly)

      await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_STAT, insight_comparison.model_dump_json(), None])
      if args == REDIS_KEYS.INSIGHT_OLD_DAY:
        await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_OLD_DAY, insight_new.model_dump_json(), None])

      if args == REDIS_KEYS.INSIGHT_OLD_WEEK:
        await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_OLD_WEEK, insight_new.model_dump_json(), None])

    except Exception as ex:
      print(ex)
      return

  async def update_insights(self):
    await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_OLD_DAY, None, None])
    await self.update_trending_insights(REDIS_KEYS.INSIGHT_OLD_DAY)
    day_counter = 0
    while True:
      day_counter += 1
      await asyncio.sleep(CONSTANTS.S_SETTINGS_INDEX_STATS_DAILY_TIMEOUT)
      if day_counter >= 7:
        await self.update_trending_insights(REDIS_KEYS.INSIGHT_OLD_WEEK)
        day_counter = 0
      else:
        await self.update_trending_insights(REDIS_KEYS.INSIGHT_OLD_DAY)
