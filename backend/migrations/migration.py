import importlib
import os
import sys

import toml

from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
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
            version, _ = self.get_versions_from_toml()
            await mongo_controller.get_instance().link_connection()
            engine = mongo_controller.get_instance().get_engine()
            if engine is None:
                raise Exception("MongoDB is not connected. Migration cannot proceed.")
            stored_version = await self.get_stored_version(engine)
            script_dir = os.path.join(os.path.dirname(__file__), "scripts")
            if not os.path.exists(script_dir):
                log.g().w(f"Scripts directory not found: {script_dir}")
                return
            migration_files = [f for f in os.listdir(script_dir) if f.startswith("migration_") and f.endswith(".py")]
            migration_versions = []
            for file in migration_files:
                version_str = file.replace("migration_", "").replace(".py", "").replace("_", ".")
                migration_versions.append((version_str, file))
            migration_versions.sort(key=lambda x: [int(part) if part.isdigit() else part for part in x[0].split(".")])
            stored_version = stored_version or version
            target_version_parts = [int(part) if part.isdigit() else part for part in version.split(".")]
            if stored_version.__contains__("_"):
                stored_version_parts = [int(part) if part.isdigit() else part for part in stored_version.split("_")]
            else:
                stored_version_parts = [int(part) if part.isdigit() else part for part in stored_version.split(".")]
            sys.path.insert(0, script_dir)
            for version_str, file in migration_versions:
                script_version_parts = [int(part) if part.isdigit() else part for part in version_str.split(".")]
                if target_version_parts >= script_version_parts > stored_version_parts:
                    migration_script_name = file.replace(".py", "")
                    migration_module = importlib.import_module(migration_script_name)
                    if hasattr(migration_module, migration_script_name):
                        migration_class = getattr(migration_module, migration_script_name)
                        if hasattr(migration_class, "migrate"):
                            await migration_class.migrate(version_str.replace(".", "_"))
                        else:
                            log.g().w(f"No 'migrate' method in {migration_script_name}")
                    else:
                        log.g().w(f"No class {migration_script_name} in module")
            if 1 == 1:
                return
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
