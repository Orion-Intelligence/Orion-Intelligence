import json
from hashlib import sha256
from datetime import datetime

from orion.management.models.insight_model_comparison import InsightComparisonModel
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS


from orion.services.elastic_manager.elastic_latest_document import elastic_latest_document
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import search_chat_callback_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_callback_model import grouped_consolidated_search_callback_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import search_defacement_callback_model
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import search_exploit_callback_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import search_general_callback_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import search_leak_callback_model
from orion.services.elastic_manager.elastic_controller import elastic_controller


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
                                                                      [REDIS_KEYS.INSIGHT_STAT,
                                                                       InsightComparisonModel().model_dump_json(),
                                                                       None])
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
        redis_key = f"{REDIS_KEYS.LATEST_DOCUMENTS}:{param_hash}"
        
        cached = await redis_instance.invoke_trigger(
            REDIS_COMMANDS.S_GET_STRING, [redis_key, None, None]
        )
        
        if cached:
            try:
                print("[Redis] Latest Document result hit")
                return json.loads(cached) 
            except Exception as e:
                print(f"[Redis Error] Failed to parse cached Latest Document data: {e}")

        print("[Redis] Latest Document result miss – fetching from ES")

        indices, queries = elastic_latest_document().on_insight_consolidated_data(param)
        responses = await elastic_controller.get_instance().search_consolidated_queries(indices, queries)


        leak_hits = []
        chat_hits = []
        exploit_hits = []
        general_hits = []
        defacement_hits = []

        for index, res in zip(indices, responses):
            hits = res.get("hits", {}).get("hits", []) if res else []

            if index == "leak_model":
                leak_hits = hits
            elif index == "chat_model":
                chat_hits = hits
            elif index == "exploit_model":
                exploit_hits = hits
            elif index == "generic_model":
                general_hits = hits
            elif index == "defacement_model":
                defacement_hits = hits

        display_data = {
            "leak_model": [homepage_model.transform_for_display("leak_model", hit["_source"]) for hit in leak_hits],
            "exploit_model": [homepage_model.transform_for_display("exploit_model", hit["_source"]) for hit in exploit_hits],
            "chat_model": [homepage_model.transform_for_display("chat_model", hit["_source"]) for hit in chat_hits],
            "generic_model": [homepage_model.transform_for_display("generic_model", hit["_source"]) for hit in general_hits],
            "defacement_model": [homepage_model.transform_for_display("defacement_model", hit["_source"]) for hit in defacement_hits]
        }

        await redis_instance.invoke_trigger(
            REDIS_COMMANDS.S_SET_STRING,
            [redis_key, json.dumps(display_data), 86400]
        )

        return display_data
    

    @staticmethod
    def transform_for_display(model_key: str, item: dict) -> dict:
        hash = item["m_hash"] or item.get("m_message_id")

        title = item.get("m_title") or item.get("m_name") or item.get("m_caption") or item.get("m_url") or "Untitled"
        display_title = title[:15] + " ..." if len(title) > 20 else title

        date_fields = ["m_update_date", "m_date_of_leak", "m_message_date", "m_leak_date"]
        raw_date = next((item.get(f) for f in date_fields if item.get(f)), None)

        display_date = homepage_model.parse_date_fallback(raw_date)

        locations = []
        if model_key == "defacement_model" and item.get("m_location"):
            if isinstance(item["m_location"], list):
                locations = item["m_location"]
            elif isinstance(item["m_location"], str):
                locations = [loc.strip() for loc in item["m_location"].split(",")]
        elif model_key == "leak_model" and item.get("m_country_name"):
            if isinstance(item["m_country_name"], str):
                locations = [loc.strip() for loc in item["m_country_name"].split(",")]
        location_summary = ", ".join(locations)
        location_summary = location_summary[:24] + "..." if len(location_summary) > 24 else location_summary or "-"

        source = "-"
        if model_key == "defacement_model":
            if isinstance(item.get("m_attacker"), list) and item["m_attacker"]:
                source = ", ".join(item["m_attacker"])
            elif item.get("m_team"):
                source = item["m_team"]
        elif model_key in ["exploit_model", "chat_model", "leak_model", "generic_model"]:
            for key in ["m_sender_name", "m_network", "m_company_name", "m_channel_name"]:
                if item.get(key):
                    source = item[key]
                    break

        return {
            "title": display_title,
            "date": display_date,
            "location": location_summary,
            "source": source,
            "hash":hash,
        }
        

    
    @staticmethod
    def parse_date_fallback(raw_date: str) -> str | None:
        formats = [
            "%Y-%m-%dT%H:%M:%S.%f%z",  
            "%Y-%m-%d",               
            "%Y-%m-%dT%H:%M:%S.%fZ" 
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(raw_date, fmt)
                return dt.strftime("%B %d, %Y")
            except Exception:
                continue
        return None
