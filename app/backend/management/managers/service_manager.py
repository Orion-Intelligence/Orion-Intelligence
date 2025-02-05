import asyncio

from backend.management.managers.cronjob_manager import cronjob_manager
from backend.services.elastic_manager.elastic_controller import elastic_controller
from backend.services.mongo_manager.mongo_controller import mongo_controller
from backend.services.redis_manager.redis_controller import redis_controller


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

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.wait_until_available())
        except RuntimeError:
            asyncio.run(self.wait_until_available())

    async def wait_until_available(self):
        while not self._is_available:
            try:
                reader, writer = await asyncio.open_connection("elasticsearch", 9400)
                writer.close()
                await writer.wait_closed()

                await elastic_controller.get_instance().initialize()
                await mongo_controller.getInstance().link_connection()
                await redis_controller.getInstance().initialize()
                await asyncio.sleep(5)

                self._is_available = True
                await cronjob_manager.get_instance().init()
                return True
            except (OSError, ConnectionRefusedError):
                await asyncio.sleep(5)

        return False

    def check_status(self):
        return self._is_available
