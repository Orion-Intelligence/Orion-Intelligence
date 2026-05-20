import asyncio
import json
from datetime import datetime, timezone
from string import capwords

from orion.constants.constant import CONSTANTS
from orion.management.models.insight_model import (GENERIC_AGGREGATION_MAPPING, LEAK_AGGREGATION_MAPPING, DEFACEMENT_AGGREGATION_MAPPING, InsightData)
from orion.management.models.insight_model_comparison import InsightComparisonModel
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_KEYS, MANAGE_ELASTIC_MESSAGES
from orion.services.log_manager.log_controller import log
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS


class insight_job:
    __instance = None

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
        _, m_documents = await insight_job.get_insight()
        return m_documents

    @staticmethod
    async def get_insight():
        try:
            insight_queries = insight_job.generate_insight_queries()
            insight_data = InsightData()

            for query in insight_queries:
                m_status, result = await elastic_controller.get_instance().search_query(
                    query[ELASTIC_KEYS.S_DOCUMENT],
                    query[ELASTIC_KEYS.S_FILTER],
                )
                if not m_status:
                    continue

                aggs = result.get("aggregations", {})
                m_filter = query[ELASTIC_KEYS.S_DOCUMENT]

                for key in aggs:
                    value = "-"
                    if "value" in aggs[key]:
                        value = aggs[key]["value"]
                    elif "buckets" in aggs[key]:
                        buckets = aggs[key].get("buckets", [])
                        value = capwords(buckets[0]["key"]) if buckets else "-"

                    if key in ["Most Recent", "Oldest Update"] and value and isinstance(value, (int, float)):
                        value = datetime.fromtimestamp(value / 1000, tz=timezone.utc).strftime("%d %b")
                    if isinstance(value, float):
                        value = round(value, 2)

                    if value is not None:
                        if m_filter == ELASTIC_INDEX.S_GENERIC_INDEX and key in GENERIC_AGGREGATION_MAPPING:
                            setattr(insight_data.general, GENERIC_AGGREGATION_MAPPING[key], value)
                        elif m_filter == ELASTIC_INDEX.S_LEAK_INDEX and key in LEAK_AGGREGATION_MAPPING:
                            setattr(insight_data.leak, LEAK_AGGREGATION_MAPPING[key], value)
                        elif m_filter == ELASTIC_INDEX.S_DEFACEMENT_INDEX and key in DEFACEMENT_AGGREGATION_MAPPING:
                            setattr(insight_data.defacement, DEFACEMENT_AGGREGATION_MAPPING[key], value)

            return True, insight_data

        except Exception as ex:
            log.g().e(f"{MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
            return False, None

    @staticmethod
    def generate_insight_queries():
        queries = [
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Most Recent": {"max": {"field": "m_update_date"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Oldest Update": {"min": {"field": "m_update_date"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-5d/d"}}}, "aggs": {"Updated 5 Days ago": {"value_count": {"field": "m_hash"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}}, "aggs": {"Updated 9 Days ago": {"value_count": {"field": "m_hash"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Average Score": {"avg": {"field": "m_validity_score"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"URL/Document": {"value_count": {"field": "m_sub_url"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Archive/Document": {"value_count": {"field": "m_archive_url"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Email/Document": {"value_count": {"field": "m_email"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Phone/Document": {"value_count": {"field": "m_phone_number"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Clearnet/Document": {"value_count": {"field": "m_clearnet_links"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Common Type": {"terms": {"field": "m_content_type", "size": 1}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Unique Base URLs": {"value_count": {"field": "m_base_url"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"URL/Documents": {"value_count": {"field": "m_weblink"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Dumps/Document": {"value_count": {"field": "m_dumplink"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-5d/d"}}}, "aggs": {"Updated 5 Days ago": {"value_count": {"field": "m_hash"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}}, "aggs": {"Updated 9 Days ago": {"value_count": {"field": "m_hash"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Most Recent": {"max": {"field": "m_update_date"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Oldest Update": {"min": {"field": "m_update_date"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_leak_date": {"gte": "now-5d/d"}}}, "aggs": {"Updated 5 Days ago": {"value_count": {"field": "m_hash"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Top Team": {"terms": {"field": "m_team", "size": 1}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Common Server": {"terms": {"field": "m_web_server", "size": 1}}}}}]

        return queries

    @staticmethod
    def populate_comparison_model(insight_old_daily, insight_new, insight_old_weekly=None):
        comparison = InsightComparisonModel()

        REVERSE_GENERIC_MAPPING = {v: k for k, v in GENERIC_AGGREGATION_MAPPING.items()}
        REVERSE_LEAK_MAPPING = {v: k for k, v in LEAK_AGGREGATION_MAPPING.items()}
        REVERSE_DEFACEMENT_MAPPING = {v: k for k, v in DEFACEMENT_AGGREGATION_MAPPING.items()}

        for section in ["general", "leak", "defacement"]:
            old_model_daily = getattr(insight_old_daily, section)
            new_model = getattr(insight_new, section)
            comparison_model = getattr(comparison, section)
            if section == "general":
                mapping = REVERSE_GENERIC_MAPPING
            elif section == "leak":
                mapping = REVERSE_LEAK_MAPPING
            else:
                mapping = REVERSE_DEFACEMENT_MAPPING

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
            insight_old_daily = await redis_controller.getInstance().invoke_trigger(
                REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_OLD_DAY, None, None])
            insight_old_weekly = await redis_controller.getInstance().invoke_trigger(
                REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_OLD_WEEK, None, None])

            if insight_old_daily is None:
                insight_old_daily = InsightData()
            else:
                insight_old_daily = InsightData.model_validate(json.loads(insight_old_daily))

            if insight_old_weekly is None:
                insight_old_weekly = InsightData()
            else:
                insight_old_weekly = InsightData.model_validate(json.loads(insight_old_weekly))

            insight_comparison = self.populate_comparison_model(insight_old_daily, insight_new, insight_old_weekly)

            await redis_controller.getInstance().invoke_trigger(
                REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_STAT, insight_comparison.model_dump_json(), None])
            if args == REDIS_KEYS.INSIGHT_OLD_DAY:
                await redis_controller.getInstance().invoke_trigger(
                    REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_OLD_DAY, insight_new.model_dump_json(), None])

            if args == REDIS_KEYS.INSIGHT_OLD_WEEK:
                await redis_controller.getInstance().invoke_trigger(
                    REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.INSIGHT_OLD_WEEK, insight_new.model_dump_json(), None])

        except Exception as ex:
            log.g().e(ex)
            return

    async def update_insights(self):
        await redis_controller.getInstance().invoke_trigger(
            REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.INSIGHT_OLD_DAY, None, None])
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
