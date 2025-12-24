import re

from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool

from orion.api.server.crawl_manager.class_model.entity_model import entity_model
from orion.api.server.entity_manager.entity_request_generator import EntityRequestGenerator
from orion.api.server.entity_manager.modal.EntityQueryModel import EntityQueryModel
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.log_manager.log_controller import log


class entity_manager:
    __instance = None
    __db = None
    __graph = None

    @staticmethod
    def get_instance():
        if entity_manager.__instance is None:
            entity_manager()
        return entity_manager.__instance

    def __init__(self):
        if entity_manager.__instance is not None:
            raise Exception("This class is a singleton!")
        entity_manager.__instance = self
        arango = arango_controller.get_instance()
        self.__db = arango.get_db()
        self.__graph = arango.get_graph()

    @staticmethod
    def _normalize_key(text: str) -> str:
        if not isinstance(text, str):
            text = str(text)
        return text.lower().replace(" ", "_")

    @staticmethod
    def _sanitize(value: str) -> str:
        return re.sub(r'[^a-zA-Z0-9_\-\.@()+,=;\$!\*\'%:]', '', value.replace(' ', '_')).lower()

    async def get_entity_relations(self, query: EntityQueryModel):
        try:
            normalized_value = self._sanitize(self._normalize_key(query.query_value))
            normalized_type = self._sanitize(self._normalize_key(query.model_type)) if query.model_type else None

            depth_level = 1
            secondary_depth_level = int(str(int(query.depth) + 1))
            document_limit = int(query.edge)
            if document_limit < 25:
                document_limit = 25
            if document_limit > 350:
                document_limit = 350

            query_str = ""
            bind_vars = {}

            if query.data_point_type == "cluster" and normalized_type == "cluster":
                queried_id, query_str, bind_vars = EntityRequestGenerator.get_cluster_documents_query(
                    normalized_value=normalized_value, depth_level=depth_level, document_limit=document_limit)
            elif query.data_point_type == "property" and normalized_type == "all":
                queried_id, query_str, bind_vars = EntityRequestGenerator.build_property_search_query(
                    normalized_value, depth_level, document_limit)
            else:
                queried_id, query_str, bind_vars = EntityRequestGenerator.get_document_or_property_query(
                    normalized_value=normalized_value,
                    normalized_type=normalized_type,
                    depth_level=depth_level,
                    secondary_depth_level=secondary_depth_level,
                    document_limit=document_limit,
                    data_point_type=query.data_point_type)

            result_obj = await run_in_threadpool(lambda: list(self.__db.aql.execute(query_str, bind_vars=bind_vars)))
            result_obj = result_obj[0] if result_obj else {}

            results = result_obj.get("depth1", [])
            matched_vertex_ids = result_obj.get("matched_ids", []) or []
            limit_reached = result_obj.get("limit_hit_depth1", False)

            unique_edges = set()
            final_results = []
            for item in results:
                edge = item.get('edge')
                if edge:
                    signature = (edge['_from'], edge['_to'], edge.get('type'))
                    if signature not in unique_edges:
                        unique_edges.add(signature)
                        final_results.append(item)

            return {"results": final_results, "limit_reached": limit_reached, "queried_id": queried_id, "matched_vertex_ids": matched_vertex_ids}

        except Exception as ex:
            log.g().e(f"ARANGO ENTITY RELATION FETCH ERROR: {ex}")
            return {"results": [], "limit_reached": False, "queried_id": None, "matched_vertex_ids": []}

    async def create_or_update_entity_nodes(self, entity: entity_model):
        try:
            normalized_doc_id = self._sanitize(self._normalize_key(entity.m_document_id))
            normalized_cluster_id = self._sanitize(self._normalize_key(entity.m_cluster_id))

            doc_vertex = f"cti_vertices/{normalized_doc_id}"
            cluster_vertex = f"cti_vertices/{normalized_cluster_id}"

            raw_doc_data = entity.model_dump(exclude={"m_cluster_id"})
            raw_properties = entity.model_dump(exclude={"m_cluster_id", "m_document_id"})

            doc_data = {EntityRequestGenerator.deduplicate_key(k): v for k, v in raw_doc_data.items() if
                EntityRequestGenerator.deduplicate_key(k)}
            properties = {EntityRequestGenerator.deduplicate_key(k): v for k, v in raw_properties.items() if
                EntityRequestGenerator.deduplicate_key(k)}

            has_valid_property = any(v not in (None, "", [], {}) for v in properties.values())
            if not has_valid_property:
                return {"status": "skipped", "message": f"Entity {normalized_doc_id} has no valid properties."}

            normalized_doc_data = {}
            for k, v in doc_data.items():
                if v in (None, "", [], {}):
                    continue
                if isinstance(v, str):
                    normalized_doc_data[k] = self._sanitize(self._normalize_key(v))
                else:
                    normalized_doc_data[k] = v

            if normalized_doc_data:
                await run_in_threadpool(
                    lambda: self.__db.collection("cti_vertices").insert(
                        {"_key": normalized_doc_id, "type": "document", **normalized_doc_data}, overwrite=True))

            await run_in_threadpool(
                lambda: self.__db.collection("cti_vertices").insert(
                    {"_key": normalized_cluster_id, "type": "cluster"}, overwrite=True))

            await run_in_threadpool(
                lambda: self.__db.collection("cti_edges").insert(
                    {"_key": f"{normalized_cluster_id}_to_{normalized_doc_id}", "_from": cluster_vertex, "_to": doc_vertex, "type": "cluster_to_doc"},
                    overwrite=True))

            for key, value in properties.items():
                try:
                    values = value if isinstance(value, list) else [value]
                    for item in values:
                        if item in (None, "", [], {}):
                            continue
                        normalized_item = self._sanitize(self._normalize_key(item))
                        prop_key = f"{key}:{normalized_item}"
                        prop_vertex = f"cti_vertices/{prop_key}"
                        edge_key = f"{normalized_doc_id}_{key}_{normalized_item}"
                        if len(prop_key) > 100 or len(edge_key) > 100:
                            continue
                        await run_in_threadpool(
                            lambda: self.__db.collection("cti_vertices").insert(
                                {"_key": prop_key, "value": normalized_item, "type": key}, overwrite=True))
                        await run_in_threadpool(
                            lambda: self.__db.collection("cti_edges").insert(
                                {"_key": edge_key, "_from": doc_vertex, "_to": prop_vertex, "type": f"has_{key}"},
                                overwrite=True))
                except Exception:
                    pass

            return {"status": "success", "message": f"Entity {normalized_doc_id} processed."}

        except Exception as ex:
            log.g().e(f"ARANGO ENTITY UPSERT ERROR: {ex}")
            raise HTTPException(status_code=500, detail="ARANGO ENTITY UPSERT ERROR")
