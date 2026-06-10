import json
import hashlib
from datetime import datetime, timezone
from elasticsearch import AsyncElasticsearch, helpers as es_helpers
from fastapi import HTTPException
from orion.constants import constant
from orion.helper_manager.env_handler import env_handler
from orion.services.elastic_manager.elastic_enums import (ELASTIC_CONNECTIONS, MANAGE_ELASTIC_MESSAGES, ELASTIC_KEYS, ELASTIC_INDEX, ELASTIC_ENUMS)
from orion.services.log_manager.log_controller import log


class elastic_controller:
    __instance = None
    __m_core_connection = None
    __m_dump_connection = None

    @staticmethod
    def get_instance():
        if elastic_controller.__instance is None:
            elastic_controller()
        return elastic_controller.__instance

    def __init__(self):
        elastic_controller.__instance = self

    async def initialize(self):
        await self.__link_connection()

    async def __link_connection(self):
        self.__m_core_connection = AsyncElasticsearch(
            f"http://{ELASTIC_CONNECTIONS.S_DATABASE_IP}:{ELASTIC_CONNECTIONS.S_DATABASE_PORT}",
            http_auth=(ELASTIC_CONNECTIONS.S_ELASTIC_USERNAME, ELASTIC_CONNECTIONS.S_ELASTIC_PASSWORD))
        self.__m_dump_connection = AsyncElasticsearch(
            f"http://{ELASTIC_CONNECTIONS.S_STEALER_IP}:{ELASTIC_CONNECTIONS.S_DATABASE_PORT}",
            http_auth=(ELASTIC_CONNECTIONS.S_ELASTIC_USERNAME, ELASTIC_CONNECTIONS.S_ELASTIC_PASSWORD))
        await self.__initialize_mappings()

    def get_connection(self):
        return self.__m_core_connection

    def __conn_for_index(self, index: str):
        if env_handler.get_instance().env('PRODUCTION') == '0':
            return self.__m_core_connection
        if index == ELASTIC_INDEX.S_STEALERLOGS_INDEX:
            return self.__m_dump_connection
        return self.__m_core_connection

    def __conn_for_indices(self, indices):
        if env_handler.get_instance().env('PRODUCTION') == '0':
            return self.__m_core_connection
        if indices and set(indices).issubset({ELASTIC_INDEX.S_STEALERLOGS_INDEX}):
            return self.__m_dump_connection
        return self.__m_core_connection

    async def __initialize_mappings(self):
        try:
            mapping_leakdatamodel = ELASTIC_ENUMS.mapping_leakdatamodel
            mapping_generic_model = ELASTIC_ENUMS.mapping_generic_model
            mapping_defacement_model = ELASTIC_ENUMS.mapping_defacement_model
            mapping_exploit_model = ELASTIC_ENUMS.mapping_exploit_model
            mapping_apt_model = ELASTIC_ENUMS.mapping_apt_model
            mapping_siem_model = ELASTIC_ENUMS.mapping_siem_model
            mapping_chat_model = ELASTIC_ENUMS.mapping_chat_model
            mapping_stealer_model = ELASTIC_ENUMS.mapping_stealer_log_model
            mapping_social_model = ELASTIC_ENUMS.mapping_social_model
            mapping_saction_model = ELASTIC_ENUMS.mapping_opensanctions_model
            mapping_map_entities_model = ELASTIC_ENUMS.mapping_map_entities_model

            if not await self.__m_core_connection.indices.exists(index=ELASTIC_INDEX.S_LEAK_INDEX, request_timeout=220):
                await self.__m_core_connection.indices.create(
                    index=ELASTIC_INDEX.S_LEAK_INDEX, body=mapping_leakdatamodel, request_timeout=220)
                await self.__m_core_connection.indices.put_settings(
                    index=ELASTIC_INDEX.S_LEAK_INDEX,
                    body={"index.blocks.read_only_allow_delete": False},
                    request_timeout=220)

            if not await self.__m_core_connection.indices.exists(index=ELASTIC_INDEX.S_OPENSANCTIONS_INDEX, request_timeout=220):
                await self.__m_core_connection.indices.create(
                    index=ELASTIC_INDEX.S_OPENSANCTIONS_INDEX, body=mapping_saction_model, request_timeout=220)
                await self.__m_core_connection.indices.put_settings(
                    index=ELASTIC_INDEX.S_OPENSANCTIONS_INDEX,
                    body={"index.blocks.read_only_allow_delete": False},
                    request_timeout=220)

            if not await self.__m_core_connection.indices.exists(
                    index=ELASTIC_INDEX.S_GENERIC_INDEX,
                    request_timeout=220):
                await self.__m_core_connection.indices.create(
                    index=ELASTIC_INDEX.S_GENERIC_INDEX, body=mapping_generic_model, request_timeout=220)
                await self.__m_core_connection.indices.put_settings(
                    index=ELASTIC_INDEX.S_GENERIC_INDEX,
                    body={"index.blocks.read_only_allow_delete": False},
                    request_timeout=220)

            if not await self.__m_core_connection.indices.exists(
                    index=ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                    request_timeout=220):
                await self.__m_core_connection.indices.create(
                    index=ELASTIC_INDEX.S_DEFACEMENT_INDEX, body=mapping_defacement_model, request_timeout=220)
                await self.__m_core_connection.indices.put_settings(
                    index=ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                    body={"index.blocks.read_only_allow_delete": False},
                    request_timeout=220)

            if not await self.__m_core_connection.indices.exists(
                    index=ELASTIC_INDEX.S_EXPLOIT_INDEX,
                    request_timeout=220):
                await self.__m_core_connection.indices.create(
                    index=ELASTIC_INDEX.S_EXPLOIT_INDEX, body=mapping_exploit_model, request_timeout=220)
                await self.__m_core_connection.indices.put_settings(
                    index=ELASTIC_INDEX.S_EXPLOIT_INDEX,
                    body={"index.blocks.read_only_allow_delete": False},
                    request_timeout=220)

            if not await self.__m_core_connection.indices.exists(
                    index=ELASTIC_INDEX.S_APT_INDEX,
                    request_timeout=220):
                await self.__m_core_connection.indices.create(
                    index=ELASTIC_INDEX.S_APT_INDEX, body=mapping_apt_model, request_timeout=220)
                await self.__m_core_connection.indices.put_settings(
                    index=ELASTIC_INDEX.S_APT_INDEX,
                    body={"index.blocks.read_only_allow_delete": False},
                    request_timeout=220)

            if not await self.__m_core_connection.indices.exists(
                    index=ELASTIC_INDEX.S_SIEM_INDEX,
                    request_timeout=220):
                await self.__m_core_connection.indices.create(
                    index=ELASTIC_INDEX.S_SIEM_INDEX, body=mapping_siem_model, request_timeout=220)
                await self.__m_core_connection.indices.put_settings(
                    index=ELASTIC_INDEX.S_SIEM_INDEX,
                    body={"index.blocks.read_only_allow_delete": False},
                    request_timeout=220)

            if not await self.__m_core_connection.indices.exists(
                    index=ELASTIC_INDEX.S_CHATS_INDEX,
                    request_timeout=220):
                await self.__m_core_connection.indices.create(
                    index=ELASTIC_INDEX.S_CHATS_INDEX, body=mapping_chat_model, request_timeout=220)
                await self.__m_core_connection.indices.put_settings(
                    index=ELASTIC_INDEX.S_CHATS_INDEX,
                    body={"index.blocks.read_only_allow_delete": False},
                    request_timeout=220)

            if not await self.__m_dump_connection.indices.exists(
                    index=ELASTIC_INDEX.S_STEALERLOGS_INDEX, request_timeout=220):
                await self.__m_dump_connection.indices.create(
                    index=ELASTIC_INDEX.S_STEALERLOGS_INDEX, body=mapping_stealer_model, request_timeout=220)
                await self.__m_dump_connection.indices.put_settings(
                    index=ELASTIC_INDEX.S_STEALERLOGS_INDEX,
                    body={"index.blocks.read_only_allow_delete": False},
                    request_timeout=220)

            if not await self.__m_core_connection.indices.exists(
                    index=ELASTIC_INDEX.S_SOCIAL_INDEX,
                    request_timeout=220):
                await self.__m_core_connection.indices.create(
                    index=ELASTIC_INDEX.S_SOCIAL_INDEX, body=mapping_social_model, request_timeout=220)
                await self.__m_core_connection.indices.put_settings(
                    index=ELASTIC_INDEX.S_SOCIAL_INDEX,
                    body={"index.blocks.read_only_allow_delete": False},
                    request_timeout=220)

            if env_handler.get_instance().env("TESTING_ENABLED", "0") != "1":
                await self.__initialize_map_entities_data(mapping_map_entities_model)

        except Exception as ex:
            log.g().e(f"ELASTIC : Initialization failed: {str(ex)}")

    @staticmethod
    def prepare_map_entities_document(document: dict) -> dict:
        prepared = dict(document)
        location = prepared.get("location")
        if isinstance(location, dict) and "lat" in location and "lon" in location:
            try:
                lat = float(location["lat"])
                lon = float(location["lon"])
                prepared["location_point"] = {"lat": lat, "lon": lon}
            except (ValueError, TypeError):
                pass
        return prepared

    @staticmethod
    def is_map_entity_document(document: dict) -> bool:
        if not isinstance(document, dict):
            return False

        location = document.get("location")
        has_location = isinstance(location, dict) and location.get("lat") is not None and location.get("lon") is not None
        has_type = bool(str(document.get("type") or "").strip())
        has_capacity = document.get("capacity_mw") is not None

        return has_location and has_type and has_capacity

    @staticmethod
    def map_entities_document_id(document: dict) -> str:
        location = document.get("location") if isinstance(document, dict) else None
        key_payload = {
            "name": document.get("name") if isinstance(document, dict) else None,
            "country": document.get("country") if isinstance(document, dict) else None,
            "type": document.get("type") if isinstance(document, dict) else None,
            "lat": location.get("lat") if isinstance(location, dict) else None,
            "lon": location.get("lon") if isinstance(location, dict) else None,
        }
        key_str = json.dumps(key_payload, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(key_str.encode("utf-8")).hexdigest()

    async def __initialize_map_entities_data(self, mapping_map_entities_model):
        index_name = ELASTIC_INDEX.S_MAP_ENTITIES_INDEX

        if not await self.__m_core_connection.indices.exists(index=index_name, request_timeout=220):
            await self.__m_core_connection.indices.create(index=index_name, body=mapping_map_entities_model, request_timeout=220)
        else:
            await self.__m_core_connection.indices.delete(index=index_name, request_timeout=220)
            await self.__m_core_connection.indices.create(index=index_name, body=mapping_map_entities_model, request_timeout=220)

        raw_data = constant.map_entities_data
        if isinstance(raw_data, str):
            raw_data = json.loads(raw_data)

        documents = [
            document for document in (raw_data if isinstance(raw_data, list) else [])
        ]

        def action_generator():
            for document in documents:
                if not isinstance(document, dict):
                    continue
                prepared = self.prepare_map_entities_document(document)
                yield {
                    "_op_type": "index",
                    "_index": index_name,
                    "_id": self.map_entities_document_id(document),
                    "_source": prepared,
                }

        await es_helpers.async_bulk(
            self.__m_core_connection,
            action_generator(),
            chunk_size=2000,
            request_timeout=220,
            raise_on_error=False,
            raise_on_exception=False,
        )

    async def purge_old_records(self):
        try:
            m_request_defacement = {"query": {"range": {"m_leak_date": {"lt": "now-6M"}}}}
            await self.__m_core_connection.delete_by_query(
                index=ELASTIC_INDEX.S_DEFACEMENT_INDEX, body=m_request_defacement)

        except Exception as ex:
            log.g().e(f"Failed to delete old records: {str(ex)}")

    async def reindex_map_entities_data(self):
        try:
            mapping_map_entities_model = ELASTIC_ENUMS.mapping_map_entities_model
            await self.__initialize_map_entities_data(mapping_map_entities_model)
            log.g().i("Map entities data re-indexed successfully")
        except Exception as ex:
            log.g().e(f"Failed to re-index map entities data: {str(ex)}")

    async def get_doc(self, index, doc_id: str):
        try:
            conn = self.__conn_for_index(index)
            result = await conn.get(index=index, id=doc_id)
            return [result["_source"]] if result and "_source" in result else []
        except Exception:
            return []

    async def search_query(self, document, data_filter):
        try:
            conn = self.__conn_for_index(document)
            m_data = await conn.search(index=document, body=data_filter)
            return True, m_data
        except Exception as ex:
            log.g().e(f"ELASTIC : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
            return False, None

    @staticmethod
    def _read_index(i: str) -> str:
        return "stealer_model,stealer_model-*" if i == ELASTIC_INDEX.S_STEALERLOGS_INDEX else i

    async def search_consolidated_ranked_query(self, indices, query, indices_boost=None):
        try:
            def _apply_case_insensitive(q):
                if isinstance(q, list):
                    for x in q:
                        _apply_case_insensitive(x)
                    return
                if not isinstance(q, dict):
                    return

                for k, v in list(q.items()):
                    if k in ("term", "wildcard", "prefix", "regexp") and isinstance(v, dict):
                        for field, spec in list(v.items()):
                            if isinstance(spec, dict):
                                spec.setdefault("case_insensitive", True)
                            else:
                                v[field] = {"value": spec, "case_insensitive": True}
                    _apply_case_insensitive(v)

            if indices_boost:
                query["indices_boost"] = indices_boost

            _apply_case_insensitive(query)

            read_indices = [self._read_index(i) for i in indices]
            only_stealer = all(i == ELASTIC_INDEX.S_STEALERLOGS_INDEX for i in indices)
            none_stealer = all(i != ELASTIC_INDEX.S_STEALERLOGS_INDEX for i in indices)

            if only_stealer:
                return await self.__m_dump_connection.search(
                    index=",".join(read_indices),
                    body=query,
                    allow_no_indices=True,
                    ignore_unavailable=True,
                )

            if none_stealer:
                return await self.__m_core_connection.search(
                    index=",".join(read_indices),
                    body=query,
                    allow_no_indices=True,
                    ignore_unavailable=True,
                )

            core_indices = [self._read_index(i) for i in indices if i != ELASTIC_INDEX.S_STEALERLOGS_INDEX]
            dump_indices = ["stealer_model,stealer_model-*"]

            core_res = await self.__m_core_connection.search(
                index=",".join(core_indices),
                body=query,
                allow_no_indices=True,
                ignore_unavailable=True,
            ) if core_indices else {"hits": {"hits": []}}

            dump_res = await self.__m_dump_connection.search(
                index=",".join(dump_indices),
                body=query,
                allow_no_indices=True,
                ignore_unavailable=True,
            )

            merged = core_res if core_indices else dump_res
            core_hits = core_res.get("hits", {}).get("hits", []) if core_res else []
            dump_hits = dump_res.get("hits", {}).get("hits", []) if dump_res else []
            merged_hits = (core_hits or []) + (dump_hits or [])
            merged_hits.sort(key=lambda h: h.get("_score", 0), reverse=True)
            if "hits" not in merged:
                merged["hits"] = {}
            merged["hits"]["hits"] = merged_hits
            return merged
        except Exception as ex:
            log.g().e(f"ELASTIC : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
            return None

    async def search_consolidated_queries(self, indices, queries):
        results = []
        for index, query in zip(indices, queries):
            try:
                conn = self.__conn_for_index(index)
                res = await conn.search(index=index, body=query)
                results.append(res)
            except Exception as ex:
                log.g().e(f"ELASTIC : {MANAGE_ELASTIC_MESSAGES.S_READ_FAILURE} : {str(ex)}")
                results.append(None)
        return results

    async def index_data(self, p_data, bypass_empty_embedding=False):
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
                    conn = self.__conn_for_index(index)
                    exists = await conn.exists(index=index, id=doc_id)

                    if not exists and not bypass_empty_embedding and index != ELASTIC_INDEX.S_CHATS_INDEX:
                        emb = entry[ELASTIC_KEYS.S_VALUE].get("m_embedding")
                        if not (isinstance(emb, list) and len(emb) > 0):
                            continue

                    await conn.update(
                        index=index,
                        id=doc_id,
                        body={"doc": entry[ELASTIC_KEYS.S_VALUE], "doc_as_upsert": True})

            else:
                p_data = ensure_creation_date(p_data)
                doc_id = p_data[ELASTIC_KEYS.S_VALUE].get("m_hash")
                if not doc_id:
                    log.g().w("Skipping indexing due to missing m_hash")
                    return False, "Missing m_hash in document"

                index = p_data[ELASTIC_KEYS.S_DOCUMENT]
                conn = self.__conn_for_index(index)
                exists = await conn.exists(index=index, id=doc_id)

                if not exists and index != ELASTIC_INDEX.S_CHATS_INDEX:
                    emb = p_data[ELASTIC_KEYS.S_VALUE].get("m_embedding")
                    if not (isinstance(emb, list) and len(emb) > 0):
                        return False, "Missing non-empty m_embedding for new document"

                await conn.update(
                    index=index,
                    id=doc_id,
                    body={"doc": p_data[ELASTIC_KEYS.S_VALUE], "doc_as_upsert": True})

            return True, None

        except Exception as ex:
            log.g().e(ex)
            raise HTTPException(status_code=500, detail="Failed to index data")

    async def index_dump(self, p_data):
        try:
            target_indices = set()
            for part in p_data:
                if isinstance(part, dict):
                    for _, meta in part.items():
                        if isinstance(meta, dict):
                            idx = meta.get("_index")
                            if idx:
                                target_indices.add(idx)
            response = await self.__m_dump_connection.bulk(body=p_data)
            return response
        except Exception as ex:
            log.g().e(f"{MANAGE_ELASTIC_MESSAGES.S_INSERT_FAILURE} : {str(ex)}")
            raise HTTPException(status_code=500, detail="Failed to index dump data")
        
    async def mget_docs(self, index, body):
        return await self.__m_core_connection.mget(
            index=self._read_index(index),
            body=body,
        )
