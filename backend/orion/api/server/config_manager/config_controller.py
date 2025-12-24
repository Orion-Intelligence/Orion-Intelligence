import asyncio
from pathlib import Path

from fastapi import UploadFile, HTTPException
from fastapi.responses import Response

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.server.config_manager.model.config_data import config_data
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model


class config_controller:
  __instance = None

  @staticmethod
  def getInstance():
    if config_controller.__instance is None:
      config_controller()
    return config_controller.__instance

  def __init__(self):
    self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent

    self.SYSTEM_DIR = self.BASE_DIR / "static" / "resource" / "system"
    self.SYSTEM_DIR.mkdir(parents=True, exist_ok=True)

    self.BASE_URL = 'http://localhost:4200'
    if config_controller.__instance is not None:
      return

    config_controller.__instance = self
    self._config = {}
    self._engine = mongo_controller.get_instance().get_engine()
    asyncio.create_task(self.load_config())

  async def load_config(self):
    try:
      records = await self._engine.find(db_system_model)
      self._config = {record.key.value: record.value for record in records}
    except Exception:
      pass

  def get(self, key: str, default=None):
    return self._config.get(key, default)

  async def refresh_config(self):
    await self.load_config()

  async def get_system_info(self) -> config_data:
    try:
      self.SYSTEM_DIR = self.BASE_DIR / "static" / "resource" / "system"
      records = await self._engine.find(db_system_model)
      fresh_config = {record.key.value: record.value for record in records}
      logo_name = "logo.png"
      logo_file = self.SYSTEM_DIR / logo_name
      fresh_config["logo_url"] = (f"/api/s/static/system/{logo_name}" if logo_name and logo_file.is_file() else "")
      return config_data(settings=fresh_config)
    except Exception as ex:
      log.g().e(f"Error fetching config: {ex}")
      return config_data(settings={})

  async def update_public_config(self, data: config_data):
    for key_str, value in data.settings.items():
      if key_str == "language":
        key = AllowedKeys.LANGUAGE_ALLOWED
      elif key_str == "logo_url":
        key = AllowedKeys.LOGO_URL
      elif key_str == "app_name":
        key = AllowedKeys.APP_NAME
      else:
        continue

      record = await self._engine.find_one(
        db_system_model, db_system_model.key == key)

      if key == AllowedKeys.LOGO_URL and value == "":
        file_path = self.SYSTEM_DIR / "logo.png"
        if file_path.exists():
          file_path.unlink()

      if record:
        record.value = value
        await self._engine.save(record)
      else:
        await self._engine.save(
          db_system_model(key=key, value=value))

    return await self.get_system_info()

  async def getSystemResource(self, name: str):
    file_path = self.SYSTEM_DIR / f"{name}.png"

    if not file_path.exists():
      raise HTTPException(status_code=404, detail="Resource not found")

    with open(file_path, "rb") as f:
      data = f.read()

    return Response(content=data, media_type="image/png")

  async def uploadSystemResource(self, file: UploadFile, current_user):
    contents = await file.read()
    MAX_FILE_SIZE = 50 * 1024

    if len(contents) > MAX_FILE_SIZE:
      raise HTTPException(status_code=413, detail="File too large! Maximum allowed size is 50 KB.")

    if not file.content_type.startswith("image/"):
      raise HTTPException(status_code=415, detail="Invalid file type. Only image files are allowed.")

    file_path = self.SYSTEM_DIR / "logo.png"
    with open(file_path, "wb") as f:
      f.write(contents)

    record = await self._engine.find_one(db_system_model, db_system_model.key == AllowedKeys.LOGO_URL)
    if record:
      record.value = "logo"
      await self._engine.save(record)
    else:
      new_record = db_system_model(key=AllowedKeys.LOGO_URL, value="logo")
      await self._engine.save(new_record)

    await AuditLogManager.get_instance().register(str(current_user.tenant_uuid), str(current_user.id), "upload_image")
    return {"Profile image": "upload complete"}
