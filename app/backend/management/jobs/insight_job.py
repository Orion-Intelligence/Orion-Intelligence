from datetime import datetime, timezone
from backend.services.elastic_manager.elastic_controller import elastic_controller
from backend.services.elastic_manager.elastic_enums import ELASTIC_KEYS
from backend.services.redis_manager.redis_controller import redis_controller
from backend.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS, REDIS_DEFAULT


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
  async def __fetch_elastic_insight(grouped_results):
    m_status, m_documents = await elastic_controller.get_instance().get_insight()

    if m_status and isinstance(m_documents, list):
      for doc in m_documents:
        query_type = doc.get("query", {}).get(ELASTIC_KEYS.S_DOCUMENT, "unknown")
        result = doc.get("result", None)
        error = doc.get("error_manager", None)

        if result:
          result_body = result.body if hasattr(result, 'body') else result
          aggregations = result_body.get("aggregations", {})

          if aggregations:
            for agg_name, agg_value in aggregations.items():
              if agg_name in ["Most Recent", "Oldest Update"]:
                epoch_value = agg_value.get("value", None)
                epoch_value = epoch_value or 0
                if epoch_value:
                  date_value = datetime.fromtimestamp(epoch_value / 1000, timezone.utc).strftime("%d %b")
                  grouped_results[query_type].append({agg_name: date_value})
                else:
                  grouped_results[query_type].append({agg_name: "0"})
              elif agg_name == "Common Type":
                buckets = agg_value.get("buckets", [])
                if buckets:
                  most_common_type = buckets[0].get("key", "general")
                  grouped_results[query_type].append({agg_name: most_common_type})
                else:
                  grouped_results[query_type].append({agg_name: "general"})
              else:
                value = agg_value.get("value", None) or 0
                grouped_results[query_type].append({agg_name: value})
        elif error:
          grouped_results[query_type].append({"error_manager": error})

      for query_type, results in grouped_results.items():
        document_count = next((item.get("Document Count") for item in results if "Document Count" in item), 0) or 1
        for item in results:
          for key, value in item.items():
            if key.endswith("/Document") and document_count > 0:
              item[key] = round(value / document_count, 4)

    return grouped_results

  @staticmethod
  async def generate_insight_comparison(insight_old, insight_new):
    try:
      old_data = eval(insight_old)
      new_data = eval(insight_new)

      key_order_generic = ['Document Count', 'Most Recent', 'Oldest Update', 'Updated 5 Days ago', 'Updated 9 Days ago', 'Average Score', 'URL/Document', 'Archive/Document', 'Email/Document', 'Phone/Document', 'Clearnet/Document', 'Common Type']
      key_order_leak = ['Most Recent', 'Unique Base URLs', 'Dumps/Document', 'Updated 5 Days ago', 'Oldest Update', 'URL/Documents', 'Document Count', 'Updated 9 Days ago']

      comparison_result = {"generic_model": [], "leak_model": []}

      for key, key_order in zip(comparison_result.keys(), [key_order_generic, key_order_leak]):
        old_entries = {list(e.keys())[0]: list(e.values())[0] for e in old_data.get(key, []) if isinstance(e, dict)}
        new_entries = {list(e.keys())[0]: list(e.values())[0] for e in new_data.get(key, []) if isinstance(e, dict)}

        for metric in key_order:
          new_value = round(new_entries.get(metric, 0), 5) if isinstance(new_entries.get(metric, 0), (int, float)) else new_entries.get(metric, 0)
          old_value = round(old_entries.get(metric, 0), 5) if isinstance(old_entries.get(metric, 0), (int, float)) else old_entries.get(metric, 0)

          if isinstance(new_value, (int, float)) and isinstance(old_value, (int, float)):
            if old_value == 0:
              change = f"+{new_value:0.2f}%" if new_value > 0 else f"{new_value:0.2f}%"
            else:
              percentage_change = ((new_value - old_value) / abs(old_value)) * 100
              sign = "+" if percentage_change > 0 else ""
              change = f"{sign}{percentage_change:0.2f}%"
          else:
            change = "-"

          comparison_result[key].append({metric: {"value": new_value, "change": change}})

      return str(comparison_result)

    except Exception as e:
      return f"Error processing insights: {str(e)}"

  @staticmethod
  async def get_trending_insights():
    insight_old = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_NEW_DAY, REDIS_DEFAULT.INSIGHT_DEFAULT, None])
    print(insight_old)
    insight = eval(insight_old)

    return insight

  async def init_trending_insights_daily(self):
    results_dict, grouped_results = {}, {"generic_model": [], "leak_model": []}

    try:
      results_dict = await self.__fetch_elastic_insight(grouped_results)
    except Exception as _:
      return

    insight_old = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_NEW_DAY, REDIS_DEFAULT.INSIGHT_DEFAULT, None])

    insight_new = str(results_dict)
    trending_insight = await self.generate_insight_comparison(insight_old, insight_new)

    await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_OLD_DAY, insight_old, None])
    await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_NEW_DAY, insight_new, None])
    await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_STAT_DAY, trending_insight, None])

  async def init_trending_insights_weekly(self):
    results_dict, grouped_results = {}, {"generic_model": [], "leak_model": []}

    try:
      results_dict = await self.__fetch_elastic_insight(grouped_results)
    except Exception as _:
      return

    insight_old = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_NEW_WEEK, REDIS_DEFAULT.INSIGHT_DEFAULT, None])
    insight_new = str(results_dict)
    trending_insight = await self.generate_insight_comparison(insight_old, insight_new)

    await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_OLD_WEEK, insight_old, None])
    await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_NEW_WEEK, insight_new, None])
    await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_STAT_WEEK, trending_insight, None])
