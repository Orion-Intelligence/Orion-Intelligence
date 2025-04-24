from orion.api.server.entity_manager.modal.EntityQueryInput import EntityQueryInput
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.log_manager.log_controller import log
from fastapi.concurrency import run_in_threadpool
from orion.api.server.crawl_manager.class_model.entity_model import entity_model


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

    async def get_entity_relations(self, query: EntityQueryInput):
        try:
            normalized_query_value = self._normalize_key(query.query_value)
            if query.model_type and query.model_type.strip() and query.model_type.lower() != "all":
                normalized_model_type = self._normalize_key(query.model_type)
                vertex_id = f"cti_vertices/{normalized_model_type}:{normalized_query_value}"
            else:
                vertex_id = f"cti_vertices/{normalized_query_value}"

            query_str = """
                FOR v, e, p IN 1..2 ANY @start_vertex GRAPH 'cti_graph'
                    RETURN {
                        vertex: v,
                        edge: e,
                        path: p
                    }
            """

            cursor = await run_in_threadpool(
                lambda: list(
                    self.__db.aql.execute(
                        query_str, bind_vars={"start_vertex": vertex_id}
                    )
                )
            )
            return cursor

        except Exception as ex:
            print(f"ARANGO RELATION FETCH ERROR: {ex}")
            return []

    async def create_or_update_entity_nodes(self, entity: entity_model):
        try:
            normalized_doc_id = self._normalize_key(entity.m_document_id)
            normalized_cluster_id = self._normalize_key(entity.m_cluster_id)

            doc_vertex = f"cti_vertices/{normalized_doc_id}"
            cluster_vertex = f"cti_vertices/{normalized_cluster_id}"

            doc_data = entity.model_dump(exclude={"m_cluster_id"})

            await run_in_threadpool(
                lambda: self.__db.collection("cti_vertices").insert(
                    {
                        "_key": normalized_doc_id,
                        "type": "document",
                        **doc_data,
                    },
                    overwrite=True,
                )
            )

            await run_in_threadpool(
                lambda: self.__db.collection("cti_vertices").insert(
                    {"_key": normalized_cluster_id, "type": "cluster"},
                    overwrite=True,
                )
            )

            await run_in_threadpool(
                lambda: self.__db.collection("cti_edges").insert(
                    {
                        "_key": f"{normalized_cluster_id}_to_{normalized_doc_id}",
                        "_from": cluster_vertex,
                        "_to": doc_vertex,
                        "type": "cluster_to_doc",
                    },
                    overwrite=True,
                )
            )

            properties = entity.model_dump(exclude={"m_cluster_id", "m_document_id"})
            for key, value in properties.items():
                if value in (None, "", [], {}):
                    continue

                values = value if isinstance(value, list) else [value]
                for item in values:
                    if item in (None, "", [], {}):
                        continue

                    normalized_item = self._normalize_key(item)
                    prop_key = f"{key}:{normalized_item}"
                    prop_vertex = f"cti_vertices/{prop_key}"
                    edge_key = f"{normalized_doc_id}_{key}_{normalized_item}"

                    await run_in_threadpool(
                        lambda: self.__db.collection("cti_vertices").insert(
                            {
                                "_key": prop_key,
                                "value": normalized_item,
                                "type": key,
                            },
                            overwrite=True,
                        )
                    )

                    await run_in_threadpool(
                        lambda: self.__db.collection("cti_edges").insert(
                            {
                                "_key": edge_key,
                                "_from": doc_vertex,
                                "_to": prop_vertex,
                                "type": f"has_{key}",
                            },
                            overwrite=True,
                        )
                    )

            return {
                "status": "success",
                "message": f"Entity {normalized_doc_id} processed.",
            }

        except Exception as ex:
            print(ex, flush=True)
            log.g().e(f"ARANGO ENTITY UPSERT ERROR: {ex}")
            return {"status": "error", "message": str(ex)}

