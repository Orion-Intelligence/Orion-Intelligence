import asyncio
from asyncio import sleep

from orion.management.managers.cronjob_manager import cronjob_manager
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
        while not self._is_available:
            try:
                reader, writer = await asyncio.open_connection("elasticsearch", 9400)
                writer.close()
                await writer.wait_closed()

                await elastic_controller.get_instance().initialize()
                await mongo_controller.getInstance().link_connection()
                await mongo_controller.getInstance().ensure_indexes()
                await mongo_controller.getInstance().initialize()
                await redis_controller.getInstance().initialize()
                await asyncio.sleep(5)

                self._is_available = True
                return True
            except (OSError, ConnectionRefusedError):
                await asyncio.sleep(5)

        return False

    async def init_cronjobs(self):
        while not self._is_available:
            await sleep(5)
        await cronjob_manager.get_instance().init()

    def check_status(self):
        return self._is_available
