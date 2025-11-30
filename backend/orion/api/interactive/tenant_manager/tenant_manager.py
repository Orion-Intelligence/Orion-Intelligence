import threading

from typing import List

from bson import ObjectId
from fastapi import HTTPException
from starlette import status
from cryptography.fernet import Fernet
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.tenant_manager.models.tenant_param_model import tenant_param_model
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_tenant_key import db_tenant_key
from orion.services.mongo_manager.shared_model.db_tenant_model import IocCategory, db_tenant_model, TenantRequest, TenantStatus
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
            await self._engine.remove(db_tenant_key, db_tenant_key.tenant_id == str(data.id))
            await self._engine.delete(data)
            raise

    async def get_tenant(self, current_user) -> TenantRequest:
        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == str(current_user.company_uuid))
        if not tenant:
            await AuditLogManager.get_instance().register(str(current_user.id), "get_tenant_failed")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")

        dek = await TenantKeyManager.get_instance().get_dek(str(tenant.id))
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
            id=tenant.id,
            companyName=enc.decrypt(tenant.companyName.encode()).decode(),
            iocs=ioc_models
        )

        return tenant_request

    async def update_tenant(self, data: TenantRequest, current_user):

        if current_user.role in ["admin"]:
            tenant_id = data.id
        else:
            tenant_id = current_user.company_uuid

        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(tenant_id))
        if not tenant and not current_user.role in ["admin"]:
            await AuditLogManager.get_instance().register(str(current_user.id), "update_tenant_failed")
            raise HTTPException(status_code=404, detail="Onboarding record not found for this user.")

        dek = await TenantKeyManager.get_instance().get_dek(str(tenant.id))
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

    async def get_all_users(self) -> List[user_param_model]:
        users = await self._engine.find(db_user_account)
        return [user_param_model(**u.dict()) for u in users]

    async def update_user(self, request: tenant_param_model):
        user = await self._engine.find_one(db_user_account, db_user_account.username == request.username)
        if not user:
            await AuditLogManager.get_instance().register("system", f"update_user_failed:{request.username}")
            raise HTTPException(status_code=404, detail="User not found")
        if user.role in ["admin", "crawl"]:
            await AuditLogManager.get_instance().register(str(user.id), f"update_user_denied:{request.username}")
            raise HTTPException(status_code=403, detail="This user type cannot be updated")

        if request.status.value == "disable":
            user.status = UserStatus.DISABLE.value
        else:
            user.status = UserStatus.ACTIVE.value

        user.subscription = request.subscription
        user.licenses = request.licenses
        await self._engine.save(user)
        await AuditLogManager.get_instance().register(str(user.id), "update_user")

        return {"message": "User updated successfully"}

    async def get_all_tenant(self) -> List[db_tenant_model]:
        tenants = await self._engine.find(db_tenant_model)
        result = []
        for tenant in tenants:
            dek = await TenantKeyManager.get_instance().get_dek(str(tenant.id))
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

    async def decrypt_iocs_for_tenant(self, tenant: db_tenant_model) -> List[IocCategory]:
        dek = await TenantKeyManager.get_instance().get_dek(str(tenant.id))
        enc = Fernet(dek)
        decrypted_iocs = []
        for ioc in tenant.iocs or []:
            decrypted_iocs.append(IocCategory(
                ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode(),
                name=enc.decrypt(ioc.name.encode()).decode(),
                values=[enc.decrypt(v.encode()).decode() for v in (ioc.values or [])]
            ))
        return decrypted_iocs
