from orion.helper_manager.env_handler import env_handler


class ARANGO_CONNECTIONS:
  ARANGO_URL = "http://trusted-web-arangodb:8529"
  ARANGO_DATABASE_NAME = "orion-web"
  ARANGO_USERNAME = env_handler.get_instance().env("ARANGO_USERNAME")
  ARANGO_PASSWORD = env_handler.get_instance().env("ARANGO_PASSWORD")
