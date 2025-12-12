import re
import threading
from pathlib import Path

from typing import List

from orion.api.interactive.tenant_manager.models.tenant_team_model import tenant_team_model
from bson import ObjectId
from fastapi import HTTPException
from starlette import status
from cryptography.fernet import Fernet
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.tenant_manager.models.tenant_param_model import tenant_param_model
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.mongo_manager.shared_model.db_tenant_model import IocCategory, db_tenant_model, TenantRequest, TenantStatus
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, db_user_account
from orion.api.interactive.tenant_manager.models.user_param_model import user_param_model
from orion.services.encryption_manager.tenant_key_manager import TenantKeyManager
from orion.constants.constant import CONSTANTS


class TenantManager:
    __instance = None
    __lock = threading.Lock()

    @staticmethod
    def get_instance():
        if TenantManager.__instance is None:
            with TenantManager.__lock:
                if TenantManager.__instance is None:
                    TenantManager.__instance = TenantManager()
        return TenantManager.__instance

    def __init__(self):
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
        self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "profile"
        self._engine = mongo_controller.get_instance().get_engine()
        if TenantManager.__instance is not None:
            raise Exception("This class is a singleton!")
        TenantManager.__instance = self

    @staticmethod
    async def _dek(tenant_id: str) -> bytes:
        return await TenantKeyManager.get_instance().get_or_create_dek(tenant_id)

    async def create_tenant(self, data: db_tenant_model):
        await self._engine.save(data)
        try:
            dek = await self._dek(str(data.id))
            enc = Fernet(dek)
            data.companyName = enc.encrypt((data.companyName or "").encode()).decode()
            data.phone = enc.encrypt((data.phone or "").encode()).decode()
            data.country = enc.encrypt((data.country or "").encode()).decode()
            data.city = enc.encrypt((data.city or "").encode()).decode()
            data.postal_code = enc.encrypt((data.postal_code or "").encode()).decode()
            data.licenses = [enc.encrypt(l.encode()).decode() for l in (data.licenses or [])]

            data.iocs = [
                IocCategory(
                    ioc_id=enc.encrypt(ioc.ioc_id.encode()).decode(),
                    name=enc.encrypt(ioc.name.encode()).decode(),
                    values=[enc.encrypt(v.encode()).decode() for v in (ioc.values or [])]
                )
                for ioc in (data.iocs or [])
            ]

            data.status = TenantStatus.ONBOARDING
            await self._engine.save(data)
        except Exception:
            await self._engine.remove(db_user_account, db_user_account.company_uuid == str(data.id))
            await self._engine.remove(db_keys, db_keys.id == str(data.id))
            await self._engine.delete(data)
            raise

    async def get_tenant(self, current_user) -> TenantRequest:
        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(current_user.company_uuid))
        if not tenant:
            await AuditLogManager.get_instance().register(str(current_user.id), "get_tenant_failed")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found in get tenant")

        dek = await TenantKeyManager.get_instance().get_profile_dek(str(tenant.id))
        enc = Fernet(dek)

        ioc_models = [
            IocCategory(
                ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode(),
                name=enc.decrypt(ioc.name.encode()).decode(),
                values=[enc.decrypt(v.encode()).decode() for v in (ioc.values or [])]
            )
            for ioc in (tenant.iocs or [])
        ]

        tenant_request = TenantRequest(
            id=str(current_user.company_uuid),
            companyName=enc.decrypt(tenant.companyName.encode()).decode(),
            iocs=ioc_models
        )

        return tenant_request

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
            company_uuid = current_user.company_uuid

        collection = self._engine.get_collection(db_user_account)
        await collection.update_many(
            {"company_uuid": company_uuid, "status": {"$nin": ["active", "disable"]}},
            {"$set": {"status": "disable"}},
        )
        users = await self._engine.find(
            db_user_account,
            db_user_account.company_uuid == company_uuid
        )
        return [user_param_model(**u.dict()) for u in users]

    async def update_tenant(self, data: TenantRequest, current_user):

        if current_user.role in ["admin"]:
            tenant_id = data.id
        elif current_user.licenses == ["maintainer"] and current_user.company_uuid == data.id:
            tenant_id = data.id
        else:
            tenant_id = current_user.company_uuid

        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(tenant_id))
        if not tenant:
            await AuditLogManager.get_instance().register(str(current_user.id), "update_tenant_failed")
            raise HTTPException(status_code=401, detail="Onboarding record not found for this user.")

        dek = await TenantKeyManager.get_instance().get_profile_dek(str(tenant.id))
        enc = Fernet(dek)

        tenant.companyName = enc.encrypt((data.companyName or "").encode()).decode()
        tenant.phone = enc.encrypt((data.phone or "").encode()).decode()
        tenant.country = enc.encrypt((data.country or "").encode()).decode()
        tenant.city = enc.encrypt((data.city or "").encode()).decode()
        tenant.postal_code = enc.encrypt((data.postal_code or "").encode()).decode()

        if data.verified is not None:
            tenant.verified = data.verified

        tenant.user_quota = data.user_quota

        if data.status is not None:
            tenant.status = data.status

        tenant.licenses = [enc.encrypt(l.encode()).decode() for l in (data.licenses or [])]

        tenant.iocs = [
            IocCategory(
                ioc_id=enc.encrypt(ioc.ioc_id.encode()).decode(),
                name=enc.encrypt(ioc.name.encode()).decode(),
                values=[enc.encrypt(v.encode()).decode() for v in (ioc.values or [])]
            )
            for ioc in (data.iocs or [])
        ]

        await self._engine.save(tenant)
        await AuditLogManager.get_instance().register(str(current_user.id), "update_tenant")

        return {"message": "Tenant updated", "user": current_user.username, "company": tenant.companyName}

    async def update_user(self, request: tenant_param_model, current_user):
        user = await self._engine.find_one(db_user_account, db_user_account.username == request.username)
        if not user:
            await AuditLogManager.get_instance().register("system", f"update_user_failed:{request.username}")
            raise HTTPException(status_code=401, detail="User not found")

        if current_user.role in ["admin"]:
            if user.role not in ["demo", "analyst"]:
                await AuditLogManager.get_instance().register(str(current_user.id), f"update_user_denied:{request.username}")
                raise HTTPException(status_code=401, detail="Admin can only update demo and analyst users")
        elif current_user.licenses == ["maintainer"] and user.company_uuid == current_user.company_uuid:
            pass
        else:
            await AuditLogManager.get_instance().register(str(current_user.id), f"update_user_denied:{request.username}")
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

        return {"message": "User updated successfully"}

    async def delete_profile_icon(self, current_user):
        image_path = self.IMAGE_DIR / f"{current_user.id}.png"
        print(":::::::::::::::::::::::::::::::::::1",flush=True)
        print(image_path,flush=True)
        print(":::::::::::::::::::::::::::::::::::2",flush=True)
        if image_path.exists():
            print(":::::::::::::::::::::::::::::::::::3", flush=True)
            image_path.unlink()

        await AuditLogManager.get_instance().register("system", f"update_user_failed:{current_user.id}")

    async def delete_user(self, tenant, current_user):
        user = await self._engine.find_one(db_user_account, db_user_account.username == tenant.username)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if user.role in ["admin", "maintainer"]:
            raise HTTPException(status_code=401, detail="This user type cannot be deleted")

        if current_user.role == "admin":
            if user.role not in ["demo", "analyst"] or user.licenses == ["maintainer"]:
                raise HTTPException(status_code=401, detail="Admin can only delete demo or analyst users")
        elif current_user.licenses == ["maintainer"]:
            if user.company_uuid != current_user.company_uuid or user.licenses == ["maintainer"]:
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

    async def get_all_tenant(self) -> List[db_tenant_model]:
        tenants = await self._engine.find(db_tenant_model)
        result = []
        for tenant in tenants:
            dek = await TenantKeyManager.get_instance().get_profile_dek(str(tenant.id))
            enc = Fernet(dek)

            tenant.companyName = enc.decrypt(tenant.companyName.encode()).decode()
            tenant.phone = enc.decrypt(tenant.phone.encode()).decode()
            tenant.country = enc.decrypt(tenant.country.encode()).decode()
            tenant.city = enc.decrypt(tenant.city.encode()).decode()
            tenant.postal_code = enc.decrypt(tenant.postal_code.encode()).decode()
            tenant.licenses = [enc.decrypt(l.encode()).decode() for l in (tenant.licenses or [])]

            tenant.iocs = [
                IocCategory(
                    ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode(),
                    name=enc.decrypt(ioc.name.encode()).decode(),
                    values=[enc.decrypt(v.encode()).decode() for v in (ioc.values or [])]
                )
                for ioc in (tenant.iocs or [])
            ]

            result.append(tenant)

        return result


    async def create_company_user(self,data: tenant_team_model, current_user):
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
                (db_user_account.username == username) | (db_user_account.email == email)
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

            company_uuid = getattr(current_user, "company_uuid", None)
            if not company_uuid:
                raise HTTPException(status_code=400, detail="Invalid company association")

            user = db_user_account(
                username=username,
                email=email,
                password=hashed_password,
                role=data.role,
                status=data.status,
                subscription=data.subscription,
                licenses=data.licenses,
                company_uuid=company_uuid,
            )

            await engine.save(user)
            await TenantKeyManager.get_instance().create_user_dek(user.id)

            return {
                "message": "User created successfully",
                "username": username,
                "email": email,
                "company_uuid": company_uuid
            }

        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e) or "Error creating user")
        
    async def create_demo_user(self,data: tenant_team_model):
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
            await TenantKeyManager.get_instance().create_user_dek(user.id)

            return {
                "message": "User created successfully",
                "username": username,
                "email": email
            }

        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e) or "Error creating user")