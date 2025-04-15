from orion.api.server.entity_manager.modal.EntityQueryInput import EntityQueryInput
from orion.api.server.entity_manager.modal.EntityRelationInput import EntityRelationInput
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.log_manager.log_controller import log
from fastapi.concurrency import run_in_threadpool


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

    async def get_entity_relations(self, query: EntityQueryInput):
        try:
            vertex_id = f"elastic/{query.model_type}:{query.query_value}"
            query_str = """
                FOR v, e, p IN 1..2 ANY @start_vertex GRAPH 'cti_graph'
                    RETURN { vertex: v, edge: e }
            """
            cursor = await run_in_threadpool(
                lambda: list(self.__db.aql.execute(query_str, bind_vars={"start_vertex": vertex_id}))
            )
            return cursor
        except Exception as ex:
            log.g().e(f"ARANGO RELATION FETCH ERROR: {ex}")
            return []

    async def set_entity_relation(self, relation: EntityRelationInput):
        try:
            edge_doc = {
                "_from": f"elastic/{relation.from_type}:{relation.from_value}",
                "_to": f"elastic/{relation.to_type}:{relation.to_value}",
                "type": relation.relation_type
            }
            if relation.metadata:
                edge_doc.update(relation.metadata)

            result = await run_in_threadpool(
                lambda: self.__db.collection("cti_edges").insert(edge_doc, overwrite=False)
            )
            return {"status": "success", "edge": result}
        except Exception as ex:
            log.g().e(f"ARANGO RELATION SET ERROR: {ex}")
            return {"status": "error", "message": str(ex)}
