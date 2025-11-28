from copy import deepcopy
from fastapi import UploadFile,HTTPException
from fastapi.responses import Response
from pathlib import Path
from cryptography.fernet import Fernet
from orion.services.encryption_manager.tenant_key_manager import TenantKeyManager
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.api.interactive.profile_manager.model.profile_parma_model import ProfileParmaModel
from orion.services.mongo_manager.shared_model.db_alert_model import db_alert_model
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager



class ProfileManager:
    __instance = None

    @staticmethod
    def get_instance():
        if ProfileManager.__instance is None:
            ProfileManager.__instance = ProfileManager()
        return ProfileManager.__instance

    def __init__(self):
        if ProfileManager.__instance is not None:
            raise Exception("This class is a singleton!")
        self._engine = mongo_controller.get_instance().get_engine()
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
        self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "company-profile-images"
        self.IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        ProfileManager.__instance = self

    @staticmethod
    async def _dek(user_id: str) -> bytes:
        return await TenantKeyManager.get_instance().get_or_create_dek(user_id)

    async def getCompanyProfileData(self,current_user)  -> ProfileParmaModel:
        profile = await self._engine.find_one(db_tenant_model, db_tenant_model.userId == str(current_user.id))
        _alerts=await self._engine.find_one(db_alert_model,db_alert_model.userId == str(current_user.id))
        user=current_user
        dek = await self._dek(str(current_user.id))
        enc = Fernet(dek)
        def safe_decrypt(value: str | None) -> str:
            if not value:
                return ""
            try:
                return enc.decrypt(value.encode()).decode()
            except Exception:
                return ""
        alerts_list = _alerts.alerts if _alerts and _alerts.alerts else []
        company = ProfileParmaModel(
            companyName=safe_decrypt(profile.companyName),
            phone=safe_decrypt(profile.phone),
            email=user.email,
            country=safe_decrypt(profile.country),
            city=safe_decrypt(profile.city),
            postalCode=safe_decrypt(profile.postal_code),
            taxId=safe_decrypt(profile.id),
            preferences=deepcopy(user.preferences) or {},
            alerts=alerts_list
        )
        for key, value in company.preferences.items():
                if value:
                    if isinstance(value, str):
                        company.preferences[key] = enc.decrypt(value.encode()).decode()
        
        if "userId" not in company.preferences:
            company.preferences["userId"] = str(user.id)
        company.preferences["twoFa"] = str(user.twofa_enabled)
        return company

    async def updateCompanyProfile(self,data: ProfileParmaModel, current_user):
        profile = await self._engine.find_one(db_tenant_model, db_tenant_model.userId == str(current_user.id))
        dek = await self._dek(str(current_user.id))
        enc = Fernet(dek)
        encrypted_country = enc.encrypt(data.country.encode()).decode()
        encrypted_city = enc.encrypt(data.city.encode()).decode()
        encrypted_phone = enc.encrypt(data.phone.encode()).decode()
        encrypted_postalCode = enc.encrypt(data.postalCode.encode()).decode()
        encrypted_taxId = enc.encrypt(data.taxId.encode()).decode()
        if data.preferences and "twoFa" in data.preferences:
            value = data.preferences["twoFa"]
            if isinstance(value, str):
                current_user.twofa_enabled = value.lower() == "true"
        for key, value in data.preferences.items():
            if value: 
                if isinstance(value, str):
                    data.preferences[key] = enc.encrypt(value.encode()).decode()

        profile.country=encrypted_country
        profile.city=encrypted_city
        profile.phone=encrypted_phone
        profile.postal_code=encrypted_postalCode
        current_user.preferences=data.preferences
        await self._engine.save(profile)
        await self._engine.save(current_user)
        await AuditLogManager.get_instance().register(str(current_user.id), "update_user")
        return {"message": "User updated successfully"}
    
    async def uploadProfileImage(self,file: UploadFile, current_user):
        contents = await file.read()
        MAX_FILE_SIZE=50*1024
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large! Maximum allowed size is 50 KB.")

        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=415, detail="Invalid file type. Only image files are allowed.")


        dek = await self._dek(str(current_user.id))
        enc = Fernet(dek)

        encrypted_data = enc.encrypt(contents)
        
        file_path = self.IMAGE_DIR / f"{current_user.id}.enc"
        with open(file_path, "wb") as f:
            f.write(encrypted_data)
        await AuditLogManager.get_instance().register(str(current_user.id), "upload_image")
        return {"Profile image": "upload complete"}
    

    async def getProfileImage(self, current_user):
        dek = await self._dek(str(current_user.id))
        enc = Fernet(dek)

        file_path = self.IMAGE_DIR / f"{current_user.id}.enc"
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="image not found")

       
        with open(file_path, "rb") as f:
            encrypted_data = f.read()

        decrypted = enc.decrypt(encrypted_data)

        return Response(content=decrypted, media_type="image/jpeg")
    
