import threading
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Depends, Request
from bson import ObjectId
from odmantic import AIOEngine
import pyotp

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.constants import constant
from orion.services.mail_manager.mail_enums import MailSubject, MailUrlHeading
from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, user_role, UserStatus
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model, TenantStatus
from orion.services.session_manager.session_manager import session_manager
from orion.services.mail_manager.mail_manager import mail_manager
from orion.helper_manager.env_handler import env_handler


class auth_manager:
    __instance = None
    __lock = threading.Lock()
    __cache = {}

    @staticmethod
    def get_instance():
        if auth_manager.__instance is None:
            with auth_manager.__lock:
                if auth_manager.__instance is None:
                    auth_manager.__instance = auth_manager()
        return auth_manager.__instance

    def __init__(self):
        if auth_manager.__instance is not None:
            raise Exception("This class is a singleton!")
        auth_manager.__instance = self
        self._engine = mongo_controller.get_instance().get_engine()

    async def authenticate_user(self, mail: str, password: str):
        user = await self._engine.find_one(db_user_account, db_user_account.email == mail)
        if not user:
            user = await self._engine.find_one(db_user_account, db_user_account.username == mail)
        if not user or not CONSTANTS.S_AUTH_PWD_CONTEXT.verify(password, user.password):
            return None
        return user

    @staticmethod
    async def login(mail: str, password: str, free=False):
        user = await auth_manager.get_instance().authenticate_user(mail, password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid user or password")
        if user.twofa_enabled:
            if user.twofa_secret:
                user.twofa_secret = ""
                temp_token = await session_manager.get_instance().create_temp_token(user.username)
                return {"twofa_required": True, "temp_token": temp_token, "username": mail}
            else:
                secret = pyotp.random_base32()
                provisioning_uri = pyotp.TOTP(secret).provisioning_uri(name=user.username, issuer_name="Orion")
                temp_token = await session_manager.get_instance().create_temp_token(
                    user.username, extra={"tfa_secret": secret})
                return {"twofa_required": True, "temp_token": temp_token, "provisioning_uri": provisioning_uri, "twofa_secret": secret, "username": user.username}

        role_name = (getattr(user.role, "value", str(user.role))).split(".")[-1].lower()
        acct_at = user.account_verify_at
        if isinstance(acct_at, datetime):
            acct_at = acct_at if acct_at.tzinfo else acct_at.replace(tzinfo=timezone.utc)

        if not getattr(user, "tenant_uuid", None):
            raise HTTPException(status_code=401, detail="account not found")
        engine = mongo_controller.get_instance().get_engine()
        tenant = await engine.find_one(
            db_tenant_model, db_tenant_model.id == ObjectId(user.tenant_uuid))
        if tenant and not tenant.verified:
            raise HTTPException(status_code=401, detail="account approval pending")
        if tenant and tenant.status == TenantStatus.DISABLE:
            raise HTTPException(status_code=401, detail="account blocked")

        if (role_name == "member" and not bool(getattr(user, "subscription", False)) and acct_at is not None and (
                datetime.now(timezone.utc) - acct_at).days >= 30):
            raise HTTPException(status_code=402, detail="Trial expired. Please subscribe to continue")

        if role_name == "member" and user.status != UserStatus.ACTIVE:
            raise HTTPException(status_code=401, detail="user currently disabled")

        if user.status == UserStatus.DISABLE:
            raise HTTPException(status_code=401, detail="Account Blocked")

        if user.role == user_role.CRAWLER:
            access_token_expires = timedelta(weeks=92)
        else:
            access_token_expires = timedelta(minutes=30)

        access_token, role = await session_manager.get_instance().create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires, free=free)

        await AuditLogManager.get_instance().register(
            str(user.tenant_uuid), str(user.id), "User login")

        onboarding_exists = await session_manager.get_instance().has_onboarding(str(user.tenant_uuid))

        session_data = {"role": role, "username": user.username, "status": user.status, "hasOnboarding": onboarding_exists, "subscription": user.subscription, "verificationDate": user.account_verify_at, "licenses": [
            license.value for license in user.licenses], }


        return {"access_token": access_token, "token_type": "bearer", "session": session_data, }

    @staticmethod
    async def verify_user(token: str):
        engine = mongo_controller.get_instance().get_engine()
        user = await engine.find_one(db_user_account, db_user_account.verification_token == token)
        if not user:
            raise HTTPException(status_code=404, detail="Invalid token")

        if not user.verification_expiry or datetime.now(timezone.utc) > user.verification_expiry.replace(
                tzinfo=timezone.utc):
            raise HTTPException(status_code=400, detail="Verification link expired")

        user.status = UserStatus.ACTIVE
        user.account_verify_at = datetime.now(timezone.utc)
        user.verification_token = None
        user.verification_expiry = None
        await engine.save(user)

        await AuditLogManager.get_instance().register(
            str(user.tenant_uuid), str(user.id), "User verified")

        return {"message": "Email verified successfully. You may continue onboarding."}

    @staticmethod
    async def update_password(token: str, password: str):
        engine = mongo_controller.get_instance().get_engine()
        user = await engine.find_one(db_user_account, db_user_account.verification_token == token)
        if not user:
            raise HTTPException(status_code=404, detail="Invalid Link")
        if CONSTANTS.S_AUTH_PWD_CONTEXT.verify(password, user.password):
            raise HTTPException(status_code=400, detail="New password must be different from the old one.")

        user.password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(password)
        user.verification_token = None
        await engine.save(user)

        await AuditLogManager.get_instance().register(
            str(user.tenant_uuid), str(user.id), "Password updated")

        return {"message": "Password reset successfully."}

    @staticmethod
    async def forgot_password(mail: str):
        engine = mongo_controller.get_instance().get_engine()
        user = await engine.find_one(db_user_account, db_user_account.email == mail)
        if not user:
            raise HTTPException(status_code=404, detail="Entered mail is not resgister")

        user.verification_token = session_manager.get_instance().generate_verification_token()
        await engine.save(user)

        await AuditLogManager.get_instance().register(
            str(user.tenant_uuid), str(user.id), "Password reset requested")

        APP_URL = env_handler.get_instance().env("APP_URL")
        forgot_url = f"{APP_URL}/reset/{user.verification_token}"
        html_content = constant.mail_template.render(
            username=user.username,
            email=user.email,
            subject=MailSubject.FORGOT_PASSWORD.value,
            lurlHeading=MailUrlHeading.FORGOT_PASSWORD.value,
            url=forgot_url)
        await mail_manager.get_instance().send_verification_mail(
            to=user.email, subject=MailSubject.FORGOT_PASSWORD.value, body=html_content)

        return {"message": "Reset password mail send successfully."}

    @staticmethod
    async def edit_userStatus_and_sendMail_from_admin(user_id: str, request: Request):
        form = await request.form()
        updates = dict(form)
        engine: AIOEngine = Depends(mongo_controller.get_instance().get_engine)
        user = await engine.find_one(db_user_account, db_user_account.id == ObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        old_status = getattr(user, "status", None)
        new_status = updates.get("status", old_status)

        for field, value in updates.items():
            if hasattr(user, field):
                setattr(user, field, value)

        await engine.save(user)

        await AuditLogManager.get_instance().register(
            str(user.tenant_uuid), str(user.id), "User status updated")

        if old_status != "onboarding" and new_status == "onboarding":
            await mail_manager.get_instance().send_verification_mail(
                to=user.email,
                subject="Your account has been approved",
                body=f"Hi {user.username},\n\nYour account is now approved. "
                     f"You can log in and start onboarding.\n\nBest regards,\nTeam")

        return user
