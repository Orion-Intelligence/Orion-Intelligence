# orion/api/interactive/tenant_manager/tenant_manager.py
import threading
from typing import List
from fastapi import HTTPException
from starlette import status

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.tenant_manager.models.tenant_param_model import tenant_param_model
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_tenant_model import IocCategory, db_tenant_model, TenantRequest
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, db_user_account
from orion.api.interactive.tenant_manager.models.user_param_model import user_param_model
from orion.services.encryption_manager.tenant_key_manager import TenantKeyManager

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
        self._engine = mongo_controller.get_instance().get_engine()
        if TenantManager.__instance is not None:
            raise Exception("This class is a singleton!")
        TenantManager.__instance = self

    @staticmethod
    async def _dek(user_id: str) -> bytes:
        return await TenantKeyManager.get_instance().get_or_create_dek(user_id)

    async def create_tenant(self, data: TenantRequest, current_user):
        dek = await self._dek(str(current_user.id))
        from cryptography.fernet import Fernet
        enc = Fernet(dek)
        encrypted_company = enc.encrypt(data.companyName.encode()).decode()
        encrypted_iocs = [
            IocCategory(
                ioc_id=enc.encrypt(ioc.ioc_id.encode()).decode(),
                name=enc.encrypt(ioc.name.encode()).decode(),
                values=[enc.encrypt(v.encode()).decode() for v in ioc.values]
            )
            for ioc in data.iocs
        ]
        new_onboarding = db_tenant_model(
            userId=str(current_user.id),
            companyName=encrypted_company,
            iocs=encrypted_iocs
        )
        await self._engine.save(new_onboarding)
        current_user.status = UserStatus.ACTIVE
        await self._engine.save(current_user)
        await AuditLogManager.get_instance().register(str(current_user.id), "signup")
        await AuditLogManager.get_instance().register(str(current_user.id), "register")
        return {"message": "Onboarding created", "user": current_user.username, "company": encrypted_company}

    async def get_tenant(self, current_user) -> TenantRequest:
        onboarding = await self._engine.find_one(db_tenant_model, db_tenant_model.userId == str(current_user.id))
        if not onboarding:
            await AuditLogManager.get_instance().register(str(current_user.id), "get_tenant_failed")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")
        dek = await TenantKeyManager.get_instance().get_dek(str(current_user.id))
        from cryptography.fernet import Fernet
        enc = Fernet(dek)
        ioc_models = [
            IocCategory(
                ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode(),
                name=enc.decrypt(ioc.name.encode()).decode(),
                values=[enc.decrypt(v.encode()).decode() for v in (ioc.values or [])]
            )
            for ioc in (onboarding.iocs or [])
        ]
        tenant_request = TenantRequest(
            companyName=enc.decrypt(onboarding.companyName.encode()).decode(),
            iocs=ioc_models
        )
        return tenant_request

    async def update_tenant(self, data: TenantRequest, current_user):
        onboarding = await self._engine.find_one(db_tenant_model, db_tenant_model.userId == str(current_user.id))
        if not onboarding:
            await AuditLogManager.get_instance().register(str(current_user.id), "update_tenant_failed")
            raise HTTPException(status_code=404, detail="Onboarding record not found for this user.")
        dek = await TenantKeyManager.get_instance().get_dek(str(current_user.id))
        from cryptography.fernet import Fernet
        enc = Fernet(dek)
        onboarding.companyName = enc.encrypt(data.companyName.encode()).decode()
        onboarding.iocs = [
            IocCategory(
                ioc_id=enc.encrypt(ioc.ioc_id.encode()).decode(),
                name=enc.encrypt(ioc.name.encode()).decode(),
                values=[enc.encrypt(v.encode()).decode() for v in ioc.values]
            )
            for ioc in data.iocs
        ]
        await self._engine.save(onboarding)
        await AuditLogManager.get_instance().register(str(current_user.id), "update_tenant")
        return {"message": "Onboarding updated", "user": current_user.username, "company": onboarding.companyName}

    async def get_all_users(self) -> List[user_param_model]:
        users = await self._engine.find(db_user_account)
        return [user_param_model(**u.dict()) for u in users]

    async def update_user(self, request: tenant_param_model):
        user = await self._engine.find_one(db_user_account, db_user_account.username == request.username)
        if not user:
            await AuditLogManager.get_instance().register("system", f"update_user_failed:{request.username}")
            raise HTTPException(status_code=404, detail="User not found")
        user.status = request.status
        await self._engine.save(user)
        await AuditLogManager.get_instance().register(str(user.id), "update_user")
        return {"message": "User updated successfully"}
