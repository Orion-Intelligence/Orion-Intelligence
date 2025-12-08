import asyncio

from orion.api.server.config_manager.model.config_data import config_data
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import db_system_model


class config_controller:
    __instance = None

    @staticmethod
    def getInstance():
        if config_controller.__instance is None:
            config_controller()
        return config_controller.__instance

    def __init__(self):
        if config_controller.__instance is not None:
            return

        config_controller.__instance = self
        self._config = {}
        self._engine = mongo_controller.get_instance().get_engine()
        asyncio.create_task(self.load_config())

    async def load_config(self):
        try:
            records = await self._engine.find(db_system_model)
            self._config = {record.key.value: record.value for record in records}
        except Exception:
            pass

    def get(self, key: str, default=None):
        return self._config.get(key, default)

    async def refresh_config(self):
        await self.load_config()

    async def get_all_alerts(self) -> config_data:
        try:
            records = await self._engine.find(db_system_model)
            fresh_config = {record.key.value: record.value for record in records}
            return config_data(settings=fresh_config)
        except Exception as ex:
            log.g().e(f"Error fetching config: {ex}")
            return config_data(settings={})
