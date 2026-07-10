import asyncio

from arango import ArangoClient

from orion.constants.cti_graph_schema import CLUSTER_LABELS, GRAPH_SCHEMA_VERSION
from orion.services.arango_manager.arango_enums import ARANGO_CONNECTIONS
from orion.services.log_manager.log_controller import log


class arango_controller:
    __instance = None
    __client = None
    __db = None
    __graph = None

    @staticmethod
    def get_instance():
        if arango_controller.__instance is None:
            arango_controller()
        return arango_controller.__instance

    def __init__(self):
        if arango_controller.__instance is not None:
            raise Exception("This class is a singleton!")
        arango_controller.__instance = self
        self.__client = None
        self.__db = None
        self.__graph = None

    async def link_connection(self):
        for _ in range(60):
            try:
                self.__client = ArangoClient(hosts=ARANGO_CONNECTIONS.ARANGO_URL)

                sys_db = self.__client.db(
                    "_system",
                    username=ARANGO_CONNECTIONS.ARANGO_USERNAME,
                    password=ARANGO_CONNECTIONS.ARANGO_PASSWORD,
                )

                sys_db.version()

                if not sys_db.has_database(ARANGO_CONNECTIONS.ARANGO_DATABASE_NAME):
                    sys_db.create_database(ARANGO_CONNECTIONS.ARANGO_DATABASE_NAME)

                self.__db = self.__client.db(
                    ARANGO_CONNECTIONS.ARANGO_DATABASE_NAME,
                    username=ARANGO_CONNECTIONS.ARANGO_USERNAME,
                    password=ARANGO_CONNECTIONS.ARANGO_PASSWORD,
                )

                self.__db.version()
                return

            except Exception:
                await asyncio.sleep(1)

        raise RuntimeError("ARANGO CONNECTION TIMEOUT")

    def get_db(self):
        return self.__db

    def get_graph(self):
        return self.__graph


    async def initialize(self):
        try:
            if not self.__db.has_collection("cti_edges"):
                self.__db.create_collection("cti_edges", edge=True)

            if not self.__db.has_collection("cti_vertices"):
                self.__db.create_collection("cti_vertices")

            if not self.__db.has_graph("cti_graph"):
                self.__graph = self.__db.create_graph(
                    name="cti_graph",
                    edge_definitions=[{
                        "edge_collection": "cti_edges",
                        "from_vertex_collections": ["cti_vertices"],
                        "to_vertex_collections": ["cti_vertices"],
                    }],
                )
            else:
                self.__graph = self.__db.graph("cti_graph")

            vertex_collection = self.__db.collection("cti_vertices")
            edge_collection = self.__db.collection("cti_edges")
            default_nodes = [
                {
                    "_key": key,
                    "type": "cluster",
                    "node_class": "cluster",
                    "label": label,
                    "display_value": label,
                    "schema_version": GRAPH_SCHEMA_VERSION,
                }
                for key, label in CLUSTER_LABELS.items()
            ]

            for node in default_nodes:
                if not vertex_collection.has(node["_key"]):
                    vertex_collection.insert(node)
                else:
                    vertex_collection.insert(node, overwrite=True)

            for fields in [
                ["type"],
                ["node_class"],
                ["entity_role"],
                ["normalized_value"],
                ["type", "normalized_value"],
                ["doc_id"],
                ["cluster_id"],
                ["evidence_count"],
                ["schema_version"],
            ]:
                try:
                    vertex_collection.add_persistent_index(fields=fields)
                except Exception as ex:
                    log.g().w(f"ARANGO VERTEX INDEX INIT SKIPPED for {fields}: {ex}")

            for fields in [
                ["type"],
                ["_from", "type"],
                ["_to", "type"],
                ["edge_type"],
                ["entity_role"],
                ["derived"],
                ["evidence_count"],
                ["schema_version"],
            ]:
                try:
                    edge_collection.add_persistent_index(fields=fields)
                except Exception as ex:
                    log.g().w(f"ARANGO EDGE INDEX INIT SKIPPED for {fields}: {ex}")

        except Exception as ex:
            log.g().e(f"ARANGO GRAPH INIT ERROR: {ex}")
