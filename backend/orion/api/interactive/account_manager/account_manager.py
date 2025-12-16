import re
from typing import List

from orion.api.interactive.account_manager.models.user_meta_model import user_meta_model
from orion.api.interactive.account_manager.models.user_param_model import user_param_model
from pathlib import Path
from orion.api.interactive.account_manager.models.user_model import user_model
from fastapi import HTTPException, UploadFile
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.tenant_manager.models.tenant_param_model import tenant_param_model
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, UserStatus
from orion.services.encryption_manager.key_manager import KeyManager
from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from fastapi.responses import Response


class AccountManager:
    __instance = None

    def __init__(self):
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
        self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "profile"
        self._engine = mongo_controller.get_instance().get_engine()

        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
        self.TENANT_DIR = self.BASE_DIR / "static" / "resource" / "profile"
        self.TENANT_DIR.mkdir(parents=True, exist_ok=True)
        if AccountManager.__instance is not None:
            raise Exception("This class is a singleton!")
        AccountManager.__instance = self

    @staticmethod
    def get_instance():
        if AccountManager.__instance is None:
            if AccountManager.__instance is None:
                AccountManager.__instance = AccountManager()
        return AccountManager.__instance

    async def get_all_users(self, current_user) -> List[user_param_model]:
        if current_user.role in ["admin"]:
            collection = self._engine.get_collection(db_user_account)
            await collection.update_many(
                {"status": {"$nin": ["active", "disable"]}},
                {"$set": {"status": "disable"}},
            )
            users = await self._engine.find(
                db_user_account,
                (db_user_account.role != "profile") | (
                        (db_user_account.role == "profile") &
                        (db_user_account.licenses == ["maintainer"])
                )
            )
            return [user_param_model(**u.dict()) for u in users]
        else:
            tenant_uuid = current_user.tenant_uuid

        collection = self._engine.get_collection(db_user_account)
        await collection.update_many(
            {"tenant_uuid": tenant_uuid, "status": {"$nin": ["active", "disable"]}},
            {"$set": {"status": "disable"}},
        )
        users = await self._engine.find(
            db_user_account,
            db_user_account.tenant_uuid == tenant_uuid
        )
        return [user_param_model(**u.dict()) for u in users]

    async def create_user(self, data: user_model):
        try:
            engine = mongo_controller.get_instance().get_engine()

            username = (data.username or "").strip()
            email = (data.email or "").strip().lower()
            password = (data.password or "").strip()

            username_pattern = r"^[A-Za-z0-9_-]{4,20}$"
            if not re.match(username_pattern, username):
                raise HTTPException(status_code=400, detail="Username already exist")

            email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
            if not re.match(email_pattern, email):
                raise HTTPException(status_code=400, detail="Invalid email format")

            existing_user = await engine.find_one(
                db_user_account,
                (db_user_account.username == username)
            )
            existing_mail = await engine.find_one(
                db_user_account,
                (db_user_account.email == email)
            )
            if existing_user or existing_mail:
                raise HTTPException(status_code=400, detail="Username or email already exists")

            if password.startswith("$2b$") and len(password) >= 60:
                hashed_password = password
            else:
                if len(password) > 256:
                    raise HTTPException(status_code=400, detail="Password too long")

                try:
                    hashed_password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(password)
                except Exception:
                    raise HTTPException(status_code=400, detail="Invalid password")

            user = db_user_account(
                username=username,
                email=email,
                password=hashed_password,
                role=data.role,
                status=data.status,
                subscription=data.subscription,
                licenses=data.licenses,
            )

            await engine.save(user)
            await KeyManager.get_instance().create_user_dek(user.id)

            return {
                "message": "User created successfully",
                "username": username,
                "email": email
            }

        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e) or "Error creating user")

    async def delete_user(self, user, current_user):
        user = await self._engine.find_one(db_user_account, db_user_account.username == user.username)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if user.role in ["admin", "maintainer"]:
            raise HTTPException(status_code=401, detail="This user type cannot be deleted")

        if current_user.role == "admin":
            if user.role not in ["demo", "analyst"] or user.licenses == ["maintainer"]:
                raise HTTPException(status_code=401, detail="Admin can only delete demo or analyst users")
        elif current_user.licenses == ["maintainer"]:
            if user.tenant_uuid != current_user.tenant_uuid or user.licenses == ["maintainer"]:
                raise HTTPException(status_code=401, detail="Maintainer can only delete non-maintainer users from the same company")
        else:
            raise HTTPException(status_code=401, detail="You are not allowed to delete users")

        await self._engine.remove(db_keys, db_keys.auth_id == str(user.id))

        image_path = self.IMAGE_DIR / f"{user.id}.enc"
        if image_path.exists():
            image_path.unlink()

        await self._engine.delete(user)
        await AuditLogManager.get_instance().register(str(user.id), "delete_user")

        return {"message": "User deleted successfully"}

    async def delete_user_icon(self, current_user):
        image_path = self.IMAGE_DIR / f"{current_user.id}.png"
        if image_path.exists():
            image_path.unlink()

        await AuditLogManager.get_instance().register("system", f"update_user_failed:{current_user.id}")

    async def update_user(self, request: tenant_param_model, current_user):
        user = await self._engine.find_one(db_user_account, db_user_account.username == request.username)
        if not user:
            await AuditLogManager.get_instance().register("system", f"update_user_failed:{request.username}")
            raise HTTPException(status_code=401, detail="User not found")

        if current_user.role in ["admin"]:
            if user.role not in ["demo", "analyst"]:
                await AuditLogManager.get_instance().register(str(current_user.id),
                                                              f"update_user_denied:{request.username}")
                raise HTTPException(status_code=401, detail="Admin can only update demo and analyst users")
        elif current_user.licenses == ["maintainer"] and user.tenant_uuid == current_user.tenant_uuid:
            pass
        else:
            await AuditLogManager.get_instance().register(str(current_user.id),
                                                          f"update_user_denied:{request.username}")
            raise HTTPException(status_code=401, detail="You are not allowed to update this user")

        if user.role in ["admin"]:
            raise HTTPException(status_code=401, detail="You are not allowed to update this user")

        if user.role in ["admin", "crawl"]:
            await AuditLogManager.get_instance().register(str(user.id), f"update_user_denied:{request.username}")
            raise HTTPException(status_code=401, detail="This user type cannot be updated")

        if request.status.value == "disable":
            user.status = UserStatus.DISABLE.value
        else:
            user.status = UserStatus.ACTIVE.value

        user.licenses = request.licenses
        await self._engine.save(user)
        await AuditLogManager.get_instance().register(str(user.id), "update_user")
        return {"message": "User updated successfully", "id": str(user.id)}

    async def update_current_user(self, request: user_meta_model, current_user):
        user = await self._engine.find_one(
            db_user_account,
            db_user_account.username == current_user.username
        )
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if request.username is not None:
            user.username = request.username

        if request.email is not None:
            user.email = request.email

        if request.preferences is not None:
            user.preferences = request.preferences

        if request.twofa_enabled is not None:
            user.twofa_enabled = request.twofa_enabled

        await self._engine.save(user)
        await AuditLogManager.get_instance().register(str(user.id), "update_user_self")

        return {"message": "User updated successfully"}

    async def getProfileImage(self, userId: str):
        file_path = Path(self.TENANT_DIR) / f"{userId}.png"
        default_path = Path(self.TENANT_DIR) / "default-profile.png"

        is_default = not file_path.is_file()
        target_path = default_path if is_default else file_path

        with open(target_path, "rb") as f:
            data = f.read()

        return Response(
            content=data,
            media_type="image/png",
            headers={
                "X-Default-Image": "true" if is_default else "false",
                "Access-Control-Expose-Headers": "X-Default-Image"
            }
        )

    async def uploadProfileImage(self, file: UploadFile, current_user):
        contents = await file.read()
        MAX_FILE_SIZE = 50 * 1024

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large! Maximum allowed size is 50 KB.")

        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=415, detail="Invalid file type. Only image files are allowed.")

        file_path = self.TENANT_DIR / f"{str(current_user.id)}.png"
        with open(file_path, "wb") as f:
            f.write(contents)

        await AuditLogManager.get_instance().register(str(current_user.id), "upload_image")
        return {"Profile image": "upload complete"}
