import asyncio
import json
from pathlib import Path

from fastapi import UploadFile, HTTPException
from fastapi.responses import Response

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.server.config_manager.model.config_data import config_data
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model


class config_controller:
    __instance = None

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

    async def load_config(self):
        try:
            records = await self._engine.find(db_system_model)
            self._config = {record.key.value: record.value for record in records}
        except Exception as ex:
            log.g().e(f"Error loading config: {ex}")

    def get(self, key: str, default=None):
        return self._config.get(key, default)

    async def refresh_config(self):
        await self.load_config()

    def _build_system_info_from_cache(self) -> config_data:
        fresh_config = dict(self._config)

        def asset(base: str) -> str:
            custom = self.SYSTEM_DIR / f"{base}_custom.png"
            if custom.is_file():
                return f"/api/s/static/system/{base}_custom.png"
            return f"/api/s/static/system/{base}_default.png"

        fresh_config["ai_endpoint"] = "1"
        fresh_config["app_name"] = f"{fresh_config.get('app_name') or 'Orion Intelligence'} - BACKEND LIVE TEST 2"
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
        return config_data(settings=fresh_config)

    async def get_system_info(self) -> config_data:
        try:
            self.SYSTEM_DIR = self.BASE_DIR / "static" / "resource" / "system"
            if not self._config:
                await self.load_config()
            return self._build_system_info_from_cache()

        except Exception as ex:
            log.g().e(f"Error fetching config: {ex}")
            return config_data(settings={
                "ai_endpoint": "1",
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
            })

    async def update_public_config(self, data: config_data):
        for key_str, value in data.settings.items():
            if key_str == "language":
                key = AllowedKeys.LANGUAGE_ALLOWED
            elif key_str == "logo_url":
                key = AllowedKeys.LOGO_URL
            elif key_str == "app_name":
                key = AllowedKeys.APP_NAME
            elif key_str == "meta_info":
                key = AllowedKeys.META_INFO
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

        await self.refresh_config()
        return await self.get_system_info()

    async def getSystemResource(self, name: str):
        file_path = self.SYSTEM_DIR / f"{name}.png"

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Resource not found")

        with open(file_path, "rb") as f:
            data = f.read()

        return Response(content=data, media_type="image/png")

    async def uploadSystemResource(self, file: UploadFile, current_user, key: str):
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

        await self.refresh_config()

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
