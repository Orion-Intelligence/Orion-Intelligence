import motor.motor_asyncio
from odmantic import AIOEngine
from odmantic.exceptions import DuplicateKeyError
from starlette_admin.contrib.odmantic import Admin, ModelView
from backend.services.log_manager.log_controller import log
from backend.services.mongo_manager.mongo_enums import (MONGO_CONNECTIONS, MANAGE_MONGO_MESSAGES)
from backend.services.mongo_manager.mongo_request_generator import (mongo_request_generator)
from backend.services.session_manager.session_enums import admin_mock, crawler_mock
from backend.services.session_manager.shared_model.auth_models import (user_account,user_role)


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
    self.__engine = None

  async def link_connection(self):
    try:
      mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
        MONGO_CONNECTIONS.S_MONGO_DATABASE_IP,
        MONGO_CONNECTIONS.S_MONGO_DATABASE_PORT,
        username=MONGO_CONNECTIONS.S_MONGO_USERNAME,
        password=MONGO_CONNECTIONS.S_MONGO_PASSWORD,
      )

      self.__m_connection = mongo_client[MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME]
      self.__engine = AIOEngine(client=mongo_client, database=MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME)

    except Exception as ex:
      log.g().e(f"MONGO CONNECTION ERROR: {ex}")

  async def ensure_indexes(self):
    await self.__engine.get_collection(user_account).create_index([("username", 1)], unique=True)

  async def initialize(self):
    existing_admin = await self.__engine.find_one(user_account, user_account.role == user_role.ADMIN)
    if not existing_admin:
      try:
        admin_user = user_account(
          username=admin_mock["username"],
          password=admin_mock["password"],
          role=user_role.ADMIN,
        )
        await self.__engine.save(admin_user)
        crawler_user = user_account(
          username=crawler_mock["username"],
          password=crawler_mock["password"],
          role=user_role.CRAWLER,
        )
        await self.__engine.save(crawler_user)
      except DuplicateKeyError:
        print("⚠️ Duplicate admin user detected. Skipping insert.")

  def get_admin(self):
    admin = Admin(self.__engine, title="Admin Panel")
    admin.add_view(ModelView(user_account))
    return admin

  async def get_user(self, username):
    return await self.__m_connection["user_account"].find_one({"username": username})

  async def get_url_status(self, content_type, index, network, skip, limit):
    try:
      S_URL_STATUS, query_filter = self.__m_mongo_request_generator.on_fetch_url_status(content_type, index, network)
      pipeline = [
        {"$match": query_filter},
        {
          "$facet": {
            "total_count": [{"$count": "count"}],
            "documents": [{"$skip": skip}, {"$limit": limit}]
            if limit
            else [{"$skip": skip}],
          }
        },
      ]

      result = (await self.__m_connection[S_URL_STATUS] .aggregate(pipeline).to_list(None))
      return result[0].get("documents", []), result[0].get("total_count", [{}])[0].get("count", 0), True
    except Exception as ex:
      log.g().e(f"MONGO EXCEPTION : {MANAGE_MONGO_MESSAGES.S_READ_FAILURE}: {ex}")
      return MANAGE_MONGO_MESSAGES.S_READ_FAILURE, 0, False

  async def update_url_status(self, url, url_status=None, leak_status=None, content_type=None, network_type=None):
    try:
      m_document, m_key, m_values = self.__m_mongo_request_generator.on_update_url_status(url, url_status, leak_status, content_type, network_type)
      await self.__m_connection[m_document].update_one(m_key, m_values, upsert=True)
      return True, MANAGE_MONGO_MESSAGES.S_UPDATE_SUCCESS
    except Exception as ex:
      log.g().e(f"MONGO EXCEPTION : {MANAGE_MONGO_MESSAGES.S_UPDATE_FAILURE}: {ex}")
      return False, MANAGE_MONGO_MESSAGES.S_UPDATE_FAILURE
