import json

from backend.management.models.insight_model_comparison import InsightComparisonModel
from backend.services.redis_manager.redis_controller import redis_controller
from backend.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS, REDIS_DEFAULT


class homepage_session_controller:

  @staticmethod
  async def init_callback():
    results = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_STAT, REDIS_DEFAULT.INSIGHT_STAT_DEFAULT, None])
    results = InsightComparisonModel.model_validate(json.loads(results))

    return results

  @staticmethod
  async def __merge_statistics(daily_stats, weekly_stats):
    combined_statistics = {}
    for model_name, day_stats in daily_stats.items():
      week_stats = weekly_stats.get(model_name, [])
      combined_statistics[model_name] = []

      for i, day_item in enumerate(day_stats):
        day_key = list(day_item.keys())[0]
        day_entry = list(day_item.values())[0]
        day_entry["name"] = day_key
        day_entry["daily_change"] = day_entry.pop("change", "-")

        day_entry["icon"] = day_key.replace("/", "")

        if i < len(week_stats):
          week_key = list(week_stats[i].keys())[0]
          if week_key == day_key:
            day_entry["weekly_change"] = list(week_stats[i].values())[0]["change"]
          else:
            day_entry["weekly_change"] = "-"
        else:
          day_entry["weekly_change"] = "-"

        combined_statistics[model_name].append(day_entry)

    return combined_statistics
