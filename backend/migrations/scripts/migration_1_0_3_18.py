from pymongo.errors import OperationFailure

from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model

TAKEDOWN_COLLECTION = "takedown_requests"
LEGACY_TAKEDOWN_INDEXES = ["target_domain_1"]


class migration_1_0_3_18:

    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()

        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        database = engine.database
        await migration_1_0_3_18.drop_global_domain_index(database)
        await migration_1_0_3_18.verify(database)
        await migration_1_0_3_18.update_version(engine, version)

    @staticmethod
    async def drop_global_domain_index(database):
        if TAKEDOWN_COLLECTION not in await database.list_collection_names():
            return
        for index_name in LEGACY_TAKEDOWN_INDEXES:
            try:
                await database[TAKEDOWN_COLLECTION].drop_index(index_name)
                log.g().i(f"MIGRATION 1_0_3_18: dropped global index {TAKEDOWN_COLLECTION}.{index_name}")
            except OperationFailure:
                continue

    @staticmethod
    async def verify(database):
        if TAKEDOWN_COLLECTION not in await database.list_collection_names():
            log.g().i("MIGRATION 1_0_3_18 VERIFY: takedown_requests does not exist yet, nothing to check")
            return
        cursor = await database[TAKEDOWN_COLLECTION].index_information()
        for index_name, definition in cursor.items():
            keys = [field for field, _ in definition.get("key", [])]
            if definition.get("unique") and keys == ["target_domain"]:
                raise Exception(
                    f"MIGRATION 1_0_3_18 verification failed: {index_name} still enforces a global unique target_domain"
                )
        duplicates = await database[TAKEDOWN_COLLECTION].aggregate([
            {"$group": {"_id": {"tenant_id": "$tenant_id", "target_domain": "$target_domain"}, "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}}},
            {"$limit": 1},
        ]).to_list(length=1)
        if duplicates:
            raise Exception(
                "MIGRATION 1_0_3_18 verification failed: duplicate tenant_id/target_domain pairs exist, "
                "the per tenant unique index cannot be created"
            )
        log.g().i("MIGRATION 1_0_3_18 VERIFY: takedown uniqueness is scoped per tenant")

    @staticmethod
    async def update_version(engine, version):
        existing = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing.value = str(version)
            await engine.save(existing)
