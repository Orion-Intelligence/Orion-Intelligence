from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import db_system_model, AllowedKeys
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.encryption_manager.key_manager import KeyManager


class migration_1_0_3_0:

    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()

        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        await migration_1_0_3_0.update_version(engine, version)

    @staticmethod
    async def update_version(engine, version):
        existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)

        if existing_version_entry is None:
            new_entry = db_system_model(key=AllowedKeys.VERSION, value=str(version))
            await engine.save(new_entry)
            new_entry = db_system_model(key=AllowedKeys.API_ALLOWED, value="1")
            await engine.save(new_entry)
        else:
            existing_version_entry.value = str(version)
            await engine.save(existing_version_entry)

