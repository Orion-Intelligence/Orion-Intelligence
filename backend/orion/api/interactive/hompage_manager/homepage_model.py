import json
from datetime import datetime

from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.management.models.insight_model_comparison import InsightComparisonModel
from orion.services.log_manager.log_controller import log
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
from orion.services.elastic_manager.elastic_insight_generator import elastic_insight_generator
from orion.services.elastic_manager.elastic_controller import elastic_controller


class homepage_model:
    __instance = None

    @staticmethod
    def getInstance():
        if homepage_model.__instance is None:
            homepage_model.__instance = homepage_model()
        return homepage_model.__instance

    @staticmethod
    async def invoke_analytics():
        results = await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_STAT, InsightComparisonModel().model_dump_json(), None])
        if not results:
            log.g().ex("Error: No data retrieved from Redis")
            return None

        try:
            parsed_results = json.loads(results)
            validated_results = InsightComparisonModel.model_validate(parsed_results)

            return validated_results
        except json.JSONDecodeError as ex:
            log.g().ex(f"JSON Decode Error: {ex}")
            return None

    @staticmethod
    async def insight_consolidated_result():
        redis_instance = redis_controller.getInstance()
        redis_key = f"{REDIS_KEYS.APP_INSIGHT_KEY}"

        indices, queries = elastic_insight_generator().on_insight_consolidated_data()
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

        display_data = {"leak_model": [homepage_model.transform_for_display("leak_model", hit["_source"]) for hit in
            leak_hits if "m_hash" in hit.get("_source", {})], "exploit_model": [
            homepage_model.transform_for_display("exploit_model", hit["_source"]) for hit in exploit_hits if
            "m_hash" in hit.get("_source", {})], "chat_model": [
            homepage_model.transform_for_display("chat_model", hit["_source"]) for hit in chat_hits if
            "m_hash" in hit.get("_source", {})], "generic_model": [
            homepage_model.transform_for_display("generic_model", hit["_source"]) for hit in general_hits if
            "m_hash" in hit.get("_source", {})], "defacement_model": [
            homepage_model.transform_for_display("defacement_model", hit["_source"]) for hit in defacement_hits if
            "m_hash" in hit.get("_source", {})], }

        await redis_instance.invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [redis_key, json.dumps(display_data), 1])

        return display_data

    @staticmethod
    async def get_country_specific_insights():
        redis_instance = redis_controller.getInstance()
        redis_key = f"{REDIS_KEYS.APP_INSIGHT_KEY}:country"
        cached = await redis_instance.invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [redis_key])
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                pass

        indices, query = elastic_insight_generator().on_insight_consolidated_country()
        queries = [query.copy() for _ in indices]
        responses = await elastic_controller.get_instance().search_consolidated_queries(indices, queries)

        grouped_results = {
            "leak": [],
            "generic": [],
            "exploit": [],
            "chat": [],
            "social": [],
            "defacement": []
        }

        for index_name, response in zip(indices, responses):
            hits = response.get("hits", {}).get("hits", []) if response else []
            sources = [hit.get("_source", {}) for hit in hits if hit.get("_source", {}).get("m_country")]

            if index_name == ELASTIC_INDEX.S_LEAK_INDEX:
                grouped_results["leak"] = sources
            elif index_name == ELASTIC_INDEX.S_GENERIC_INDEX:
                grouped_results["generic"] = sources
            elif index_name == ELASTIC_INDEX.S_EXPLOIT_INDEX:
                grouped_results["exploit"] = sources
            elif index_name == ELASTIC_INDEX.S_CHATS_INDEX:
                grouped_results["chat"] = sources
            elif index_name == ELASTIC_INDEX.S_SOCIAL_INDEX:
                grouped_results["social"] = sources
            elif index_name == ELASTIC_INDEX.S_DEFACEMENT_INDEX:
                grouped_results["defacement"] = sources

        await redis_instance.invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [redis_key, json.dumps(grouped_results), 86400])
        return grouped_results

    @staticmethod
    def transform_for_display(model_key: str, item: dict) -> dict:

        m_hash = item["m_hash"] or item.get("m_message_id")

        title = item.get("m_title") or item.get("m_name") or item.get("m_caption") or item.get("m_url") or "Untitled"
        display_title = title if len(title) > 20 else title

        date_fields = ["m_update_date", "m_leak_date", "m_message_date", "m_leak_date"]
        raw_date = next((item.get(f) for f in date_fields if item.get(f)), None)

        display_date = homepage_model.parse_date_fallback(raw_date)

        locations = []
        phoneNumbers = []
        urls = []
        if model_key == "defacement_model" and item.get("m_location"):
            if isinstance(item["m_location"], list):
                locations = item["m_location"]
            elif isinstance(item["m_location"], str):
                locations = [loc.strip() for loc in item["m_location"].split(",")]
        elif model_key == "leak_model":
            if item.get("m_country_name"):
                if isinstance(item["m_country_name"], str):
                    locations = [loc.strip() for loc in item["m_country_name"].split(",")]

        location_summary = ", ".join(locations)
        location_summary = location_summary if len(location_summary) > 24 else location_summary

        phoneNumber = phoneNumbers if len(phoneNumbers) > 24 else phoneNumbers

        if "m_url" in item:
            urls.append(item["m_url"])

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

        return {"title": display_title, "date": display_date, "location": location_summary, "phoneNumber": phoneNumber, "url": urls, "source": source, "hash": m_hash, }

    @staticmethod
    def parse_date_fallback(raw_date: str) -> str | None:
        formats = ["%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%fZ"]
        for fmt in formats:
            try:
                dt = datetime.strptime(raw_date, fmt)
                return dt.strftime("%B %d, %Y")
            except Exception:
                continue
        return None
