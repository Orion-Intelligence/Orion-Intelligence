from pymongo.errors import OperationFailure

from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model

RENAMES = {
    "db_user_account": {"tenant_uuid": "tenant_id"},
    "cases": {"tenant_uuid": "tenant_id"},
    "chat_shares": {"tenant_uuid": "tenant_id"},
    "db_keys": {"auth_id": "tenant_id"},
    "takedown_requests": {"tenant_uuid": "operator_tenant_id", "requester_tenant_uuid": "tenant_id"},
}

STALE_INDEXES = {
    "db_user_account": ["unique_maintainer_per_company"],
}


class migration_1_0_3_17:

    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()

        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        database = engine.database
        await migration_1_0_3_17.drop_stale_indexes(database)
        await migration_1_0_3_17.rename_tenant_fields(database)
        await migration_1_0_3_17.verify(database)
        await migration_1_0_3_17.update_version(engine, version)

    @staticmethod
    async def drop_stale_indexes(database):
        existing = set(await database.list_collection_names())
        for collection_name, index_names in STALE_INDEXES.items():
            if collection_name not in existing:
                continue
            for index_name in index_names:
                try:
                    await database[collection_name].drop_index(index_name)
                    log.g().i(f"MIGRATION 1_0_3_17: dropped stale index {collection_name}.{index_name}")
                except OperationFailure:
                    continue

    @staticmethod
    async def rename_tenant_fields(database):
        existing = set(await database.list_collection_names())
        for collection_name, mapping in RENAMES.items():
            if collection_name not in existing:
                continue
            for old_field, new_field in mapping.items():
                conflicting = await database[collection_name].count_documents(
                    {old_field: {"$exists": True}, new_field: {"$exists": True}}
                )
                if conflicting:
                    raise Exception(
                        f"MIGRATION 1_0_3_17 aborted: {collection_name} has {conflicting} documents "
                        f"carrying both {old_field} and {new_field}"
                    )
            result = await database[collection_name].update_many(
                {"$or": [{field: {"$exists": True}} for field in mapping]},
                {"$rename": mapping},
            )
            log.g().i(
                f"MIGRATION 1_0_3_17: {collection_name} renamed {mapping} on {result.modified_count} documents"
            )

    @staticmethod
    async def verify(database):
        existing = set(await database.list_collection_names())
        failures = []
        for collection_name, mapping in RENAMES.items():
            if collection_name not in existing:
                continue
            for old_field, new_field in mapping.items():
                remaining = await database[collection_name].count_documents({old_field: {"$exists": True}})
                if remaining:
                    failures.append(f"{collection_name}.{old_field} still present on {remaining} documents")
            total = await database[collection_name].count_documents({})
            for new_field in set(mapping.values()):
                migrated = await database[collection_name].count_documents({new_field: {"$exists": True}})
                log.g().i(
                    f"MIGRATION 1_0_3_17 VERIFY: {collection_name}.{new_field} present on {migrated}/{total} documents"
                )
        if failures:
            raise Exception("MIGRATION 1_0_3_17 verification failed: " + "; ".join(failures))
        log.g().i("MIGRATION 1_0_3_17 VERIFY: no legacy tenant field names remain")

    @staticmethod
    async def update_version(engine, version):
        existing = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing.value = str(version)
            await engine.save(existing)
