from datetime import datetime, timezone, timedelta
from string import capwords
from elasticsearch import AsyncElasticsearch
from fastapi import HTTPException
from orion.constants.constant import CONSTANTS
from orion.management.models.insight_model import InsightData, GENERIC_AGGREGATION_MAPPING, LEAK_AGGREGATION_MAPPING, DEFACEMENT_AGGREGATION_MAPPING
from orion.services.elastic_manager.elastic_enums import (ELASTIC_CONNECTIONS, MANAGE_ELASTIC_MESSAGES, ELASTIC_KEYS, ELASTIC_INDEX, ELASTIC_ENUMS)
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator
from orion.services.log_manager.log_controller import log


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
        self.__m_connection = AsyncElasticsearch(
            f"{ELASTIC_CONNECTIONS.S_DATABASE_IP}:{ELASTIC_CONNECTIONS.S_DATABASE_PORT}",
            http_auth=(ELASTIC_CONNECTIONS.S_ELASTIC_USERNAME, ELASTIC_CONNECTIONS.S_ELASTIC_PASSWORD))
        await self.__initialize_mappings()

    def get_connection(self):
        return self.__m_connection

    async def __initialize_mappings(self):
        try:
            mapping_leakdatamodel = ELASTIC_ENUMS.mapping_leakdatamodel
            mapping_generic_model = ELASTIC_ENUMS.mapping_generic_model
            mapping_defacement_model = ELASTIC_ENUMS.mapping_defacement_model
            mapping_exploit_model = ELASTIC_ENUMS.mapping_exploit_model
            mapping_chat_model = ELASTIC_ENUMS.mapping_chat_model
            mapping_stealer_model = ELASTIC_ENUMS.mapping_stealer_log_model
            mapping_social_model = ELASTIC_ENUMS.mapping_social_model

            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_LEAK_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_LEAK_INDEX, body=mapping_leakdatamodel)
                await self.__m_connection.indices.put_settings(index=ELASTIC_INDEX.S_LEAK_INDEX, body={"index.blocks.read_only_allow_delete": False})

            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_GENERIC_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_GENERIC_INDEX, body=mapping_generic_model)
                await self.__m_connection.indices.put_settings(index=ELASTIC_INDEX.S_GENERIC_INDEX, body={"index.blocks.read_only_allow_delete": False})

            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_DEFACEMENT_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_DEFACEMENT_INDEX, body=mapping_defacement_model)
                await self.__m_connection.indices.put_settings(index=ELASTIC_INDEX.S_DEFACEMENT_INDEX, body={"index.blocks.read_only_allow_delete": False})

            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_EXPLOIT_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_EXPLOIT_INDEX, body=mapping_exploit_model)
                await self.__m_connection.indices.put_settings(index=ELASTIC_INDEX.S_EXPLOIT_INDEX, body={"index.blocks.read_only_allow_delete": False})

            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_CHATS_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_CHATS_INDEX, body=mapping_chat_model)
                await self.__m_connection.indices.put_settings(index=ELASTIC_INDEX.S_CHATS_INDEX, body={"index.blocks.read_only_allow_delete": False})

            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_STEALERLOGS_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_STEALERLOGS_INDEX, body=mapping_stealer_model)
                await self.__m_connection.indices.put_settings(index=ELASTIC_INDEX.S_STEALERLOGS_INDEX, body={"index.blocks.read_only_allow_delete": False})

            if not await self.__m_connection.indices.exists(index=ELASTIC_INDEX.S_SOCIAL_INDEX):
                await self.__m_connection.indices.create(index=ELASTIC_INDEX.S_SOCIAL_INDEX, body=mapping_social_model)
                await self.__m_connection.indices.put_settings(index=ELASTIC_INDEX.S_SOCIAL_INDEX, body={"index.blocks.read_only_allow_delete": False})

        except Exception as ex:
            log.g().e(f"ELASTIC : Initialization failed: {str(ex)}")

    async def purge_old_records(self):
        try:
            m_request_stealer = {
                "query": {
                    "range": {
                        "timestamp": {
                            "lt": f"now-{CONSTANTS.S_SETTINGS_INDEX_EXPIRY_TIMEOUT}s"
                        }
                    }
                }
            }
            await self.__m_connection.delete_by_query(
                index=ELASTIC_INDEX.S_STEALERLOGS_INDEX,
                body=m_request_stealer,
                ignore=[404],
                request_timeout=300
            )

            days_15_seconds = int(timedelta(days=15).total_seconds())
            m_request_defacement = {
                "query": {
                    "range": {
                        "timestamp": {
                            "m_leak_date": f"now-{days_15_seconds}s"
                        }
                    }
                }
            }
            await self.__m_connection.delete_by_query(
                index=ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                body=m_request_defacement,
                ignore=[404],
                request_timeout=300
            )

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

    async def search_consolidated_ranked_query(self, indices, query, indices_boost=None):
        try:
            if indices_boost:
                query["indices_boost"] = indices_boost
            res = await self.__m_connection.search(index=",".join(indices), body=query)
            return res
        except Exception as ex:
            log.g().e(f"ELASTIC : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
            return None

    async def search_consolidated_queries(self, indices, queries):
        results = []
        for index, query in zip(indices, queries):
            try:
                res = await self.__m_connection.search(index=index, body=query)
                results.append(res)
            except Exception as ex:
                log.g().e(f"ELASTIC : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
                results.append(None)
        return results

    async def generate_graph(self):
        try:
            queries = self.__m_elastic_request_generator.generate_graph_queries()
            all_bucket_data = []

            for query in queries:
                result = await self.__m_connection.search(
                    index=query[ELASTIC_KEYS.S_DOCUMENT],
                    body=query[ELASTIC_KEYS.S_FILTER]
                )

                aggs = result.get("aggregations", {})
                for agg_name, agg_result in aggs.items():
                    buckets = agg_result.get("buckets", [])
                    data = {
                        "aggregation_name": agg_name,
                        "index": query[ELASTIC_KEYS.S_DOCUMENT],
                        "buckets": []
                    }
                    for bucket in buckets:
                        data["buckets"].append({
                            "key": bucket.get("key"),
                            "count": bucket.get("doc_count")
                        })
                    all_bucket_data.append(data)

            return True, all_bucket_data

        except Exception as ex:
            log.g().e(f"{MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
            return False, None

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

    async def index_data(self, p_data, bypass_empty_embedding = False):
        try:
            def ensure_creation_date(p_entry):
                data = p_entry[ELASTIC_KEYS.S_VALUE]

                if not data.get("m_creation_date"):
                    data["m_creation_date"] = datetime.now(timezone.utc).isoformat()

                keys_to_remove = []
                for key, value in list(data.items()):
                    if isinstance(value, list):
                        filtered = [v for v in value if v and str(v).lower() != "null"]
                        if filtered:
                            data[key] = filtered
                        else:
                            keys_to_remove.append(key)
                    elif value in (None, "", "null", "NULL", "Null"):
                        keys_to_remove.append(key)

                for key in keys_to_remove:
                    del data[key]

                return p_entry

            if isinstance(p_data, list):
                for entry in p_data:
                    entry = ensure_creation_date(entry)
                    doc_id = entry[ELASTIC_KEYS.S_VALUE].get("m_hash")
                    if not doc_id:
                        log.g().w("Skipping document due to missing m_hash")
                        continue

                    index = entry[ELASTIC_KEYS.S_DOCUMENT]
                    exists = await self.__m_connection.exists(index=index, id=doc_id)

                    if not exists and not bypass_empty_embedding:
                        emb = entry[ELASTIC_KEYS.S_VALUE].get("m_embedding")
                        if not (isinstance(emb, list) and len(emb) > 0):
                            log.g().w(f"Skipping insert without non-empty embedding: {doc_id}")
                            continue

                    await self.__m_connection.update(
                        index=index,
                        id=doc_id,
                        body={"doc": entry[ELASTIC_KEYS.S_VALUE], "doc_as_upsert": True}
                    )

            else:
                p_data = ensure_creation_date(p_data)
                doc_id = p_data[ELASTIC_KEYS.S_VALUE].get("m_hash")
                if not doc_id:
                    log.g().w("Skipping indexing due to missing m_hash")
                    return False, "Missing m_hash in document"

                index = p_data[ELASTIC_KEYS.S_DOCUMENT]
                exists = await self.__m_connection.exists(index=index, id=doc_id)

                if not exists:
                    emb = p_data[ELASTIC_KEYS.S_VALUE].get("m_embedding")
                    if not (isinstance(emb, list) and len(emb) > 0):
                        return False, "Missing non-empty m_embedding for new document"

                await self.__m_connection.update(
                    index=index,
                    id=doc_id,
                    body={"doc": p_data[ELASTIC_KEYS.S_VALUE], "doc_as_upsert": True}
                )

            return True, None

        except Exception as ex:
            log.g().e(ex)
            raise HTTPException(status_code=500, detail=f"Query embedding failed")

    async def index_bulk_data(self, p_data):
        try:
            response = await self.__m_connection.bulk(body=p_data)
            return response
        except Exception as ex:
            log.g().e(f"{MANAGE_ELASTIC_MESSAGES.S_INSERT_FAILURE} : {str(ex)}")
            raise HTTPException(status_code=500, detail=f"Query embedding failed")
