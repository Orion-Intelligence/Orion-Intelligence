import motor.motor_asyncio
from odmantic import AIOEngine
from odmantic.exceptions import DuplicateKeyError
from starlette_admin.contrib.odmantic import Admin, ModelView
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_enums import (MONGO_CONNECTIONS)
from orion.services.mongo_manager.shared_model.db_system import db_system
from orion.services.mongo_manager.shared_model.db_url_data_model import db_url_data_model
from orion.services.session_manager.session_enums import admin_mock, crawler_mock
from orion.services.mongo_manager.shared_model.db_auth_models import (db_user_account, user_role)


class mongo_controller:
  __instance = None
  __m_connection = None

  @staticmethod
  def getInstance():
    if mongo_controller.__instance is None:
      mongo_controller()
    return mongo_controller.__instance

  def __init__(self):
    mongo_controller.__instance = self
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
    await self.__engine.get_collection(db_user_account).create_index([("username", 1)], unique=True)

  def get_engine(self)-> AIOEngine:
    return self.__engine

  async def initialize(self):
    existing_admin = await self.__engine.find_one(db_user_account, db_user_account.role == user_role.ADMIN)
    if not existing_admin:
      try:
        admin_user = db_user_account(
          username=admin_mock["username"],
          password=admin_mock["password"],
          role=user_role.ADMIN,
        )
        await self.__engine.save(admin_user)
        crawler_user = db_user_account(
          username=crawler_mock["username"],
          password=crawler_mock["password"],
          role=user_role.CRAWLER,
        )
        await self.__engine.save(crawler_user)
      except DuplicateKeyError:
        print("⚠️ Duplicate admin user detected. Skipping insert.")

  def get_admin(self):
    admin = Admin(self.__engine, title="Admin Panel")
    admin.add_view(ModelView(db_user_account))
    admin.add_view(ModelView(db_url_data_model))
    return admin
