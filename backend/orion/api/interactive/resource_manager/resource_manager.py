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
        self.SYSTEM_DIR = self.BASE_DIR / "static" / "resource" / "system"
        self.ROBOTS_FILE = self.BASE_DIR / "static" / "robots.txt"

        self.USER_DIR.mkdir(parents=True, exist_ok=True)
        self.TENANT_DIR.mkdir(parents=True, exist_ok=True)
        self.SYSTEM_DIR.mkdir(parents=True, exist_ok=True)

        if ResourceManager.__instance is not None:
            raise Exception("This class is a singleton!")
        ResourceManager.__instance = self

    @staticmethod
    def get_instance():
        if ResourceManager.__instance is None:
            ResourceManager.__instance = ResourceManager()
        return ResourceManager.__instance

    async def get_tenant_image(self, id):
        default_path = self.TENANT_DIR / "logo_url_default.png"
        image_path = self.TENANT_DIR / f"{id}.png"
        return FileResponse(image_path if image_path.is_file() else default_path)

    async def uploadTenantImage(self, file: UploadFile, current_user):
        contents = await file.read()

        if len(contents) > 100 * 1024:
            raise HTTPException(status_code=400, detail="File too large! Maximum allowed size is 100 KB")

        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=415, detail="Invalid file type")

        file_name = f"{current_user.tenant_uuid}.png"
        file_path = self.TENANT_DIR / file_name
        with open(file_path, "wb") as f:
            f.write(contents)

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            "upload_tenant_image"
        )

        return {"image": str(current_user.tenant_uuid)}

    async def get_user_image(self, user_id: str):
        default_path = self.USER_DIR / "default.png"
        image_path = self.USER_DIR / f"{user_id}.png"
        return FileResponse(image_path if image_path.is_file() else default_path)

    async def get_system_image(self, user_id: str):
        default_path = self.SYSTEM_DIR / "logo_url_default.png"
        image_path = self.SYSTEM_DIR / f"{user_id}"

        return FileResponse(image_path if image_path.is_file() else default_path)

    async def get_favicon(self):
        custom_path = self.SYSTEM_DIR / "logo_url_custom.png"
        default_path = self.SYSTEM_DIR / "logo_url_default.png"

        return FileResponse(custom_path if custom_path.is_file() else default_path)

    async def _save_image(self, file: UploadFile, file_path, check_admin: bool = False, current_user=None):
        contents = await file.read()

        if check_admin and current_user.role not in ["admin"]:
            return

        if len(contents) > 100 * 1024:
            raise HTTPException(status_code=400, detail="File too large! Maximum allowed size is 100 KB")

        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=415, detail="Invalid file type")

        with open(file_path, "wb") as f:
            f.write(contents)

    async def update_system_image(self, file: UploadFile, current_user):
        file_path = self.SYSTEM_DIR / "logo.png"
        await self._save_image(file, file_path, check_admin=True, current_user=current_user)
        return {"image": "logo.png"}

    async def update_user_image(self, file: UploadFile, current_user):
        file_name = f"{current_user.id}.png"
        file_path = self.USER_DIR / file_name
        await self._save_image(file, file_path)
        return {"image": str(current_user.id)}

    async def delete_user_image(self, current_user):
        image_path = self.USER_DIR / f"{current_user.id}.png"

        if image_path.is_file():
            image_path.unlink()

        return {"user_image": "deleted"}

    async def deleteTenantImage(self, current_user):
        file_name = f"{current_user.tenant_uuid}"
        image_path = self.TENANT_DIR / f"{file_name}.png"

        if image_path.is_file():
            image_path.unlink()

        return {"tenant_image": "deleted"}

    async def delete_system_image(self, current_user, key: str):
        image_path = self.SYSTEM_DIR / f"{key}_custom.png"
        if current_user.role not in ["admin"]:
            return {"system_image deletion": "failed"}

        if image_path.is_file():
            image_path.unlink()

        return {"system_image": "deleted"}

    async def get_robots_txt(self):
        if not self.ROBOTS_FILE.is_file():
            raise HTTPException(status_code=404, detail="robots.txt not found")

        return FileResponse(
            self.ROBOTS_FILE,
            media_type="text/plain"
        )
