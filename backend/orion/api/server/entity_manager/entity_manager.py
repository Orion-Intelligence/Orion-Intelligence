import re

from orion.api.server.entity_manager.modal.EntityQueryModel import EntityQueryModel
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

            query_str = ""
            bind_vars = {}

            if query.data_point_type == "cluster" and normalized_type == "cluster":
                if normalized_value == "all":
                    queried_id = "all_clusters"
                    query_str = f"""
                    LET clusters = ["cti_vertices/general", "cti_vertices/leak", "cti_vertices/defacement", "cti_vertices/chat"]

                    LET cluster_data = (
                      FOR cluster_id IN clusters
                        LET docs = (
                          FOR v, e, p IN {depth_level}..{depth_level} ANY cluster_id GRAPH 'cti_graph'
                            OPTIONS {{ bfs: true, uniqueVertices: "global" }}
                            FILTER v.type == 'document'
                            LIMIT {document_limit - 20}
                            RETURN {{vertex: v, edge: e, path: p}}
                        )
                        RETURN docs
                    )

                    LET raw_depth1 = FLATTEN(cluster_data)

                    LET document_ids = UNIQUE(
                      FOR item IN raw_depth1
                        RETURN item.vertex._id
                    )

                    LET cluster_edges = (
                      FOR doc_id IN document_ids
                        FOR e IN cti_edges
                          FILTER e._to == doc_id AND e.type == 'cluster_to_doc'
                          FOR cluster IN cti_vertices
                            FILTER cluster._id == e._from AND cluster.type == 'cluster'
                            RETURN {{vertex: cluster, edge: e, path: null}}
                    )

                    LET depth1 = APPEND(raw_depth1, cluster_edges)
                    LET limit_hit_depth1 = false

                    RETURN {{
                      depth1,
                      limit_hit_depth1,
                      matched_ids: clusters
                    }}
                    """
                else:
                    queried_id = f"cti_vertices/{normalized_value}"
                    query_str = f"""
                    LET doc_nodes = (
                      FOR v, e, p IN {depth_level}..{depth_level} ANY @cluster_id GRAPH 'cti_graph'
                        OPTIONS {{ bfs: true, uniqueVertices: "global" }}
                        FILTER v.type == 'document'
                        LIMIT {document_limit}
                        RETURN {{vertex: v, edge: e, path: p}}
                    )

                    LET document_ids = UNIQUE(
                      FOR item IN doc_nodes
                        RETURN item.vertex._id
                    )

                    LET cluster_edges = (
                      FOR doc_id IN document_ids
                        FOR e IN cti_edges
                          FILTER e._to == doc_id AND e.type == 'cluster_to_doc'
                          FOR cluster IN cti_vertices
                            FILTER cluster._id == e._from AND cluster.type == 'cluster'
                            RETURN {{vertex: cluster, edge: e, path: null}}
                    )

                    LET depth1 = APPEND(doc_nodes, cluster_edges)
                    LET limit_hit_depth1 = LENGTH(doc_nodes) >= {document_limit}

                    RETURN {{
                      depth1,
                      limit_hit_depth1,
                      matched_ids: [@cluster_id]
                    }}
                    """
                    bind_vars = {"cluster_id": f"cti_vertices/{normalized_value}"}

            elif query.data_point_type == "property" and normalized_type == "all":
                if normalized_value == "all":
                    queried_id = "all_properties"
                    query_str = f"""
                    LET props = (
                      FOR property IN cti_vertices
                        RETURN property._id
                    )
                    LET raw_depth1 = (
                      FOR id IN props
                        FOR v, e, p IN {depth_level}..{depth_level} ANY id GRAPH 'cti_graph'
                        RETURN {{vertex: v, edge: e, path: p}}
                    )
                    LET document_ids = UNIQUE(
                      FOR item IN raw_depth1
                        FILTER item.vertex.type == 'document'
                        RETURN item.vertex._id
                    )

                    LET default_clusters = ["general", "defacement", "leak", "chat"]
                    LET filtered_cluster_edges = (
                      FOR doc_id IN document_ids
                        FOR e IN cti_edges
                          FILTER e._to == doc_id AND e.type == 'cluster_to_doc'
                          LET cluster_key = PARSE_IDENTIFIER(e._from).key
                          FILTER cluster_key IN default_clusters
                          LET cluster = DOCUMENT(e._from)
                          RETURN {{vertex: cluster, edge: e, path: null}}
                    )

                    LET depth1 = APPEND(raw_depth1, filtered_cluster_edges)
                    LET limit_hit_depth1 = false

                    RETURN {{
                      depth1,
                      limit_hit_depth1,
                      matched_ids: props
                    }}
                    """
                else:
                    queried_id = normalized_value
                    query_str = f"""
                    LET props = (
                      FOR property IN cti_vertices
                        FILTER CONTAINS(LOWER(property.value), @search_value)
                        RETURN property._id
                    )
                    LET raw_depth1 = (
                      FOR id IN props
                        FOR v, e, p IN {depth_level}..{depth_level} ANY id GRAPH 'cti_graph'
                        RETURN {{vertex: v, edge: e, path: p}}
                    )
                    LET document_ids = UNIQUE(
                      FOR item IN raw_depth1
                        FILTER item.vertex.type == 'document'
                        RETURN item.vertex._id
                    )

                    LET default_clusters = ["general", "defacement", "leak", "chat"]
                    LET filtered_cluster_edges = (
                      FOR doc_id IN document_ids
                        FOR e IN cti_edges
                          FILTER e._to == doc_id AND e.type == 'cluster_to_doc'
                          LET cluster_key = PARSE_IDENTIFIER(e._from).key
                          FILTER cluster_key IN default_clusters
                          LET cluster = DOCUMENT(e._from)
                          RETURN {{vertex: cluster, edge: e, path: null}}
                    )

                    LET depth1 = APPEND(raw_depth1, filtered_cluster_edges)
                    LET limit_hit_depth1 = false

                    RETURN {{
                      depth1,
                      limit_hit_depth1,
                      matched_ids: props
                    }}
                    """
                    bind_vars = {"search_value": normalized_value}

            else:
                start_vertex = f"cti_vertices/{normalized_value}" if query.data_point_type == "document" else f"cti_vertices/{normalized_type}:{normalized_value}"
                queried_id = start_vertex

                query_str = f"""
                LET depth1_nodes = (
                  FOR v, e, p IN {depth_level}..{depth_level} ANY @start_vertex GRAPH 'cti_graph'
                    OPTIONS {{ bfs: true, uniqueVertices: "global" }}
                    RETURN {{vertex: v, edge: e, path: p}}
                )

                LET depth2_nodes = (
                  FOR v, e, p IN {secondary_depth_level}..{secondary_depth_level} ANY @start_vertex GRAPH 'cti_graph'
                    OPTIONS {{ bfs: true, uniqueVertices: "global" }}
                    FILTER v.type == "cluster"
                    RETURN {{vertex: v, edge: e, path: p}}
                )

                LET raw_depth1 = APPEND(depth1_nodes, depth2_nodes)

                LET property_ids = UNIQUE(
                  FOR item IN raw_depth1
                    FILTER item.vertex.type NOT IN ['document', 'cluster']
                    RETURN item.vertex._id
                )

                LET doc_counts = (
                  FOR pid IN property_ids
                    FOR e IN cti_edges
                      FILTER e._to == pid AND STARTS_WITH(e.type, "has_")
                      FILTER e._from != @start_vertex
                      COLLECT doc_id = e._from WITH COUNT INTO score
                      SORT score DESC
                      LIMIT {document_limit}
                      RETURN doc_id
                )

                LET related_docs = (
                  FOR doc_id IN doc_counts
                    FOR e IN cti_edges
                      FILTER e._from == doc_id AND STARTS_WITH(e.type, "has_")
                      FOR doc IN cti_vertices
                        FILTER doc._id == doc_id AND doc.type == "document"
                        RETURN {{vertex: doc, edge: e, path: null}}
                )

                LET related_doc_ids = (
                  FOR doc_id IN doc_counts
                    RETURN doc_id
                )

                LET document_ids = UNION(
                  UNIQUE(
                    FOR item IN raw_depth1
                      FILTER item.vertex.type == 'document'
                      RETURN item.vertex._id
                  ),
                  related_doc_ids
                )

                LET default_clusters = ["general", "defacement", "leak", "chat"]

                LET cluster_edges = (
                  FOR doc_id IN document_ids
                    FOR e IN cti_edges
                      FILTER e._to == doc_id AND e.type == 'cluster_to_doc'
                      LET cluster_key = PARSE_IDENTIFIER(e._from).key
                      FILTER cluster_key IN default_clusters
                      LET cluster = DOCUMENT(e._from)
                      RETURN {{vertex: cluster, edge: e, path: null}}
                )

                LET start_doc_properties = (
                  FOR e IN cti_edges
                    FILTER e._from == @start_vertex AND STARTS_WITH(e.type, "has_")
                    FOR prop IN cti_vertices
                      FILTER prop._id == e._to
                      RETURN {{vertex: prop, edge: e, path: null}}
                )

                LET depth1 = APPEND(APPEND(APPEND(raw_depth1, cluster_edges), related_docs), start_doc_properties)
                LET limit_hit_depth1 = LENGTH(related_docs) >= {document_limit}

                RETURN {{
                  depth1,
                  limit_hit_depth1,
                  matched_ids: [@start_vertex]
                }}
                """
                bind_vars = {"start_vertex": start_vertex}

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

            return {
                "results": final_results,
                "limit_reached": limit_reached,
                "queried_id": queried_id,
                "matched_vertex_ids": matched_vertex_ids
            }

        except Exception as ex:
            log.g().e(f"ARANGO ENTITY RELATION FETCH ERROR: {ex}")
            return {
                "results": [],
                "limit_reached": False,
                "queried_id": None,
                "matched_vertex_ids": []
            }

    async def create_or_update_entity_nodes(self, entity: entity_model):
        try:
            normalized_doc_id = self._sanitize(self._normalize_key(entity.m_document_id))
            normalized_cluster_id = self._sanitize(self._normalize_key(entity.m_cluster_id))

            doc_vertex = f"cti_vertices/{normalized_doc_id}"
            cluster_vertex = f"cti_vertices/{normalized_cluster_id}"

            doc_data = entity.model_dump(exclude={"m_cluster_id"})
            properties = entity.model_dump(exclude={"m_cluster_id", "m_document_id"})

            has_valid_property = any(
                v not in (None, "", [], {}) for v in properties.values()
            )

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
                await run_in_threadpool(lambda: self.__db.collection("cti_vertices").insert({
                    "_key": normalized_doc_id,
                    "type": "document",
                    **normalized_doc_data
                }, overwrite=True))

            await run_in_threadpool(lambda: self.__db.collection("cti_vertices").insert({
                "_key": normalized_cluster_id,
                "type": "cluster"
            }, overwrite=True))

            await run_in_threadpool(lambda: self.__db.collection("cti_edges").insert({
                "_key": f"{normalized_cluster_id}_to_{normalized_doc_id}",
                "_from": cluster_vertex,
                "_to": doc_vertex,
                "type": "cluster_to_doc"
            }, overwrite=True))

            for key, value in properties.items():
                if value in (None, "", [], {}):
                    continue

                values = value if isinstance(value, list) else [value]

                for item in values:
                    if item in (None, "", [], {}):
                        continue

                    normalized_item = self._sanitize(self._normalize_key(item))
                    prop_key = f"{key}:{normalized_item}"
                    prop_vertex = f"cti_vertices/{prop_key}"
                    edge_key = f"{normalized_doc_id}_{key}_{normalized_item}"

                    await run_in_threadpool(lambda: self.__db.collection("cti_vertices").insert({
                        "_key": prop_key,
                        "value": normalized_item,
                        "type": key
                    }, overwrite=True))

                    await run_in_threadpool(lambda: self.__db.collection("cti_edges").insert({
                        "_key": edge_key,
                        "_from": doc_vertex,
                        "_to": prop_vertex,
                        "type": f"has_{key}"
                    }, overwrite=True))

            return {"status": "success", "message": f"Entity {normalized_doc_id} processed."}

        except Exception as ex:
            log.g().e(f"ARANGO ENTITY UPSERT ERROR: {ex}")
            return {"status": "error", "message": str(ex)}
