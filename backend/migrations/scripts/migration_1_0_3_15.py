import json

from cryptography.fernet import Fernet
from pymongo.errors import OperationFailure

from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model, normalize_tenant_slug


class migration_1_0_3_15:
    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()
        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        default_tenant = await engine.find_one(db_tenant_model, db_tenant_model.is_default == True)
        await migration_1_0_3_15.backfill_tenant_slugs(engine)
        await migration_1_0_3_15.migrate_system_settings(engine, default_tenant, version)
        await migration_1_0_3_15.ensure_indexes(engine)
        await migration_1_0_3_15.update_version(engine, version)

    @staticmethod
    def _loads(value):
        try:
            parsed = json.loads(value or "{}")
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}

    @staticmethod
    async def migrate_system_settings(engine, default_tenant, version):
        settings_collection = engine.get_collection(db_system_model)
        tenant_collection = engine.get_collection(db_tenant_model)
        default_tenant_id = str(default_tenant.id) if default_tenant else ""
        settings_by_tenant = {}

        async for doc in settings_collection.find({}):
            tenant_id = str(doc.get("tenant_id") or default_tenant_id)
            key = str(doc.get("key") or "")
            if not tenant_id or not key:
                continue
            if key == AllowedKeys.SYSTEM_SETTINGS.value:
                settings_by_tenant.setdefault(tenant_id, {}).update(
                    migration_1_0_3_15._loads(doc.get("value"))
                )
            else:
                settings_by_tenant.setdefault(tenant_id, {})[key] = doc.get("value", "")

        base_settings = dict(settings_by_tenant.get(default_tenant_id, {}))

        tenants = []
        async for tenant_doc in tenant_collection.find({}):
            tenants.append(tenant_doc)

        if not tenants and default_tenant_id:
            tenants = [{"_id": default_tenant.id, "is_default": True}]

        await migration_1_0_3_15._drop_old_system_indexes(settings_collection)
        await settings_collection.delete_many({})

        if not tenants:
            base_settings[AllowedKeys.VERSION.value] = str(version)
            await settings_collection.insert_one({
                "tenant_id": default_tenant_id,
                "key": AllowedKeys.SYSTEM_SETTINGS.value,
                "value": json.dumps(base_settings),
            })
            return

        for tenant_doc in tenants:
            tenant_id = str(tenant_doc.get("_id"))
            settings = dict(base_settings)
            settings.update(settings_by_tenant.get(tenant_id, {}))

            meta_info = migration_1_0_3_15._loads(settings.get(AllowedKeys.META_INFO.value))
            key_record = await engine.find_one(db_keys, db_keys.auth_id == tenant_id)
            enc = Fernet(KeyManager.get_instance()._unwrap(key_record.wrapped_key))
            smtp_fields = {
                "accounts_mail_password": "ACCOUNTS_MAIL_PASSWORD",
                "accounts_mail": "ACCOUNTS_MAIL",
                "accounts_smtp_server": "ACCOUNTS_SMTP_SERVER",
                "accounts_smtp_port": "ACCOUNTS_SMTP_PORT",
            }
            for tenant_field, meta_key in smtp_fields.items():
                value = tenant_doc.get(tenant_field)
                if value:
                    meta_info[meta_key] =  enc.decrypt(value.encode()).decode()

            settings[AllowedKeys.META_INFO.value] = json.dumps(meta_info)
            if str(tenant_id) == default_tenant_id:
                settings[AllowedKeys.VERSION.value] = str(version)
            else:
                for key in (
                    AllowedKeys.VERSION.value,
                    AllowedKeys.LANGUAGE_ALLOWED.value,
                    AllowedKeys.ADMIN_ROOT_ALLOWED.value,
                    AllowedKeys.S_ONION.value,
                ):
                    settings.pop(key, None)
                settings[AllowedKeys.AI_ENDPOINT_ENABLED.value] = settings_by_tenant.get(tenant_id, {}).get(
                    AllowedKeys.AI_ENDPOINT_ENABLED.value,
                    "0",
                )

            await settings_collection.insert_one({
                "tenant_id": tenant_id,
                "key": AllowedKeys.SYSTEM_SETTINGS.value,
                "value": json.dumps(settings),
            })
            await tenant_collection.update_one(
                {"_id": tenant_doc.get("_id")},
                {"$unset": {field: "" for field in smtp_fields}},
            )

    @staticmethod
    async def _drop_old_system_indexes(collection):
        try:
            async for index in collection.list_indexes():
                key_spec = list((index.get("key") or {}).items())
                if index.get("unique") and key_spec in ([("key", 1)], [("tenant_id", 1), ("key", 1)], [("tenant_id", 1)]):
                    await collection.drop_index(index["name"])
        except OperationFailure:
            pass

    @staticmethod
    async def _has_index(collection, key_spec, *, unique: bool, sparse: bool = False) -> bool:
        try:
            async for index in collection.list_indexes():
                if (
                    list((index.get("key") or {}).items()) == key_spec
                    and bool(index.get("unique")) is unique
                    and bool(index.get("sparse")) is sparse
                ):
                    return True
        except OperationFailure:
            return False
        return False

    @staticmethod
    async def ensure_indexes(engine):
        settings_collection = engine.get_collection(db_system_model)
        await migration_1_0_3_15._drop_old_system_indexes(settings_collection)
        if not await migration_1_0_3_15._has_index(settings_collection, [("tenant_id", 1)], unique=True):
            await settings_collection.create_index(
                [("tenant_id", 1)],
                unique=True,
                name="unique_tenant_system_settings",
            )

        tenant_collection = engine.get_collection(db_tenant_model)
        if not await migration_1_0_3_15._has_index(
            tenant_collection,
            [("slug", 1)],
            unique=True,
            sparse=True,
        ):
            await tenant_collection.create_index(
                [("slug", 1)],
                unique=True,
                sparse=True,
                name="unique_tenant_slug",
            )

    @staticmethod
    async def backfill_tenant_slugs(engine):
        collection = engine.get_collection(db_tenant_model)

        tenants = await engine.find(db_tenant_model)

        for tenant in tenants:
            if tenant.is_default:
                slug = "default"
            else:
                email = str(tenant.email or "")
                key_record = await engine.find_one(db_keys, db_keys.auth_id == str(tenant.id))
                if email and key_record:
                    try:
                        email = Fernet(KeyManager.get_instance()._unwrap(key_record.wrapped_key)).decrypt(email.encode()).decode()
                    except Exception:
                        pass
                domain = email.split("@", 1)[1] if "@" in email else ""
                slug = normalize_tenant_slug(domain.split(".", 1)[0]) or f"tenant-{tenant.id}"

            await collection.update_one(
                {"_id": tenant.id},
                {"$set": {"slug": slug}},
            )

    @staticmethod
    async def update_version(engine, version):
        existing = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing.value = str(version)
            await engine.save(existing)
