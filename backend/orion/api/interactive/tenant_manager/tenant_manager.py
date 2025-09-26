import threading
from typing import List
from fastapi import HTTPException
from starlette import status
from odmantic import AIOEngine

from orion.api.interactive.tenant_manager.models.tenant_param_model import tenant_param_model
from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_tenant_model import IocCategory, db_tenant_model, TenantRequest
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, db_user_account
from orion.services.encryption_manager.encryption_manager import encryption_manager
from orion.api.interactive.tenant_manager.models.user_param_model import user_param_model

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

    async def create_tenant(self, data: TenantRequest, current_user):
        encryptor = encryption_manager.get_instance(
            secret_key=CONSTANTS.S_ENCRYPTION_KEY
        )

        encrypted_company = encryptor.encrypt(data.companyName)
        encrypted_iocs = [
            IocCategory(
                ioc_id=encryptor.encrypt(ioc.ioc_id),
                name=encryptor.encrypt(ioc.name),
                values=[encryptor.encrypt(v) for v in ioc.values]
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

        return {
            "message": "Onboarding created",
            "user": current_user.username,
            "company": encrypted_company
        }
    
    async def get_tenant(self, current_user) -> TenantRequest:

        encryptor = encryption_manager.get_instance(
            secret_key=CONSTANTS.S_ENCRYPTION_KEY
        )

        onboarding = await self._engine.find_one(
            db_tenant_model,
            db_tenant_model.userId == str(current_user.id)
        )

        if not onboarding:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")

        ioc_models = [
            IocCategory(
                ioc_id=encryptor.decrypt(ioc.ioc_id),
                name=encryptor.decrypt(ioc.name),
                values=[encryptor.decrypt(v) for v in ioc.values]
            )
            for ioc in onboarding.iocs
        ]

        tenant_request = TenantRequest(
            companyName=encryptor.decrypt(onboarding.companyName),
            iocs=ioc_models
        )

        return tenant_request
    
    async def update_tenant(self, data: TenantRequest, current_user):
        encryptor = encryption_manager.get_instance(
            secret_key=CONSTANTS.S_ENCRYPTION_KEY
        )

        onboarding = await self._engine.find_one(
            db_tenant_model, 
            db_tenant_model.userId == str(current_user.id)
        )

        if not onboarding:
            raise ValueError("Onboarding record not found for this user.")

        onboarding.companyName = encryptor.encrypt(data.companyName)
        onboarding.iocs = [
            IocCategory(
                ioc_id=encryptor.encrypt(ioc.ioc_id),
                name=encryptor.encrypt(ioc.name),
                values=[encryptor.encrypt(v) for v in ioc.values]
            )
            for ioc in data.iocs
        ]

        await self._engine.save(onboarding)

        return {
            "message": "Onboarding updated",
            "user": current_user.username,
            "company": onboarding.companyName
        }
    
    async def get_all_users(self) ->List[user_param_model]:
        users = await self._engine.find(db_user_account)
        responseUsers=[user_param_model(**u.dict()) for u in users]
        return responseUsers
    
    async def update_user(self, request: tenant_param_model):
        user = await self._engine.find_one(db_user_account, db_user_account.username == request.username)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.status = request.status
        await self._engine.save(user)
        return {"message": "User updated successfully"}