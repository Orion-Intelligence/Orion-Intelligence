from pathlib import Path
from fastapi import UploadFile, HTTPException
from fastapi.responses import FileResponse

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager


class ResourceManager:
  __instance = None

  def __init__(self):
    self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
    self.USER_DIR = self.BASE_DIR / "static" / "resource" / "profile"
    self.TENANT_DIR = self.BASE_DIR / "static" / "resource" / "tenant"
    self.USER_DIR.mkdir(parents=True, exist_ok=True)
    self.TENANT_DIR.mkdir(parents=True, exist_ok=True)

    if ResourceManager.__instance is not None:
      raise Exception("This class is a singleton!")
    ResourceManager.__instance = self

  @staticmethod
  def get_instance():
    if ResourceManager.__instance is None:
      ResourceManager.__instance = ResourceManager()
    return ResourceManager.__instance

  async def get_tenant_image(self, id):
    default_path = self.TENANT_DIR / "default.png"
    image_path = self.TENANT_DIR / f"{id}.png"
    return FileResponse(image_path if image_path.is_file() else default_path)

  async def uploadTenantImage(self, file: UploadFile, current_user):
    contents = await file.read()

    if len(contents) > 50 * 1024:
      raise HTTPException(status_code=413, detail="File too large")

    if not file.content_type.startswith("image/"):
      raise HTTPException(status_code=415, detail="Invalid file type")

    file_path = self.TENANT_DIR / f"{current_user.tenant_uuid}.png"
    with open(file_path, "wb") as f:
      f.write(contents)

    await AuditLogManager.get_instance().register(current_user.tenant_uuid, "upload_tenant_image")
    return {"tenant_image": "upload complete"}


  async def get_user_image(self, user_id: str):
    default_path = self.USER_DIR / "default.png"
    image_path = self.USER_DIR / f"{user_id}.png"
    return FileResponse(image_path if image_path.is_file() else default_path)

  async def update_user_image(self, file: UploadFile, current_user):
    contents = await file.read()

    if len(contents) > 50 * 1024:
      raise HTTPException(status_code=413, detail="File too large")

    if not file.content_type.startswith("image/"):
      raise HTTPException(status_code=415, detail="Invalid file type")

    file_path = self.USER_DIR / f"{current_user.id}.png"
    with open(file_path, "wb") as f:
      f.write(contents)

    return {"user_image": "upload complete"}

  async def delete_user_image(self, current_user):
    image_path = self.USER_DIR / f"{current_user.id}.png"

    if image_path.is_file():
      image_path.unlink()

    return {"user_image": "deleted"}
