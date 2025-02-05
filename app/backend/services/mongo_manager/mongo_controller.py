import motor.motor_asyncio
from backend.services.log_manager.log_controller import log
from backend.services.mongo_manager.mongo_enums import MONGO_CONNECTIONS, MONGODB_KEYS, MANAGE_MONGO_MESSAGES, MONGODB_CRUD
from backend.services.mongo_manager.mongo_request_generator import mongo_request_generator

class mongo_controller:
    # Singleton instance
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
        self.__m_connection = motor.motor_asyncio.AsyncIOMotorClient(
            MONGO_CONNECTIONS.S_MONGO_DATABASE_IP,
            MONGO_CONNECTIONS.S_MONGO_DATABASE_PORT,
            username=MONGO_CONNECTIONS.S_MONGO_USERNAME,
            password=MONGO_CONNECTIONS.S_MONGO_PASSWORD
        )[MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME]

    async def __create(self, p_data):
        try:
            await self.__m_connection[p_data[MONGODB_KEYS.S_DOCUMENT]].insert_one(p_data[MONGODB_KEYS.S_VALUE])
            return True, MANAGE_MONGO_MESSAGES.S_INSERT_SUCCESS
        except Exception as ex:
            log.g().e(f"MONGO E2: {MANAGE_MONGO_MESSAGES.S_INSERT_FAILURE}: {ex}")
            return False, MANAGE_MONGO_MESSAGES.S_INSERT_FAILURE

    async def __read(self, p_data, p_skip, p_limit):
        try:
            pipeline = [
                {"$match": p_data[MONGODB_KEYS.S_FILTER]},
                {"$facet": {
                    "total_count": [{"$count": "count"}],
                    "documents": [{"$skip": p_skip}, {"$limit": p_limit}] if p_limit else [{"$skip": p_skip}]
                }}
            ]
            result = await self.__m_connection[p_data[MONGODB_KEYS.S_DOCUMENT]].aggregate(pipeline).to_list(None)
            total_count = result[0]["total_count"][0]["count"] if result[0]["total_count"] else 0
            documents = result[0]["documents"]
            return documents, total_count, True
        except Exception as ex:
            log.g().e(f"MONGO E3: {MANAGE_MONGO_MESSAGES.S_READ_FAILURE}: {ex}")
            return MANAGE_MONGO_MESSAGES.S_READ_FAILURE, 0, False

    async def __replace(self, p_data, p_upsert):
        try:
            await self.__m_connection[p_data[MONGODB_KEYS.S_DOCUMENT]].replace_one(
                p_data[MONGODB_KEYS.S_FILTER], p_data[MONGODB_KEYS.S_VALUE], upsert=p_upsert
            )
            return True, MANAGE_MONGO_MESSAGES.S_REPLACE_SUCCESS
        except Exception as ex:
            log.g().e(f"MONGO E4: {MANAGE_MONGO_MESSAGES.S_REPLACE_FAILURE}: {ex}")
            return False, str(ex)

    async def __update(self, p_data):
        try:
            await self.__m_connection[p_data[MONGODB_KEYS.S_DOCUMENT]].update_one(
                p_data[MONGODB_KEYS.S_FILTER], p_data[MONGODB_KEYS.S_VALUE], upsert=True
            )
            return True, MANAGE_MONGO_MESSAGES.S_UPDATE_SUCCESS
        except Exception as ex:
            log.g().e(f"MONGO E4: {MANAGE_MONGO_MESSAGES.S_UPDATE_FAILURE}: {ex}")
            return False, MANAGE_MONGO_MESSAGES.S_UPDATE_FAILURE

    async def __delete(self, p_data):
        try:
            result = await self.__m_connection[p_data[MONGODB_KEYS.S_DOCUMENT]].delete_one(p_data[MONGODB_KEYS.S_FILTER])
            return result.deleted_count, MANAGE_MONGO_MESSAGES.S_DELETE_SUCCESS
        except Exception as ex:
            log.g().e(f"MONGO E5: {MANAGE_MONGO_MESSAGES.S_DELETE_FAILURE}: {ex}")
            return False, MANAGE_MONGO_MESSAGES.S_DELETE_FAILURE

    async def invoke_trigger(self, p_commands, p_data=None):
        m_request = p_data[0]
        m_data = p_data[1]
        m_param = p_data[2]

        m_request = self.__m_mongo_request_generator.invoke_trigger(m_request, m_data)

        if p_commands == MONGODB_CRUD.S_CREATE:
            return await self.__create(m_request)
        elif p_commands == MONGODB_CRUD.S_READ:
            return await self.__read(m_request, m_param[0], m_param[1])
        elif p_commands == MONGODB_CRUD.S_UPDATE:
            return await self.__update(m_request)
        elif p_commands == MONGODB_CRUD.S_REPLACE:
            return await self.__replace(m_request, m_param[0])
        elif p_commands == MONGODB_CRUD.S_DELETE:
            return await self.__delete(m_request)
