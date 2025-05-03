from datetime import datetime, timezone
from string import capwords
from elasticsearch import AsyncElasticsearch
from orion.management.models.insight_model import InsightData, GENERIC_AGGREGATION_MAPPING, LEAK_AGGREGATION_MAPPING, DEFACEMENT_AGGREGATION_MAPPING
from orion.services.log_manager.log_controller import log
from orion.services.elastic_manager.elastic_enums import (ELASTIC_CONNECTIONS, MANAGE_ELASTIC_MESSAGES, ELASTIC_KEYS, ELASTIC_INDEX, ELASTIC_ENUMS)
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator


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

  def get_connection(self):
    return self.__m_connection

  async def __initialize_mappings(self):
    try:
      mapping_leakdatamodel = ELASTIC_ENUMS.mapping_leakdatamodel
      mapping_generic_model = ELASTIC_ENUMS.mapping_generic_model
      mapping_defacement_model = ELASTIC_ENUMS.mapping_defacement_model
      mapping_chat_model = ELASTIC_ENUMS.mapping_chat_model

      if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_LEAK_INDEX):
        await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_LEAK_INDEX, body=mapping_leakdatamodel)

      if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_GENERIC_INDEX):
        await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_GENERIC_INDEX, body=mapping_generic_model)

      if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_DEFACEMENT_INDEX):
        await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_DEFACEMENT_INDEX, body=mapping_defacement_model)

      if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_CHATS_INDEX):
        await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_CHATS_INDEX, body=mapping_chat_model)

    except Exception as ex:
      log.g().e(f"ELASTIC : Initialization failed: {str(ex)}")

  async def purge_old_records(self):
    print("Purging expired records")
    m_request = await self.__m_elastic_request_generator.clear_expire_index()
    try:
      await self.__m_connection.delete_by_query(index=ELASTIC_INDEX.S_LEAK_INDEX, body=m_request, ignore=[404])
      await self.__m_connection.delete_by_query(index=ELASTIC_INDEX.S_GENERIC_INDEX, body=m_request, ignore=[404])
    except Exception as ex:
      log.g().e(f"Failed to delete old records: {str(ex)}")

  async def get_doc(self, index, doc_id: str):
    try:
      result = await self.__m_connection.get(index=index, id=doc_id, ignore=[404])
      return [result["_source"]] if result and "_source" in result else []
    except Exception:
      return []

  async def search_query(self, document, data_filter):
    try:
      m_data = await self.__m_connection.search(index=document, body=data_filter)
      return True, m_data
    except Exception as ex:
      log.g().e(f"ELASTIC : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
      return False, str(ex)

  async def get_insight(self):
    try:
      queries = self.__m_elastic_request_generator.generate_insight_queries()
      insight_data = InsightData()

      for query in queries:
        result = await self.__m_connection.search(
          index=query[ELASTIC_KEYS.S_DOCUMENT],
          body=query[ELASTIC_KEYS.S_FILTER]
        )

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

  async def index_data(self, p_data):
    try:
      def ensure_creation_date(p_entry):
        if "m_creation_date" not in p_entry[ELASTIC_KEYS.S_VALUE]:
          p_entry[ELASTIC_KEYS.S_VALUE]["m_creation_date"] = datetime.now(timezone.utc).isoformat()
        return p_entry

      if isinstance(p_data, list):
        for entry in p_data:
          entry = ensure_creation_date(entry)
          await self.__m_connection.update(
            index=entry[ELASTIC_KEYS.S_DOCUMENT],
            id=entry[ELASTIC_KEYS.S_VALUE]["m_hash"],
            body={"doc": entry[ELASTIC_KEYS.S_VALUE], "doc_as_upsert": True}
          )
      else:
        p_data = ensure_creation_date(p_data)
        await self.__m_connection.update(
          index=p_data[ELASTIC_KEYS.S_DOCUMENT],
          id=p_data[ELASTIC_KEYS.S_VALUE]["m_hash"],
          body={"doc": p_data[ELASTIC_KEYS.S_VALUE], "doc_as_upsert": True}
        )

      return True, None
    except Exception as ex:
      log.g().e(f"{MANAGE_ELASTIC_MESSAGES.S_INSERT_FAILURE} : {str(ex)}")
      return False, str(ex)
