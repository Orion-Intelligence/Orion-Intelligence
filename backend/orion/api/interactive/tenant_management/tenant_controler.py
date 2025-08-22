from datetime import datetime, timezone
import uuid
from odmantic import AIOEngine
from fastapi import HTTPException
from typing import List

from orion.api.interactive.tenant_management.db_tenant_model import UserStatus, db_tenant_model, SystemStatus, TenantMetadata, TenantMappings


class tenant_controller:
    __instance = None
    __engine: AIOEngine = None

    def __init__(self):
        tenant_controller.__instance = self

    @staticmethod
    def getInstance():
        if tenant_controller.__instance is None:
            tenant_controller()
        return tenant_controller.__instance

    def set_engine(self, engine: AIOEngine):
        tenant_controller.__engine = engine

    def get_engine(self) -> AIOEngine:
        return tenant_controller.__engine

    async def add_tenant(self, tenant: db_tenant_model):
        # Generate verification token
        token = str(uuid.uuid4())
        tenant.meta.verification_token = token
        tenant.meta.date = datetime.utcnow()
        tenant.meta.user_status = UserStatus.PENDING

        doc = tenant.dict(by_alias=True)
        result = await self.collection.insert_one(doc)

        # 🚀 Send verification email
        await self.send_verification_email(tenant.meta.email, token)

        return {**doc, "id": str(result.inserted_id)}

    async def get_tenants(self) -> List[db_tenant_model]:
        return await self.__engine.find(db_tenant_model)

    async def approve_tenant(self, tenant_id: str) -> db_tenant_model:
        tenant = await self.__engine.find_one(db_tenant_model, db_tenant_model.id == tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        tenant.metadata.systemStatus = SystemStatus.APPROVED
        tenant.metadata.updated_at = datetime.now(timezone.utc)
        return await self.__engine.save(tenant)

    async def reject_tenant(self, tenant_id: str) -> db_tenant_model:
        tenant = await self.__engine.find_one(db_tenant_model, db_tenant_model.id == tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        tenant.metadata.systemStatus = SystemStatus.REJECTED
        tenant.metadata.updated_at = datetime.now(timezone.utc)
        return await self.__engine.save(tenant)

    async def get_all_emails(self) -> List[str]:
        tenants = await self.__engine.find(db_tenant_model)
        emails: List[str] = []
        for t in tenants:
            emails.extend(t.mappings.emails)
        return list(set(emails))

    async def get_all_phones(self) -> List[str]:
        tenants = await self.__engine.find(db_tenant_model)
        phones: List[str] = []
        for t in tenants:
            phones.extend(t.mappings.phones)
        return list(set(phones))
    
    async def send_verification_email(self, email: str, token: str):
        verification_link = f"http://localhost:4200/tenant/verify/{token}"
        print(f"📧 Sending verification email to {email} with link {verification_link}")

    async def send_verified_email(self, email: str):
        print(f"📧 Sending verified confirmation email to {email}")

    async def verify_tenant(self, token: str):
        tenant = await self.collection.find_one({"meta.verification_token": token})
        if not tenant:
            return {"error": "Invalid or expired token"}

        await self.collection.update_one(
            {"_id": tenant["_id"]},
            {"$set": {"meta.user_status": UserStatus.ACTIVE, "meta.system_status": "Enabled"}}
        )

        await self.send_verified_email(tenant["meta"]["email"])

        return {"message": "Tenant verified successfully"}
