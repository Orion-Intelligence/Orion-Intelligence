from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.constants.constant import CONSTANTS
from orion.helper_manager.helper_controller import helper_controller
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, user_role, LicenseName
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model, TenantStatus
from orion.api.interactive.signup_manager.model.signup_request_model import SignupRequest, SupportRequest
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS
from orion.services.session_manager.session_manager import session_manager
from orion.services.mail_manager.mail_manager import mail_manager
from orion.services.mail_manager.mail_enums import MailSubject, MailUrlHeading
from orion.constants import constant
from orion.helper_manager.env_handler import env_handler


class SignupManager:
    @staticmethod
    async def signup_user(data: SignupRequest):
        engine = mongo_controller.get_instance().get_engine()
        username, email, password = helper_controller.extract_user_mail_fields(data)

        TenantManager.validate_signup_username(username)
        TenantManager.validate_signup_email(email)

        existing_user = await engine.find_one(
            db_user_account, (db_user_account.username == username))
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")

        existing_mail = await engine.find_one(
            db_user_account, (db_user_account.email == email))
        if existing_mail:
            raise HTTPException(status_code=400, detail="Username or email already exists")

        new_email_domain = TenantManager.get_email_domain(email)
        maintainers = await engine.find(
            db_user_account, db_user_account.licenses == LicenseName.MAINTAINER)
        domain_exists = any(
            user.email and TenantManager.get_email_domain(user.email) == new_email_domain
            for user in maintainers
        )
        if domain_exists:
            raise HTTPException(status_code=400, detail="This domain tenant already exists")
            

        TenantManager.validate_company_email(email)

        if password.startswith("$2b$") and len(password) >= 60:
            hashed_password = password
        else:
            if len(password) > 256:
                raise HTTPException(status_code=422, detail="Password too long")
            try:
                hashed_password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(password)
            except Exception:
                raise HTTPException(status_code=422, detail="Invalid password")

        _verification_token = session_manager.get_instance().generate_verification_token()
        _verification_token_expire = datetime.now(timezone.utc) + timedelta(days=1)

        company = TenantManager.get_company_from_email(email)
        if not company:
            raise HTTPException(status_code=422, detail="Invalid email")

        tenant = db_tenant_model(
            iocs=[],
            name=company,
            phone="",
            country="",
            city="",
            postal_code="",
            user_quota=2,
            licenses=["maintainer", "free"],
            status=TenantStatus.ONBOARDING,
            email=email
            )
        await TenantManager.get_instance().create_tenant(tenant)

        user = db_user_account(
            username=username,
            email=email,
            password=hashed_password,
            role=user_role.MEMBER,
            verification_token=_verification_token,
            verification_expiry=_verification_token_expire,
            licenses=[LicenseName.MAINTAINER],
            tenant_uuid=str(tenant.id))
        await engine.save(user)

        await SignupManager._send_verification_email(user, _verification_token)
        return {"message": "Signup successful. Your account is under verification.", "status": "pending", "email": email}

    @staticmethod
    async def _send_verification_email(user, token: str):
        APP_URL = env_handler.get_instance().env("APP_URL")
        verify_url = f"{APP_URL}/welcome/{token}"
        html_content = constant.mail_template.render(
            username=user.username,
            email=user.email,
            subject=MailSubject.VERIFICATION.value,
            lurlHeading=MailUrlHeading.VERIFICATION.value,
            url=verify_url)
        await mail_manager.get_instance().send_verification_mail(
            to=user.email, subject=MailSubject.VERIFICATION.value, body=html_content)

    @staticmethod
    async def resend_verification_email(data: SignupRequest):
        try:
            engine = mongo_controller.get_instance().get_engine()

            username, email, password = helper_controller.extract_user_mail_fields(data)

            mail = email or username
            user = await auth_manager.get_instance().authenticate_user(mail, password)
            if not user:
                raise HTTPException(status_code=401, detail="Invalid credentials")

            redis_inst = redis_controller.getInstance()
            rate_key = f"resend_verification:{user.id}"
            current = await redis_inst.invoke_trigger(
                REDIS_COMMANDS.S_GET_INT, [rate_key, 0, 60])
            if int(current) >= 1:
                raise HTTPException(status_code=429, detail="Too many emails requested. Try again later.")
            await redis_inst.invoke_trigger(
                REDIS_COMMANDS.S_SET_INT, [rate_key, 1, 60])

            token = session_manager.get_instance().generate_verification_token()
            user.verification_token = token
            user.verification_expiry = datetime.now(timezone.utc) + timedelta(days=1)

            await engine.save(user)

            await SignupManager._send_verification_email(user, token)
            return {"message": "Verification email resent.", "email": user.email}

        except HTTPException as e:
            raise e
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid data")
        
    @staticmethod
    async def send_support_mail(data: SupportRequest):
        email=data.email or ""
        subject=data.subject or ""
        message=data.message or ""
            

        TenantManager.validate_company_email(email)

        company = TenantManager.get_company_from_email(email)
        if not company:
            raise HTTPException(status_code=422, detail="Invalid email")
        html_content = constant.mail_template.render(
            email=email,
            subject=subject,
            lurlHeading=MailUrlHeading.SUPPORT.value,
            url=message)
        await mail_manager.get_instance().send_verification_mail(
            to=email, subject=MailSubject.SUPPORT.value, body=html_content)
        return {"message": "Signup successful. Your account is under verification.", "status": "pending", "email": email}
