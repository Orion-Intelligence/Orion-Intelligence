from copy import deepcopy

from bson import ObjectId
from fastapi import UploadFile,HTTPException
from fastapi.responses import Response
from pathlib import Path
from cryptography.fernet import Fernet
from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.api.interactive.profile_manager.model.profile_parma_model import AccountParmaModel
from orion.services.mongo_manager.shared_model.db_alert_model import db_alert_model
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role, db_user_account


class ProfileManager:
    __instance = None

    @staticmethod
    def getInstance():
        if ProfileManager.__instance is None:
            ProfileManager.__instance = ProfileManager()
        return ProfileManager.__instance

    def __init__(self):
        if ProfileManager.__instance is not None:
            raise Exception("This class is a singleton!")
        self._engine = mongo_controller.get_instance().get_engine()
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent

        self.TENANT_DIR = self.BASE_DIR / "static" / "resource" / "profile"
        self.TENANT_DIR.mkdir(parents=True, exist_ok=True)
        ProfileManager.__instance = self

    @staticmethod
    async def _dek(user_id: str) -> bytes:
        return await KeyManager.get_instance().get_or_create_dek(user_id)

    async def getCompanyProfileData(self, current_user) -> AccountParmaModel:
        user = current_user
        empty_company = AccountParmaModel(
            companyName="",
            phone="",
            email=user.email,
            country="",
            city="",
            postalCode="",
            taxId="",
            twofa_enabled = False,
            preferences=deepcopy(user.preferences) or {},
            alerts=[]
        )

        if user.role != user_role.PROFILE:
            if "userId" not in empty_company.preferences:
                empty_company.preferences["userId"] = str(user.id)
            empty_company.preferences["licenses"] = []
            empty_company.preferences = user.preferences
            empty_company.twofa_enabled = current_user.twofa_enabled

            return empty_company

        tenant = await self._engine.find_one(
            db_tenant_model,
            db_tenant_model.id == ObjectId(user.company_uuid)
        )
        _alerts = await self._engine.find_one(
            db_alert_model,
            db_alert_model.tenant_id == str(user.company_uuid)
        )
        dek = await self._dek(str(tenant.id))
        enc = Fernet(dek)

        def safe_decrypt(value: str | None) -> str:
            if not value:
                return ""
            try:
                return enc.decrypt(value.encode()).decode()
            except Exception:
                return ""

        raw_alerts = _alerts.alerts if _alerts and _alerts.alerts else []

        alerts_list = AlertManager.getInstance().filter_alerts_by_license(raw_alerts, user)

        company = AccountParmaModel(
            companyName=safe_decrypt(tenant.companyName),
            phone=safe_decrypt(tenant.phone),
            email=user.email,
            country=safe_decrypt(tenant.country),
            city=safe_decrypt(tenant.city),
            postalCode=safe_decrypt(tenant.postal_code),
            taxId=safe_decrypt(tenant.id),
            preferences=deepcopy(user.preferences) or {},
            twofa_enabled = user.twofa_enabled,
            alerts=alerts_list
        )
        print(user.twofa_enabled, flush=True)
        print(":::::::::::::::::::::::::::", flush=True)
        for key, value in company.preferences.items():
            if value and isinstance(value, str):
                try:
                    company.preferences[key] = enc.decrypt(value.encode()).decode()
                except Exception:
                    company.preferences[key] = ""

        if "userId" not in company.preferences:
            company.preferences["userId"] = str(user.id)

        assigned_quota = await self._engine.count(
            db_user_account,
            db_user_account.company_uuid == str(user.company_uuid)
        )

        company.preferences["licenses"] = [safe_decrypt(l) for l in (tenant.licenses or [])]
        company.preferences["assignedQuota"] = assigned_quota
        company.preferences["quotaExceeded"] = bool(tenant.user_quota and assigned_quota >= tenant.user_quota)

        return company

    async def updateUser(self, data: AccountParmaModel, current_user):
        dek = await self._dek(str(current_user.id))
        enc = Fernet(dek)

        if data.preferences and "twoFa" in data.preferences:
            value = data.preferences["twoFa"]
            if isinstance(value, str):
                current_user.twofa_enabled = value.lower() == "true"

        if data.preferences:
            for key, value in data.preferences.items():
                if value and isinstance(value, str):
                    data.preferences[key] = enc.encrypt(value.encode()).decode()

        current_user.preferences = data.preferences
        await self._engine.save(current_user)
        await AuditLogManager.get_instance().register(str(current_user.id), "update_user")
        return {"message": "User updated successfully"}

    async def updateProfile(self, data: AccountParmaModel, current_user):
        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(current_user.company_uuid))
        dek = await self._dek(str(tenant.id))
        enc = Fernet(dek)
        encrypted_country = enc.encrypt(data.country.encode()).decode()
        encrypted_city = enc.encrypt(data.city.encode()).decode()
        encrypted_phone = enc.encrypt(data.phone.encode()).decode()
        encrypted_postalCode = enc.encrypt(data.postalCode.encode()).decode()
        if data.preferences and "twoFa" in data.preferences:
            value = data.preferences["twoFa"]
            if isinstance(value, str):
                current_user.twofa_enabled = value.lower() == "true"


        for key, value in data.preferences.items():
            if value:
                if isinstance(value, str):
                    data.preferences[key] = enc.encrypt(value.encode()).decode()

        tenant.country=encrypted_country
        tenant.city=encrypted_city
        tenant.phone=encrypted_phone
        tenant.postal_code=encrypted_postalCode
        current_user.preferences=data.preferences
        await self._engine.save(tenant)
        await self._engine.save(current_user)
        await AuditLogManager.get_instance().register(str(current_user.company_uuid), "update_user")
        return {"message": "User updated successfully"}

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

    async def getProfileResource(self, userId: str):
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
