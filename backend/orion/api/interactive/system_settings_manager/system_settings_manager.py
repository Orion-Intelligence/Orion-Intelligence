from pathlib import Path

from orion.api.interactive.system_settings_manager.model.system_settings_parma_model import SystemSettingsParmaModel
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys,db_system_model,VALID_LANGUAGE_CODES
from orion.services.mongo_manager.mongo_controller import mongo_controller


class SystemSettingsManager:
    __instance = None

    @staticmethod
    def get_instance():
        if SystemSettingsManager.__instance is None:
            SystemSettingsManager.__instance = SystemSettingsManager()
        return SystemSettingsManager.__instance

    def __init__(self):
        if SystemSettingsManager.__instance is not None:
            raise Exception("This class is a singleton!")
        self._engine = mongo_controller.get_instance().get_engine()
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
        self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "company-profile-images"
        self.IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        SystemSettingsManager.__instance = self

    async def get_settings(self) -> dict:
        return {
            "language": await self._get_value(AllowedKeys.LANGUAGE_ALLOWED),
            "version": await self._get_value(AllowedKeys.VERSION),
            "api_allowed": await self._get_value(AllowedKeys.API_ALLOWED),
        }

    async def update_settings(self, parma: SystemSettingsParmaModel):
        await self._update_key(AllowedKeys.LANGUAGE_ALLOWED, parma.language)
        await self._update_key(AllowedKeys.VERSION, parma.version)
        await self._update_key(AllowedKeys.API_ALLOWED, parma.api_allowed)


    async def _get_value(self,key: AllowedKeys) -> str:
        record = await self._engine.find_one(
            db_system_model,
            db_system_model.key == key
        )
        return record.value if record else ""
    
    async def _update_key(self,key: AllowedKeys, value: str) -> None:
        record = await self._engine.find_one(db_system_model,db_system_model.key == key)
        if record:
            record.value = value
            await self._engine.save(record)
        else:
            record = db_system_model(
                key=key,
                value=value
            )
            await self._engine.save(record)