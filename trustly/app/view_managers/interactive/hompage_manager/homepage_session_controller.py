import ast
from trustly.app.constants.constant import CONSTANTS
from trustly.app.constants.strings import GENERAL_STRINGS
from trustly.app.helper_manager.helper_controller import helper_controller
from trustly.app.view_managers.interactive.hompage_manager.homepage_enums import HOMEPAGE_CALLBACK, HOMEPAGE_PARAM, HOMEPAGE_SESSION_COMMANDS
from trustly.services.redis_manager.redis_controller import redis_controller
from trustly.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS, REDIS_DEFAULT
from trustly.services.request_manager.request_handler import request_handler


class homepage_session_controller(request_handler):

  @staticmethod
  def __init_parameters(p_data):
    results_dict_day = ast.literal_eval(redis_controller().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_STAT_DAY, REDIS_DEFAULT.INSIGHT_STAT_DEFAULT, None]))
    results_dict_week = ast.literal_eval(redis_controller().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_STAT_WEEK, REDIS_DEFAULT.INSIGHT_STAT_DEFAULT, None]))

    combined_statistics = homepage_session_controller.merge_statistics(results_dict_day, results_dict_week)

    m_context = {HOMEPAGE_CALLBACK.M_SECURE_SERVICE_NOTICE: GENERAL_STRINGS.S_GENERAL_HTTP, HOMEPAGE_CALLBACK.M_STATISTICS: combined_statistics, }

    if HOMEPAGE_PARAM.M_SECURE_SERVICE in p_data.GET:
      m_context[HOMEPAGE_CALLBACK.M_SECURE_SERVICE_NOTICE] = p_data.GET[HOMEPAGE_PARAM.M_SECURE_SERVICE]

    return m_context, True

  @staticmethod
  def merge_statistics(daily_stats, weekly_stats):
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

  def invoke_trigger(self, p_command, p_data):
    if p_command == HOMEPAGE_SESSION_COMMANDS.M_INIT:
      return self.__init_parameters(p_data)
