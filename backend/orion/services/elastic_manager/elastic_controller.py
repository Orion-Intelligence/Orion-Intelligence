from datetime import datetime, timezone
from string import capwords

from elasticsearch import AsyncElasticsearch
from orion.management.models.insight_model import InsightData, GENERIC_AGGREGATION_MAPPING, LEAK_AGGREGATION_MAPPING
from orion.services.log_manager.log_controller import log
from orion.services.elastic_manager.elastic_enums import (ELASTIC_CONNECTIONS, MANAGE_ELASTIC_MESSAGES, ELASTIC_KEYS, ELASTIC_INDEX, ELASTIC_ENUMS)
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator
from orion.route_managers.interactive.search_manager.search_data_model.search_api_param_model import search_api_param_model
from orion.route_managers.interactive.search_manager.search_data_model.search_param_model import search_param_model


class elastic_controller:
    __instance = None
    __m_connection = None
    __m_elastic_request_generator = None

    @staticmethod
    def get_instance():
        if elastic_controller.__instance is None:
            elastic_controller()
        return elastic_controller.__instance

    def __init__(self):
        elastic_controller.__instance = self
        self.__m_elastic_request_generator = elastic_request_generator()

    async def initialize(self):
        await self.__link_connection()

    async def __link_connection(self):
        self.__m_connection = AsyncElasticsearch(f"{ELASTIC_CONNECTIONS.S_DATABASE_IP}:{ELASTIC_CONNECTIONS.S_DATABASE_PORT}",
                                                 http_auth=(ELASTIC_CONNECTIONS.S_ELASTIC_USERNAME, ELASTIC_CONNECTIONS.S_ELASTIC_PASSWORD))
        await self.__initialize_mappings()

    async def __initialize_mappings(self):
        try:
            mapping_leakdatamodel = ELASTIC_ENUMS.mapping_leakdatamodel
            mapping_generic_model = ELASTIC_ENUMS.mapping_generic_model

            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_LEAK_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_LEAK_INDEX, body=mapping_leakdatamodel)
                log.g().i(f"Created index: {ELASTIC_INDEX.S_LEAK_INDEX}")

            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_GENERIC_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_GENERIC_INDEX, body=mapping_generic_model)
                log.g().i(f"Created index: {ELASTIC_INDEX.S_GENERIC_INDEX}")

        except Exception as ex:
            log.g().e(f"ELASTIC 1 : Initialization failed: {str(ex)}")

    async def search_query_api(self, p_data: search_api_param_model):
        try:
            document, data_filter = self.__m_elastic_request_generator.on_search_leakdata(p_data)
            m_data = await self.__m_connection.search(index=document, body=data_filter)
            print(m_data)
            return True, m_data
        except Exception as ex:
            log.g().e(f"ELASTIC 3 : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
            return False, str(ex)

    async def search_query(self, p_data:search_param_model):
        try:
            document, data_filter = self.__m_elastic_request_generator.on_search_leakdata(p_data)
            m_data = await self.__m_connection.search(index=document, body=data_filter)
            return True, m_data
        except Exception as ex:
            log.g().e(f"ELASTIC 3 : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
            return False, str(ex)

    async def purge_old_records(self):
        print("Purging expired records")
        m_request = await self.__m_elastic_request_generator.clear_expire_index()
        try:
            await self.__m_connection.delete_by_query(index=ELASTIC_INDEX.S_LEAK_INDEX, body=m_request, ignore=[404])
            await self.__m_connection.delete_by_query(index=ELASTIC_INDEX.S_GENERIC_INDEX, body=m_request, ignore=[404])
        except Exception as ex:
            log.g().e(f"Failed to delete old records: {str(ex)}")

    async def get_insight(self):
        try:
            queries = self.__m_elastic_request_generator.generate_insight_queries()
            insight_data = InsightData()

            for query in queries:
                result = await self.__m_connection.search(index=query[ELASTIC_KEYS.S_DOCUMENT], body=query[ELASTIC_KEYS.S_FILTER])

                aggs = result.get("aggregations", {})
                value = "-"
                if aggs:
                    first_key = next(iter(aggs))
                    value = aggs[first_key].get("value", None)
                key = query["m_filter"]["aggs"]
                m_filter = query[ELASTIC_KEYS.S_DOCUMENT]
                key = list(key.keys())[0]

                if key in ["Most Recent", "Oldest Update"] and value:
                    value = datetime.fromtimestamp(value / 1000, tz=timezone.utc).strftime("%d %b")
                if isinstance(value, float):
                    value = round(value, 2)

                if key in GENERIC_AGGREGATION_MAPPING and GENERIC_AGGREGATION_MAPPING[key] == "common_types":
                    buckets = result.get("aggregations", {}).get("Common Type", {}).get("buckets", [])
                    value = capwords(buckets[0]["key"]) if buckets else "-"

                if value is not None:
                    if m_filter == ELASTIC_INDEX.S_GENERIC_INDEX:
                        setattr(insight_data.general, GENERIC_AGGREGATION_MAPPING[key], value)
                    else:
                        setattr(insight_data.leak, LEAK_AGGREGATION_MAPPING[key], value)

            return True, insight_data

        except Exception as _:
            return False, None

    async def index_general(self, p_data):
        m_data = self.__m_elastic_request_generator.index_query_general(p_data)
        return await self.__index(m_data)

    async def index_leak(self, p_data):
        m_data = self.__m_elastic_request_generator.index_query_leak(p_data)
        return await self.__index(m_data)

    async def __index(self, p_data):
        try:
            def ensure_creation_date(p_entry):
                if "m_creation_date" not in p_entry[ELASTIC_KEYS.S_VALUE]:
                    p_entry[ELASTIC_KEYS.S_VALUE]["m_creation_date"] = datetime.now(timezone.utc).isoformat()
                return p_entry

            if isinstance(p_data, list):
                for entry in p_data:
                    entry = ensure_creation_date(entry)
                    await self.__m_connection.index(index=entry[ELASTIC_KEYS.S_DOCUMENT], id=entry[ELASTIC_KEYS.S_VALUE]["m_hash"], body=entry[ELASTIC_KEYS.S_VALUE])
            else:
                p_data = ensure_creation_date(p_data)
                await self.__m_connection.index(index=p_data[ELASTIC_KEYS.S_DOCUMENT], id=p_data[ELASTIC_KEYS.S_VALUE]["m_hash"], body=p_data[ELASTIC_KEYS.S_VALUE])
            return True, None
        except Exception as ex:
            log.g().e(f"{MANAGE_ELASTIC_MESSAGES.S_INSERT_FAILURE} : {str(ex)}")
            return False, str(ex)
