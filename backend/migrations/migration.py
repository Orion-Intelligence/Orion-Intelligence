import toml

from migrations.migration_runner import run_migration
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.shared_model.db_system_settings import db_system_model, AllowedKeys


class migration_manager:
    __instance = None

    @staticmethod
    def get_instance():
        if migration_manager.__instance is None:
            migration_manager.__instance = migration_manager()
        return migration_manager.__instance

    def __init__(self):
        if migration_manager.__instance is not None:
            raise Exception("This class is a singleton! Use get_instance() instead.")
        migration_manager.__instance = self

    async def init_migration(self):
        try:
            version, app_version = self.get_versions_from_toml()
            engine = await run_migration(version, app_version)
            existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
            if existing_version_entry:
                existing_version_entry.value = version
                await engine.save(existing_version_entry)
            else:
                new_entry = db_system_model(key=AllowedKeys.VERSION, value=version)
                await engine.save(new_entry)
        except Exception as ex:
            log.g().e(f"Migration failed: {str(ex)}")
            raise Exception(f"Migration failed: {str(ex)}")

    @staticmethod
    def get_versions_from_toml():
        data = toml.load("pyproject.toml")
        version = data.get("tool", {}).get("poetry", {}).get("migration_version", "").strip()
        migration_version = data.get("tool", {}).get("poetry", {}).get("version", "").strip()
        if not version:
            version = "Unknown migration version"
        if not migration_version:
            migration_version = "Unknown migration version"
        return version, migration_version

    @staticmethod
    async def get_stored_version(engine):
        existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        return existing_version_entry.value if existing_version_entry else None
