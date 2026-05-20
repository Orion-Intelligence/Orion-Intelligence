import asyncio
from asyncio import sleep
from migrations.migration import migration_manager
from orion.api.server.config_manager.config_controller import config_controller
from orion.constants import constant
from orion.helper_manager.env_handler import env_handler
from orion.helper_manager.helper_controller import helper_controller
from orion.management.managers.cronjob_manager import cronjob_manager
from orion.management.managers.test_manager import test_manager
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS
from orion.services.log_manager.log_controller import log


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

    async def init_services(self, build_dir=None):
        while not self._is_available:
            try:
                _, writer = await asyncio.open_connection("elasticsearch", 9400)
                writer.close()
                await writer.wait_closed()
                await self.init_map_entities_task(build_dir)

                await elastic_controller.get_instance().initialize()
                await mongo_controller.get_instance().link_connection()

                await test_manager.get_instance().reset_test_mongo_and_import_mocks()

                await migration_manager.get_instance().init_migration()
                await mongo_controller.get_instance().ensure_indexes()
                await mongo_controller.get_instance().initialize()

                await test_manager.get_instance().reset_test_elastic_and_import_mocks()

                await redis_controller.getInstance().initialize()
                await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_DELETE_KEY, [config_controller.CONFIG_CACHE_KEY])
                await config_controller.getInstance().load_config()
                await asyncio.sleep(5)

                await arango_controller.get_instance().link_connection()
                await arango_controller.get_instance().initialize()
                await test_manager.get_instance().reset_test_arango_and_import_mocks()

                self._is_available = True
                return True
            except (OSError, ConnectionRefusedError):
                await asyncio.sleep(5)

        return False

    async def init_cronjobs(self):
        if env_handler.get_instance().env("TESTING_ENABLED", "0") == "0":
            while not self._is_available:
                await sleep(5)
            await cronjob_manager.get_instance().init_jobs()

    def check_status(self):
        return self._is_available

    @staticmethod
    async def build_assets(build_dir):
        helper_controller.build_assets(build_dir)

    async def init_map_entities_task(self, build_dir):
        watch_task = asyncio.create_task(self.init_map_entities(build_dir))
        watch_task.cancel()
        try:
            await watch_task
        except asyncio.CancelledError:
            pass

    async def init_map_entities(self, build_dir):
        power_plant_file = None
        power_plant_candidates = [
            build_dir / "assets" / "data" / "satellite" / "wri_power_plantsv2.0.json",
            build_dir.parent / "client" / "src" / "assets" / "data" / "satellite" / "wri_power_plantsv2.0.json",
        ]

        for candidate in power_plant_candidates:
            if candidate.exists():
                power_plant_file = candidate
                break

        if not power_plant_file:
            log.g().w("WRI power plants file not found, file watching disabled")
            return

        log.g().i(f"Loading power plants data from: {power_plant_file}")
        try:
            constant.power_plant_data = power_plant_file.read_text(encoding="utf-8")
            await elastic_controller.get_instance().reindex_power_plants_data()
            log.g().i("Initial power plants data indexed successfully")
        except Exception as ex:
            log.g().e(f"Error during initial indexing: {str(ex)}")

        last_modified = power_plant_file.stat().st_mtime
        log.g().i(f"File watcher started for: {power_plant_file}")

        while True:
            try:
                await asyncio.sleep(5)
                if power_plant_file.exists():
                    current_modified = power_plant_file.stat().st_mtime
                    if current_modified > last_modified:
                        last_modified = current_modified
                        log.g().i(f"Detected change in {power_plant_file.name}, re-indexing...")
                        try:
                            constant.power_plant_data = power_plant_file.read_text(encoding="utf-8")
                            await elastic_controller.get_instance().reindex_power_plants_data()
                        except Exception as ex:
                            log.g().e(f"Error during re-indexing: {str(ex)}")
            except Exception as ex:
                log.g().e(f"File watcher error: {str(ex)}")
                await asyncio.sleep(5)
