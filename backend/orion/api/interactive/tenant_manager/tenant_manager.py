import threading
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from starlette import status

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_tenant_model import IocCategory, db_tenant_model, TenantRequest
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus
from orion.services.session_manager.session_manager import session_manager
from orion.services.encryption_manager.encryption_manager import encryption_manager

class TenantManager:
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")
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

    async def create_tenant(self, data: TenantRequest, token: str=Depends(oauth2_scheme)):
        session_instance = session_manager.get_instance()
        current_user = await session_instance.get_current_user(token)

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
    
    async def get_tenant(self, token:str=Depends(oauth2_scheme)) -> TenantRequest:
        session_instance = session_manager.get_instance()
        current_user = await session_instance.get_current_user(token)

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
    
    async def update_tenant(self, data: TenantRequest, token: str=Depends(oauth2_scheme)):
        session_instance = session_manager.get_instance()
        current_user = await session_instance.get_current_user(token)

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