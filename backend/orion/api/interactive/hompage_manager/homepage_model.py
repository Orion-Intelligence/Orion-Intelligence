import json

from orion.management.models.insight_model_comparison import InsightComparisonModel
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS


class homepage_model:
  # Private Variables
  __instance = None

  # Initializations
  @staticmethod
  def getInstance():
    if homepage_model.__instance is None:
      homepage_model.__instance = homepage_model()
    return homepage_model.__instance

  @staticmethod
  async def invoke_analytics():
    results = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_STAT, InsightComparisonModel().model_dump_json(), None])

    print(f"Raw Results: {results}")

    if not results:
      print("Error: No data retrieved from Redis")
      return None

    try:
      parsed_results = json.loads(results)
      validated_results = InsightComparisonModel.model_validate(parsed_results)
      return validated_results
    except json.JSONDecodeError as e:
      print(f"JSON Decode Error: {e}")
      return None

