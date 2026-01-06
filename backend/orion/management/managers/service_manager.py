import asyncio
from asyncio import sleep
from orion.api.server.config_manager.config_controller import config_controller
from orion.helper_manager.helper_controller import helper_controller
from orion.management.managers.cronjob_manager import cronjob_manager
from orion.management.managers.test_manager import test_manager
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.redis_manager.redis_controller import redis_controller


class service_manager:
    __instance = None

    @staticmethod
    def get_instance():
        if service_manager.__instance is None:
            service_manager()
        return service_manager.__instance

    def __init__(self, url="http://elasticsearch:9400/_cluster/health"):
        if service_manager.__instance is not None:
            return

        service_manager.__instance = self
        self.__url = url
        self._is_available = False

    async def init_services(self):
        await test_manager.get_instance().apply_test_overrides()

        while not self._is_available:
            try:
                _, writer = await asyncio.open_connection("elasticsearch", 9400)
                writer.close()
                await writer.wait_closed()

                await elastic_controller.get_instance().initialize()
                await mongo_controller.get_instance().link_connection()
                await mongo_controller.get_instance().ensure_indexes()
                await mongo_controller.get_instance().initialize()

                await test_manager.get_instance().reset_test_mongo_and_import_mocks()
                await test_manager.get_instance().reset_test_elastic_and_import_mocks()

                await redis_controller.getInstance().initialize()
                await config_controller.getInstance().load_config()
                await asyncio.sleep(5)

                arango_controller.get_instance().link_connection()
                arango_controller.get_instance().initialize()

                self._is_available = True
                return True
            except (OSError, ConnectionRefusedError):
                await asyncio.sleep(5)

        return False

    async def init_cronjobs(self):
        while not self._is_available:
            await sleep(5)
        await cronjob_manager.get_instance().init_jobs()

    def check_status(self):
        return self._is_available

    @staticmethod
    async def build_assets(build_dir):
        helper_controller.build_assets(build_dir)
