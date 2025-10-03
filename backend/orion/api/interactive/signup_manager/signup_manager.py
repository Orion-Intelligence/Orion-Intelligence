
import re
from fastapi import HTTPException
from datetime import datetime, timedelta, timezone

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account,user_role,UserStatus
from orion.api.interactive.signup_manager.model.signup_request_model import SignupRequest
from orion.services.session_manager.session_manager import session_manager
from orion.services.mail_manager.mail_manager import mail_manager
from orion.services.mail_manager.mail_enums import MailSubject,MailUrlHeading
from orion.constants import constant
from orion.helper_manager.env_handler import env_handler


class SignupManager:
    @staticmethod
    async def signup_user(data: SignupRequest):
        engine = mongo_controller.get_instance().get_engine()
        existing_user = await engine.find_one(
            db_user_account,
            (db_user_account.username == data.username) |
            (db_user_account.email == data.email)
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")
        
        email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        if not re.match(email_pattern, data.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        domain = data.email.split("@")[-1].lower()
        existing_domain_user = await engine.find_one(
            db_user_account,
            {"email": {"$regex": f"@{domain}$", "$options": "i"}} 
        )
        if existing_domain_user:
            raise HTTPException(status_code=400,detail=f"Accounts with domain '{domain}' are not allowed since one already exists.")

        PRODUCTION = int(env_handler.get_instance().env("PRODUCTION", 0)) 
        if PRODUCTION == 1:
            non_company_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
            domain = data.email.split("@")[-1].lower()
            if domain in non_company_domains:
                raise HTTPException(status_code=400, detail="Please enter your company email (Gmail, Yahoo, etc. not allowed).")

        hashed_password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(data.password)

        _verification_token = session_manager.get_instance().generate_verification_token()
        _verification_token_expire = datetime.now(timezone.utc) + timedelta(days=1)

        user = db_user_account(
            username=data.username,
            email=data.email,
            password=hashed_password,
            role=user_role.PROFILE,
            status=UserStatus.PENDING,
            verification_token=_verification_token,
            verification_expiry=_verification_token_expire
        )
        await engine.save(user)

        APP_URL = env_handler.get_instance().env("APP_URL")
        verify_url = f"{APP_URL}/welcome/{_verification_token}"
        html_content = constant.mail_template.render(
            username=user.username,
            email=user.email,
            subject=MailSubject.VERIFICATION.value,
            lurlHeading=MailUrlHeading.VERIFICATION.value,
            url=verify_url
        )
        await mail_manager.get_instance().send_verification_mail(
            to=user.email,
            subject=MailSubject.VERIFICATION.value,
            body=html_content
        )

        return {"message": "Signup successful. Your account is under verification.", "status": "pending"}