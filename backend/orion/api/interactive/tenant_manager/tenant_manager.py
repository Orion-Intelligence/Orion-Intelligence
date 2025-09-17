from http.client import HTTPException
from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.shared_model.db_tenant_model import IocCategory, db_tenant_model, TenantRequest
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus
from orion.services.session_manager.session_manager import session_manager
from orion.services.encryption_manager.encryption_manager import encryption_manager

class TenantManager:

    @staticmethod
    async def create_tenant(data: TenantRequest, token: str):
        sess = session_manager.get_instance()
        current_user = await sess.get_current_user(token)
        engine = sess._engine

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

        await engine.save(new_onboarding)

        current_user.status = UserStatus.ACTIVE
        await engine.save(current_user)

        return {
            "message": "Onboarding created",
            "user": current_user.username,
            "company": encrypted_company
        }
    
    @staticmethod
    async def get_tenant(token: str) -> TenantRequest:
        sess = session_manager.get_instance()
        current_user = await sess.get_current_user(token)
        engine = sess._engine

        encryptor = encryption_manager.get_instance(
            secret_key=CONSTANTS.S_ENCRYPTION_KEY
        )

        onboarding = await engine.find_one(
            db_tenant_model,
            db_tenant_model.userId == str(current_user.id)
        )

        if not onboarding:
            raise HTTPException(status_code=404, detail="Tenant not found")

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
    
    @staticmethod
    async def update_tenant(data: TenantRequest, token: str):
        sess = session_manager.get_instance()
        current_user = await sess.get_current_user(token)
        engine = sess._engine

        encryptor = encryption_manager.get_instance(
            secret_key=CONSTANTS.S_ENCRYPTION_KEY
        )

        onboarding = await engine.find_one(
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

        await engine.save(onboarding)

        return {
            "message": "Onboarding updated",
            "user": current_user.username,
            "company": onboarding.companyName
        }