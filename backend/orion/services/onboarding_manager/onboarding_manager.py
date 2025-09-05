from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.shared_model.db_onboarding_model import IocCategory, db_onboarding_model, OnboardingRequest
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus
from orion.services.session_manager.session_manager import session_manager
from orion.services.encryption_manager.encryption_manager import encryption_manager

class OnboardingManager:

    @staticmethod
    async def save_onboarding(data: OnboardingRequest, token: str):
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

        new_onboarding = db_onboarding_model(
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
