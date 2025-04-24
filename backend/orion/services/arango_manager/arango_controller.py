from arango import ArangoClient
from orion.services.log_manager.log_controller import log
from orion.services.arango_manager.arango_enums import ARANGO_CONNECTIONS


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

  def link_connection(self):
    try:
      self.__client = ArangoClient(hosts=ARANGO_CONNECTIONS.ARANGO_URL)

      sys_db = self.__client.db("_system", username=ARANGO_CONNECTIONS.ARANGO_USERNAME, password=ARANGO_CONNECTIONS.ARANGO_PASSWORD, )

      if not sys_db.has_database(ARANGO_CONNECTIONS.ARANGO_DATABASE_NAME):
        sys_db.create_database(ARANGO_CONNECTIONS.ARANGO_DATABASE_NAME)

      self.__db = self.__client.db(ARANGO_CONNECTIONS.ARANGO_DATABASE_NAME, username=ARANGO_CONNECTIONS.ARANGO_USERNAME, password=ARANGO_CONNECTIONS.ARANGO_PASSWORD, )
    except Exception as ex:
      log.g().e(f"ARANGO CONNECTION ERROR: {ex}")

  def get_db(self):
    return self.__db

  def get_graph(self):
    return self.__graph

  def initialize(self):
    try:
      if not self.__db.has_collection("cti_edges"):
        self.__db.create_collection("cti_edges", edge=True)

      if not self.__db.has_collection("cti_vertices"):
        self.__db.create_collection("cti_vertices")

      if not self.__db.has_graph("cti_graph"):
        self.__graph = self.__db.create_graph(name="cti_graph", edge_definitions=[{"edge_collection": "cti_edges", "from_vertex_collections": ["cti_vertices"], "to_vertex_collections": ["cti_vertices"], }])
      else:
        self.__graph = self.__db.graph("cti_graph")

      vertex_collection = self.__graph.vertex_collection("cti_vertices")
      default_nodes = [{"_key": "general", "type": "cluster", "label": "General"}, {"_key": "defacement", "type": "cluster", "label": "Defacement"}, {"_key": "leak", "type": "cluster", "label": "Leak"}]

      for node in default_nodes:
        if not vertex_collection.has(node["_key"]):
          vertex_collection.insert(node)

    except Exception as ex:
      log.g().e(f"ARANGO GRAPH INIT ERROR: {ex}")
