from datetime import datetime, timezone
from elasticsearch import AsyncElasticsearch
from backend.services.log_manager.log_controller import log
from backend.services.request_manager.request_handler import request_handler
from backend.services.elastic_manager.elastic_enums import (ELASTIC_CONNECTIONS, MANAGE_ELASTIC_MESSAGES, ELASTIC_KEYS, ELASTIC_CRUD_COMMANDS,ELASTIC_INDEX, ELASTIC_REQUEST_COMMANDS)
from backend.services.elastic_manager.elastic_request_generator import elastic_request_generator


class elastic_controller(request_handler):
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

    async def purge_old_records(self):
        print("Purging expired records")
        m_request = self.__m_elastic_request_generator.invoke_trigger(ELASTIC_REQUEST_COMMANDS.S_CLEAR_EXPIRE_INDEX, None)
        try:
            await self.__m_connection.delete_by_query(index=ELASTIC_INDEX.S_LEAK_INDEX, body=m_request, ignore=[404])
            await self.__m_connection.delete_by_query(index=ELASTIC_INDEX.S_GENERIC_INDEX, body=m_request, ignore=[404])
        except Exception as ex:
            log.g().e(f"Failed to delete old records: {str(ex)}")

    async def __link_connection(self):
        self.__m_connection = AsyncElasticsearch(f"{ELASTIC_CONNECTIONS.S_DATABASE_IP}:{ELASTIC_CONNECTIONS.S_DATABASE_PORT}",
                                                 http_auth=(ELASTIC_CONNECTIONS.S_ELASTIC_USERNAME, ELASTIC_CONNECTIONS.S_ELASTIC_PASSWORD))
        await self.__initialization()

    async def __initialization(self):
        try:
            mapping_leakdatamodel = {"settings": {"number_of_shards": 1, "number_of_replicas": 0, "max_result_window": 1000000},
                                     "mappings": {"properties": {"m_content_type": {"type": "keyword"}, "m_title": {"type": "text"}, "m_hash": {"type": "text"},
                                                                 "m_url": {"type": "keyword"}, "m_base_url": {"type": "keyword"}, "m_content": {"type": "text"},
                                                                 "m_update_date": {"type": "date"}, "m_creation_date": {"type": "date"}}}}
            mapping_generic_model = {"settings": {"number_of_shards": 1, "number_of_replicas": 0, "max_result_window": 1000000},
                                      "mappings": {"dynamic": "true", "properties": {"m_hash": {"type": "text"}, "m_hash_url": {"type": "keyword"}, "m_title": {"type": "text"},
                                                                  "m_meta_description": {"type": "text"}, "m_content": {"type": "text"}, "m_update_date": {"type": "date"},
                                                                  "m_creation_date": {"type": "date"}, "m_content_type": {"type": "keyword"}}}}

            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_LEAK_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_LEAK_INDEX, body=mapping_leakdatamodel)
                log.g().i(f"Created index: {ELASTIC_INDEX.S_LEAK_INDEX}")
            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_GENERIC_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_GENERIC_INDEX, body=mapping_generic_model)
                log.g().i(f"Created index: {ELASTIC_INDEX.S_GENERIC_INDEX}")
        except Exception as ex:
          log.g().e(f"ELASTIC 1 : Initialization failed: {str(ex)}")

    async def __update(self, p_data):
        try:
            await self.__m_connection.update(index=p_data[ELASTIC_KEYS.S_DOCUMENT], id=p_data[ELASTIC_KEYS.S_ID], body=p_data[ELASTIC_KEYS.S_VALUE])
            return True, None
        except Exception as ex:
            log.g().e(f"ELASTIC 2 : {MANAGE_ELASTIC_MESSAGES.S_UPDATE_FAILURE} : {str(ex)}")
            return False, str(ex)

    async def __read(self, p_data):
        try:
            result = await self.__m_connection.search(index=p_data[ELASTIC_KEYS.S_DOCUMENT], body=p_data[ELASTIC_KEYS.S_FILTER])
            return True, result
        except Exception as ex:
            log.g().e(f"ELASTIC 3 : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
            return False, str(ex)

    async def __insight(self, p_data):
        try:
            if not isinstance(p_data, list):
                raise ValueError("p_data must be a list of queries.")
            results = []
            for query in p_data:
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

    async def invoke_trigger(self, p_commands, p_data=None):
        m_request = p_data[0]
        m_data = p_data[1]
        m_request = self.__m_elastic_request_generator.invoke_trigger(m_request, m_data)
        if p_commands == ELASTIC_CRUD_COMMANDS.S_UPDATE:
            return await self.__update(m_request)
        if p_commands == ELASTIC_CRUD_COMMANDS.S_READ:
            return await self.__read(m_request)
        if p_commands == ELASTIC_CRUD_COMMANDS.S_INDEX:
            return await self.__index(m_request)
        if p_commands == ELASTIC_CRUD_COMMANDS.S_INSIGHT:
            return await self.__insight(m_request)
