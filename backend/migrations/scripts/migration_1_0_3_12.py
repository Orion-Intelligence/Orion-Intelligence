from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_case_model import db_case_model
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model


class migration_1_0_3_12:

    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()

        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        await migration_1_0_3_12.add_missing_case_status_reasons(engine)
        await migration_1_0_3_12.update_version(engine, version)

    @staticmethod
    async def add_missing_case_status_reasons(engine):
        case_collection = engine.get_collection(db_case_model)
        await case_collection.update_many(
            {
                "$or": [
                    {"statusReasons": {"$exists": False}},
                    {"statusReasons": None},
                ]
            },
            {"$set": {"statusReasons": []}},
        )

    @staticmethod
    async def update_version(engine, version):
        existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing_version_entry is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing_version_entry.value = str(version)
            await engine.save(existing_version_entry)
