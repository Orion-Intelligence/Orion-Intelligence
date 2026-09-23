import asyncio
import time
from asyncio import sleep
from pathlib import Path
from migrations.migration import migration_manager
from orion.services.log_manager.log_controller import log
from orion.api.interactive.backup_manager.backup_manager import BackupManager
from orion.api.interactive.social_manager.social_scanner import social_scanner
from orion.api.server.config_manager.config_controller import config_controller
from orion.helper_manager.env_handler import env_handler
from orion.helper_manager.helper_controller import helper_controller
from orion.management.managers.cronjob_manager import cronjob_manager
from orion.management.managers.test_manager import test_manager
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS


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

    async def init_services(self, build_dir=None, run_migrations: bool = True):
        self.prepare_runtime_dirs()
        build_dir = build_dir or self.default_build_dir()
        while not self._is_available:
            try:
                overall_start = time.monotonic()

                async def _step(name, coro):
                    start = time.monotonic()
                    result = await coro
                    log.g().i(f"INIT {name}: {time.monotonic() - start:.1f}s (elapsed {time.monotonic() - overall_start:.1f}s)")
                    return result

                _, writer = await asyncio.open_connection("elasticsearch", 9400)
                writer.close()
                await writer.wait_closed()

                await _step("elastic.initialize", elastic_controller.get_instance().initialize())
                await _step("mongo.link_connection", mongo_controller.get_instance().link_connection())

                await _step("reset_test_mongo", test_manager.get_instance().reset_test_mongo_and_import_mocks())

                if run_migrations:
                    await _step("migrations", migration_manager.get_instance().init_migration())
                await _step("mongo.ensure_indexes", mongo_controller.get_instance().ensure_indexes())
                await _step("mongo.initialize", mongo_controller.get_instance().initialize())

                await _step("reset_test_elastic", test_manager.get_instance().reset_test_elastic_and_import_mocks())

                await _step("redis.initialize", redis_controller.getInstance().initialize())
                await _step("clear_test_insight_cache", self.clear_test_insight_cache())
                await _step("build_map_assets", self.build_map_assets(build_dir))
                await _step("load_config", config_controller.getInstance().load_config(force_db=True))
                await asyncio.sleep(5)

                async with redis_controller.getInstance().lock("backup:startup_recovery", timeout=3600, blocking_timeout=3600):
                    await _step("backup.resolve_interrupted_restore", BackupManager.get_instance().resolve_interrupted_restore())
                    await _step("backup.resolve_interrupted_tenant_restore", BackupManager.get_instance().resolve_interrupted_tenant_restore())
                    await _step("backup.clear_stale_backup_maintenance", BackupManager.get_instance().clear_stale_backup_maintenance())

                await _step("arango.link_connection", arango_controller.get_instance().link_connection())
                await _step("arango.initialize", arango_controller.get_instance().initialize())
                await _step("reset_test_arango", test_manager.get_instance().reset_test_arango_and_import_mocks())

                self._is_available = True
                log.g().i(f"INIT complete: all services ready in {time.monotonic() - overall_start:.1f}s")
                asyncio.create_task(social_scanner.get_instance().resume_pending())
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
    async def clear_test_insight_cache():
        if env_handler.get_instance().env("TESTING_ENABLED", "0") != "1":
            return

        for key in (
            REDIS_KEYS.APP_INSIGHT_KEY,
            f"{REDIS_KEYS.APP_INSIGHT_KEY}:country_v1",
            REDIS_KEYS.INSIGHT_STAT,
            REDIS_KEYS.GRAPH_INSIGHT_STAT,
        ):
            await redis_controller.getInstance().invoke_trigger(REDIS_COMMANDS.S_DELETE_KEY, [key])

    @staticmethod
    async def build_assets(build_dir):
        await asyncio.to_thread(helper_controller.build_assets, build_dir)

    async def build_map_assets(self, build_dir):
        await helper_controller.init_map_entities_task(build_dir)
        await helper_controller.init_persona_posts_task(build_dir)

    @staticmethod
    def prepare_runtime_dirs():
        base = Path(__file__).resolve().parents[3]
        for directory in ("workspace/parser/parser_files", "workspace/logs", "workspace/resource", "backups"):
            (base / directory).mkdir(parents=True, exist_ok=True)

    @staticmethod
    def default_build_dir():
        return Path(__file__).resolve().parents[3] / "workspace" / "build"
