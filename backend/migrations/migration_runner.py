import importlib
import os
import sys

from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import db_system_model, AllowedKeys


async def run_migration(version):
    await mongo_controller.get_instance().link_connection()
    engine = mongo_controller.get_instance().get_engine()
    if engine is None:
        raise Exception("MongoDB is not connected. Migration cannot proceed.")

    stored_version = await get_stored_version(engine)

    script_dir = os.path.join(os.path.dirname(__file__), "scripts")
    if not os.path.exists(script_dir):
        log.g().w(f"Scripts directory not found: {script_dir}")
        return engine

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

    return engine


async def get_stored_version(engine):
    existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
    return existing_version_entry.value if existing_version_entry else None
