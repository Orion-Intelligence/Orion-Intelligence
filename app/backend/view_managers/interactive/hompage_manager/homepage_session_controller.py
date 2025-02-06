import ast
from backend.services.redis_manager.redis_controller import redis_controller
from backend.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS, REDIS_DEFAULT
from backend.view_managers.interactive.hompage_manager.shared_model.homepage_callback_model import homepage_callback_model


class homepage_session_controller:

  async def init_callback(self):
    results_dict_day = ast.literal_eval(await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_STAT_DAY, REDIS_DEFAULT.INSIGHT_STAT_DEFAULT, None]))
    results_dict_week = ast.literal_eval(await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_STAT_WEEK, REDIS_DEFAULT.INSIGHT_STAT_DEFAULT, None]))
    combined_statistics = await self.__merge_statistics(results_dict_day, results_dict_week)

    return homepage_callback_model(mHomepageCallbackStatistics=combined_statistics).model_dump()

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
