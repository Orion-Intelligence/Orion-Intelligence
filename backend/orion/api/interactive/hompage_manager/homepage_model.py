from hashlib import sha256
import json

from orion.services.elastic_manager.elastic_stats_consolidated import elastic_stats_consolidated
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import search_chat_callback_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_callback_model import grouped_consolidated_search_callback_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import search_defacement_callback_model
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import search_exploit_callback_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import search_general_callback_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import search_leak_callback_model
from orion.services.elastic_manager.elastic_controller import elastic_controller
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
        results = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING,
                                                                      [REDIS_KEYS.INSIGHT_STAT,InsightComparisonModel().model_dump_json(),None])
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
    
    @staticmethod
    async def insight_consolidated_result(param: search_consolidated_param_model):
        redis_instance = redis_controller.getInstance()
        
        param_hash = sha256(param.model_dump_json().encode()).hexdigest()
        redis_key = f"{REDIS_KEYS.CONSOLIDATED_STAT}:{param_hash}"
        
        cached = await redis_instance.invoke_trigger(
            REDIS_COMMANDS.S_GET_STRING, [redis_key, None, None]
        )
        
        if cached:
            try:
                print("[Redis] Consolidated result hit")
                return grouped_consolidated_search_callback_model.model_validate(json.loads(cached))
            except Exception as e:
                print(f"[Redis Error] Failed to parse cached consolidated data: {e}")

        print("[Redis] Consolidated result miss – fetching from ES")

        indices, queries = elastic_stats_consolidated().on_insight_consolidated_data(param)
        responses = await elastic_controller.get_instance().search_consolidated_queries(indices, queries)

        leak_data = {}
        general_data = {}
        exploit_data = {}
        chat_data = {}
        defacement_data = {}

        for index, res in zip(indices, responses):
            hits = res.get("hits", {}).get("hits", []) if res else []
            data = {"Result": [hit["_source"] for hit in hits], "Suggestions": [], "Page_Count": len(hits)}

            if index == "leak_model":
                leak_data = data
            elif index == "generic_model":
                general_data = data
            elif index == "exploit_model":
                exploit_data = data
            elif index == "chat_model":
                chat_data = data
            elif index == "defacement_model":
                defacement_data = data

        combined_model = grouped_consolidated_search_callback_model(
            leak_model=search_leak_callback_model(**leak_data),
            exploit_model=search_exploit_callback_model(**exploit_data),
            chat_model=search_chat_callback_model(**chat_data),
            generic_model=search_general_callback_model(**general_data),
            defacement_model=search_defacement_callback_model(**defacement_data)
        )

        await redis_instance.invoke_trigger(
            REDIS_COMMANDS.S_SET_STRING,
            [redis_key, combined_model.model_dump_json(), 86400]
        )

        return combined_model
