import asyncio
import json
from asyncio import sleep
from jinja2 import Environment, FileSystemLoader

from orion.api.server.config_manager.config_controller import config_controller
from orion.helper_manager.env_handler import env_handler
from orion.management.managers.cronjob_manager import cronjob_manager
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.mongo_enums import MONGO_CONNECTIONS
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.redis_manager.redis_controller import redis_controller
from orion.constants.constant import allowed_keys
from orion.constants import constant
from orion.services.session_manager.session_enums import admin_mock, admin_user, crawler_mock, crawler_user


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

    async def test_server(self):
        if env_handler.get_instance().env("TESTING_ENABLED", "0") == "1":
            MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME = 'orion-web_test_v3'

            admin_mock["username"] = "admin_test_username"
            admin_user["password"] = db_user_account.hash_password("Zq9M#rX@e7W^B0T+f(ysG!kJc1d2mC&N%hAUEP)6Y4n$R8VbHS")

            crawler_mock["username"] = "crawler_test_username"
            crawler_user["password"] = db_user_account.hash_password("Zq9M#rX@e7W^B0T+f(ysG!kJc1d2mC&N%hAUEP)6Y4n$R8VbHS")

    async def init_services(self):
        await self.test_server()
        while not self._is_available:
            try:
                _, writer = await asyncio.open_connection("elasticsearch", 9400)
                writer.close()
                await writer.wait_closed()

                await elastic_controller.get_instance().initialize()
                await mongo_controller.get_instance().link_connection()
                await mongo_controller.get_instance().ensure_indexes()
                await mongo_controller.get_instance().initialize()
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
        entities_file = build_dir / "assets" / "data" / "entities_data" / "entities.json"
        if not entities_file.exists():
            raise FileNotFoundError(f"entities.json not found at {entities_file}")

        with open(entities_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        allowed_keys.clear()
        for item in data:
            if "key" in item:
                allowed_keys.add(item["key"])

        mail_templete_env = Environment(loader=FileSystemLoader(build_dir / "assets" / "data" / "mail_template_data"))
        constant.mail_template = mail_templete_env.get_template("mail_template.html")
        license_rules_env = Environment(loader=FileSystemLoader(build_dir / "assets" / "data" / "licenses"))
        license_rules_template = license_rules_env.get_template("license_rules.json")
        license_rules_json_str = license_rules_template.render() 
        constant.license_rules = json.loads(license_rules_json_str)
        
