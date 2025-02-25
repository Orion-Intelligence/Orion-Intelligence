import importlib
import os
import toml
import sys
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
      version, migration_version = self.get_versions_from_toml()
      await mongo_controller.get_instance().link_connection()
      engine = mongo_controller.get_instance().get_engine()

      if engine is None:
        raise Exception("MongoDB is not connected. Migration cannot proceed.")

      stored_version = await self.get_stored_version(engine)

      if stored_version is None or stored_version < version:
        migration_script_name = f"migration_{migration_version.replace('.', '_')}"
        script_dir = os.path.join(os.path.dirname(__file__), "scripts")

        if not os.path.exists(script_dir):
          return

        sys.path.insert(0, script_dir)

        try:
          migration_module = importlib.import_module(migration_script_name)
        except ModuleNotFoundError:
          return

        if hasattr(migration_module, migration_script_name):
          migration_class = getattr(migration_module, migration_script_name)
          if hasattr(migration_class, "migrate"):
            await migration_class.migrate(migration_version, version)

    except Exception:
      pass

  @staticmethod
  def get_versions_from_toml():
    try:
      data = toml.load("pyproject.toml")
      version = data.get("tool", {}).get("poetry", {}).get("migration_version", "").strip()
      migration_version = data.get("tool", {}).get("poetry", {}).get("version", "").strip()

      if not version:
        version = "Unknown migration version"
      if not migration_version:
        migration_version = "Unknown migration version"

      return version, migration_version
    except Exception:
      return "Unknown migration version", "Unknown migration version"

  @staticmethod
  async def get_stored_version(engine):
    existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
    return existing_version_entry.value if existing_version_entry else None
