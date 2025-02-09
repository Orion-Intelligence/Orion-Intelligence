from datetime import datetime, timezone
from elasticsearch import AsyncElasticsearch
from backend.services.log_manager.log_controller import log
from backend.services.elastic_manager.elastic_enums import (ELASTIC_CONNECTIONS, MANAGE_ELASTIC_MESSAGES, ELASTIC_KEYS, ELASTIC_INDEX, ELASTIC_ENUMS)
from backend.services.elastic_manager.elastic_request_generator import elastic_request_generator
from backend.view_managers.interactive.search_manager.search_data_model.search_api_param_model import search_api_param_model
from backend.view_managers.interactive.search_manager.search_data_model.search_param_model import search_param_model


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
            document, data_filter = self.__m_elastic_request_generator.on_search(p_data)
            m_data = await self.__m_connection.search(index=document, body=data_filter)
            return True, m_data
        except Exception as ex:
            log.g().e(f"ELASTIC 3 : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
            return False, str(ex)

    async def search_query(self, p_data:search_param_model):
        try:
            document, data_filter = self.__m_elastic_request_generator.on_search(p_data)
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
            m_data = self.__m_elastic_request_generator.generate_insight_queries()
            if not isinstance(m_data, list):
                raise ValueError("p_data must be a list of queries.")
            results = []
            for query in m_data:
                try:
                    result = await self.__m_connection.search(index=query[ELASTIC_KEYS.S_DOCUMENT], body=query[ELASTIC_KEYS.S_FILTER])
                    results.append({"query": query, "result": result})
                except Exception as ex:
                    log.g().e(f"ELASTIC 3 : Failed to execute query: {str(query)} : {str(ex)}")
                    results.append({"query": query, "error": str(ex)})
            return True, results
        except Exception as ex:
            log.g().e(f"ELASTIC 3 : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
            return False, str(ex)

    async def index_general(self, p_data):
        m_data = self.__m_elastic_request_generator.index_query_general(p_data)
        return await self.__index(m_data)

    async def index_leak(self, p_data):
        m_data = self.__m_elastic_request_generator.index_query_leak(p_data)
        return await self.__index(m_data)


    async def __index(self, p_data):
        try:
            def ensure_creation_date(entry):
                if "m_creation_date" not in entry[ELASTIC_KEYS.S_VALUE]:
                    entry[ELASTIC_KEYS.S_VALUE]["m_creation_date"] = datetime.now(timezone.utc).isoformat()
                return entry

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
