import motor.motor_asyncio
from starlette_admin.contrib.odmantic import Admin, ModelView
from backend.services.log_manager.log_controller import log
from backend.services.mongo_manager.mongo_enums import MONGO_CONNECTIONS, MONGODB_KEYS, MANAGE_MONGO_MESSAGES
from backend.services.mongo_manager.mongo_request_generator import mongo_request_generator
from backend.services.session_manager.shared_model.auth_models import account


class mongo_controller:
  __instance = None
  __m_connection = None
  __m_mongo_request_generator = None

  @staticmethod
  def getInstance():
    if mongo_controller.__instance is None:
      mongo_controller()
    return mongo_controller.__instance

  def __init__(self):
    mongo_controller.__instance = self
    self.__m_mongo_request_generator = mongo_request_generator()
    self.__m_connection = None

  async def link_connection(self):
    try:
      mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
        MONGO_CONNECTIONS.S_MONGO_DATABASE_IP,
        MONGO_CONNECTIONS.S_MONGO_DATABASE_PORT,
        username=MONGO_CONNECTIONS.S_MONGO_USERNAME,
        password=MONGO_CONNECTIONS.S_MONGO_PASSWORD
      )

      self.__m_connection = mongo_client[MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME]
    except Exception as ex:
      log.g().e(f"MONGO CONNECTION ERROR: {ex}")

  async def initialize(self, admin_user):
    existing_admin = await self.__m_connection["accounts"].find_one({"is_admin": True})
    admin = Admin(self.__m_connection, title="Admin Panel")
    admin.add_view(ModelView(account))

    if not existing_admin:
      await self.__m_connection["accounts"].insert_one(admin_user)

  async def get_url_status(self, content_type, index, network, skip, limit):
    try:
      S_URL_STATUS, query_filter = self.__m_mongo_request_generator.on_fetch_url_status(content_type, index, network)
      pipeline = [
        {"$match": query_filter},
        {"$facet": {
          "total_count": [{"$count": "count"}],
          "documents": [{"$skip": skip}, {"$limit": limit}] if limit else [{"$skip": skip}]
        }}
      ]

      result = await self.__m_connection[S_URL_STATUS].aggregate(pipeline).to_list(None)
      return result[0].get("documents", []), result[0].get("total_count", [{}])[0].get("count", 0), True
    except Exception as ex:
      log.g().e(f"MONGO EXCEPTION : {MANAGE_MONGO_MESSAGES.S_READ_FAILURE}: {ex}")
      return MANAGE_MONGO_MESSAGES.S_READ_FAILURE, 0, False

  async def get_user(self, username):
    return await self.__m_connection["accounts"].find_one({"username": username})

  async def update_url_status(self, url, url_status=None, leak_status=None, content_type=None, network_type=None):
    try:
      m_data = self.__m_mongo_request_generator.on_update_url_status(url, url_status, leak_status, content_type, network_type)
      await self.__m_connection[m_data[MONGODB_KEYS.S_DOCUMENT]].update_one(
        m_data[MONGODB_KEYS.S_FILTER], m_data[MONGODB_KEYS.S_VALUE], upsert=True
      )
      return True, MANAGE_MONGO_MESSAGES.S_UPDATE_SUCCESS
    except Exception as ex:
      log.g().e(f"MONGO EXCEPTION : {MANAGE_MONGO_MESSAGES.S_UPDATE_FAILURE}: {ex}")
      return False, MANAGE_MONGO_MESSAGES.S_UPDATE_FAILURE
