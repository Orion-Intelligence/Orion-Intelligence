import motor.motor_asyncio
from odmantic import AIOEngine

from orion.api.interactive.tenant_manager.tenant_bootstrap import tenant_boostrap
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_enums import MONGO_CONNECTIONS
from orion.services.mongo_manager.shared_model.db_dump_model import db_dump_record_model
from orion.services.mongo_manager import *


class mongo_controller:
    __instance = None
    __m_connection = None

    @staticmethod
    def get_instance():
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
                password=MONGO_CONNECTIONS.S_MONGO_PASSWORD, )

            self.__m_connection = mongo_client[MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME]
            self.__engine = AIOEngine(client=mongo_client, database=MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME)

        except Exception as ex:
            log.g().e(f"MONGO CONNECTION ERROR: {ex}")

    async def ensure_indexes(self):
        user_collection = self.__engine.get_collection(db_user_account)

        await user_collection.create_index([("username", 1)], unique=True)

        await user_collection.create_index(
            [("role", 1)],
            unique=True,
            partialFilterExpression={"role": user_role.ADMIN.value},
            name="unique_admin_role", )

        await user_collection.create_index(
            [("tenant_uuid", 1)],
            unique=True,
            partialFilterExpression={"licenses": ["maintainer"]},
            name="unique_maintainer_per_company", )

        await self.__engine.get_collection(db_system_model).create_index("key", unique=True)

    def get_engine(self) -> AIOEngine:
        return self.__engine

    async def initialize(self):
        await self.ensure_indexes()

        default_tenant = await self.__engine.find_one(db_tenant_model, db_tenant_model.is_default == True)
        if not default_tenant:
            await tenant_boostrap(self.__engine)

    def get_admin(self):
        from starlette_admin.contrib.odmantic import Admin, ModelView
        admin = Admin(self.__engine, title="Admin Panel")

        admin.add_view(UserAdminView(db_user_account, engine=self.__engine, icon="fa fa-user-circle"))
        admin.add_view(TenantAdminView(db_tenant_model, engine=self.__engine, icon="fa fa-link"))
        admin.add_view(TenantKeyAdminView(db_keys, engine=self.__engine, icon="fa fa-link"))
        admin.add_view(ModelView(db_system_model, icon="fa fa-building"))
        admin.add_view(ModelView(db_url_data_model, icon="fa fa-link"))
        admin.add_view(ModelView(db_dump_record_model, icon="fa fa-link"))
        return admin
