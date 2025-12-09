import asyncio
from fastapi import UploadFile,HTTPException
from pathlib import Path
from fastapi.staticfiles import StaticFiles
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
        self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "admin-images"
        self.IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        self.BASE_URL='http://localhost:4200'
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
        
    async def update_all(self, data: config_data):
        for key_str, value in data.settings.items():
            try:
                key = AllowedKeys(key_str)
            except ValueError:
                continue

            record = await self._engine.find_one(
                db_system_model,
                db_system_model.key == key
            )

            if record:
                record.value = value
                await self._engine.save(record)
            else:
                await self._engine.save(
                    db_system_model(key=key, value=value)
                )

    async def upload_logo(self, file: UploadFile):
        contents = await file.read()

        MAX_FILE_SIZE = 50 * 1024  

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(413, "File too large (max 50KB)")

        if not file.content_type.startswith("image/"):
            raise HTTPException(415, "Only image files are allowed")

        file_ext = file.filename.split(".")[-1].lower()
        file_path = self.IMAGE_DIR / f"logo.{file_ext}"

        with open(file_path, "wb") as f:
            f.write(contents)

        logo_url = f"{self.BASE_URL}{self.BASE_DIR}/static/resource/admin-images/{file_path.name}"
        await self.update_all(
        config_data(settings={
            AllowedKeys.LOGO_URL.value: logo_url
        })
    )
        return {
            "success": True,
            "logo_url": logo_url
        }


