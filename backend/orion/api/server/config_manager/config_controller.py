import asyncio
import json
from pathlib import Path

from fastapi import UploadFile, HTTPException
from fastapi.responses import Response

from orion.api.server.config_manager.model.config_data import config_data
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS


class config_controller:
    __instance = None
    CONFIG_CACHE_KEY = "system_config"

    @staticmethod
    def getInstance():
        if config_controller.__instance is None:
            config_controller()
        return config_controller.__instance

    def __init__(self):
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent

        self.SYSTEM_DIR = self.BASE_DIR / "static" / "resource" / "system"
        self.SYSTEM_DIR.mkdir(parents=True, exist_ok=True)

        self.BASE_URL = 'http://localhost:4200'
        if config_controller.__instance is not None:
            return

        config_controller.__instance = self
        self._config = {}
        self._engine = mongo_controller.get_instance().get_engine()
        asyncio.create_task(self.load_config())

    async def _save_config_to_redis(self):
        try:
            await redis_controller.getInstance().invoke_trigger(
                REDIS_COMMANDS.S_SET_STRING,
                [self.CONFIG_CACHE_KEY, json.dumps(self._config), None]
            )
        except Exception as ex:
            log.g().w(f"Redis config cache save skipped: {str(ex)}")

    async def load_config(self, force_db: bool = False):
        try:
            if self._engine is None:
                self._engine = mongo_controller.get_instance().get_engine()
            if not force_db:
                try:
                    cached = await redis_controller.getInstance().invoke_trigger(
                        REDIS_COMMANDS.S_GET_STRING,
                        [self.CONFIG_CACHE_KEY, None, None]
                    )
                    if cached:
                        config = json.loads(cached)
                        if isinstance(config, dict):
                            self._config = config
                            return
                except Exception as ex:
                    log.g().w(f"Redis config cache read skipped: {str(ex)}")

            records = await self._engine.find(db_system_model)
            self._config = {record.key.value: record.value for record in records}
            await self._save_config_to_redis()
        except Exception as ex:
            log.g().e(f"Error loading config: {ex}")

    def get(self, key: str, default=None):
        return self._config.get(key, default)

    async def get_cached(self, key: str, default=None):
        await self.load_config()
        return self.get(key, default)

    @staticmethod
    def _is_smtp_configured(meta_info_raw) -> bool:
        try:
            meta_info = json.loads(meta_info_raw) if isinstance(meta_info_raw, str) else {}
        except (TypeError, ValueError):
            return False
        required = [
            meta_info.get("ACCOUNTS_MAIL"),
            meta_info.get("ACCOUNTS_MAIL_PASSWORD"),
            meta_info.get("ACCOUNTS_SMTP_SERVER"),
            meta_info.get("ACCOUNTS_SMTP_PORT")
        ]
        if any(not value for value in required):
            return False
        try:
            smtp_port = int(str(meta_info.get("ACCOUNTS_SMTP_PORT")))
        except ValueError:
            return False
        return 1 <= smtp_port <= 65535

    def _build_system_info_from_cache(self) -> config_data:
        fresh_config = dict(self._config)

        def asset(base: str) -> str:
            custom = self.SYSTEM_DIR / f"{base}_custom.png"
            if custom.is_file():
                return f"/api/s/static/system/{base}_custom.png"
            return f"/api/s/static/system/{base}_default.png"

        fresh_config["logo_url"] = asset("logo_url")
        fresh_config["logo_wide_light"] = asset("logo_wide_light")
        fresh_config["logo_wide_dark"] = asset("logo_wide_dark")
        fresh_config["auth_dashboard_icon"] = asset("auth_dashboard_icon")
        fresh_config["meta_info"] = fresh_config.get("meta_info") or json.dumps({
            "S_HOME_HEADER_DATA_SOURCES": "https://www.orionintelligence.org/sources",
            "S_HOME_HEADER_ADVERSARIES": "https://www.orionintelligence.org/adversaries",
            "S_HOME_HEADER_PRICING": "https://www.orionintelligence.org/pricing",
            "S_HOME_HEADER_PRICING_ALLOWED": True
        })
        fresh_config["smtp_configured"] = "1" if self._is_smtp_configured(fresh_config.get("meta_info")) else "0"
        return config_data(settings=fresh_config)

    async def get_system_info(self) -> config_data:
        try:
            self.SYSTEM_DIR = self.BASE_DIR / "static" / "resource" / "system"
            await self.load_config()
            return self._build_system_info_from_cache()

        except Exception as ex:
            log.g().e(f"Error fetching config: {ex}")
            return config_data(settings={
                "s_onion": "",
                "logo_url": "/api/s/static/system/logo_url_default.png",
                "logo_wide_light": "/api/s/static/system/logo_wide_light_default.png",
                "logo_wide_dark": "/api/s/static/system/logo_wide_dark_default.png",
                "meta_info": json.dumps({
                    "S_HOME_HEADER_DATA_SOURCES": "https://www.orionintelligence.org/sources",
                    "S_HOME_HEADER_ADVERSARIES": "https://www.orionintelligence.org/adversaries",
                    "S_HOME_HEADER_PRICING": "https://www.orionintelligence.org/pricing",
                    "S_HOME_HEADER_PRICING_ALLOWED": True
                }),
                "smtp_configured": "0",
            })

    async def update_public_config(self, data: config_data):
        if self._engine is None:
            self._engine = mongo_controller.get_instance().get_engine()
        for key_str, value in data.settings.items():
            if key_str == "language":
                key = AllowedKeys.LANGUAGE_ALLOWED
            elif key_str == "logo_url":
                key = AllowedKeys.LOGO_URL
            elif key_str == "app_name":
                key = AllowedKeys.APP_NAME
            elif key_str == "meta_info":
                key = AllowedKeys.META_INFO
            elif key_str == "ai_endpoint_enabled":
                key = AllowedKeys.AI_ENDPOINT_ENABLED
            elif key_str == "s_onion":
                key = AllowedKeys.S_ONION
            else:
                continue

            record = await self._engine.find_one(
                db_system_model, db_system_model.key == key)

            if key == AllowedKeys.LOGO_URL and value == "":
                file_path = self.SYSTEM_DIR / "logo.png"
                if file_path.exists():
                    file_path.unlink()

            if record:
                record.value = value
                await self._engine.save(record)
            else:
                await self._engine.save(
                    db_system_model(key=key, value=value))

        await self.load_config(force_db=True)
        return await self.get_system_info()

    async def getSystemResource(self, name: str):
        file_path = self.SYSTEM_DIR / f"{name}.png"

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Resource not found")

        with open(file_path, "rb") as f:
            data = f.read()

        return Response(content=data, media_type="image/png")

    async def uploadSystemResource(self, file: UploadFile, current_user, key: str):
        from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
        contents = await file.read()
        MAX_FILE_SIZE = 1024 * 1024

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large! Maximum allowed size is 1 MB.")

        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=415, detail="Invalid file type. Only image files are allowed.")

        file_name = f"{key}_custom.png"
        file_path = self.SYSTEM_DIR / file_name
        with open(file_path, "wb") as f:
            f.write(contents)

        record = await self._engine.find_one(db_system_model, db_system_model.key == key)
        if record:
            record.value = file_name
            await self._engine.save(record)
        else:
            record = db_system_model(key=key, value=file_name)
            await self._engine.save(record)

        await self.load_config(force_db=True)

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            "upload_image"
        )

        prefix = "/api/s/static/system/"

        return {
            AllowedKeys.LOGO_URL: prefix + record.value if key == AllowedKeys.LOGO_URL else None,
            AllowedKeys.LOGO_WIDE_LIGHT: prefix + record.value if key == AllowedKeys.LOGO_WIDE_LIGHT else None,
            AllowedKeys.LOGO_WIDE_DARK: prefix + record.value if key == AllowedKeys.LOGO_WIDE_DARK else None,
            AllowedKeys.AUTH_DASHBOARD_ICON: prefix + record.value if key == AllowedKeys.AUTH_DASHBOARD_ICON else None,
        }
