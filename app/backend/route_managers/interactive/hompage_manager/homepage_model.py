import json

from backend.management.models.insight_model_comparison import InsightComparisonModel
from backend.services.redis_manager.redis_controller import redis_controller
from backend.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS, REDIS_DEFAULT


class homepage_model:
  # Private Variables
  __instance = None

  # Initializations
  def __init__(self):
    pass

  @staticmethod
  async def init_page():
    results = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_STAT, REDIS_DEFAULT.INSIGHT_STAT_DEFAULT, None])
    results = InsightComparisonModel.model_validate(json.loads(results))

    return results
