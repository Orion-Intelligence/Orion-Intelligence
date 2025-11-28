import re
from fastapi import HTTPException
from datetime import datetime, timedelta, timezone

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, user_role, UserStatus,LicenseName
from orion.api.interactive.signup_manager.model.signup_request_model import SignupRequest
from orion.services.session_manager.session_manager import session_manager
from orion.services.mail_manager.mail_manager import mail_manager
from orion.services.mail_manager.mail_enums import MailSubject, MailUrlHeading
from orion.constants import constant
from orion.helper_manager.env_handler import env_handler


class SignupManager:
    @staticmethod
    async def signup_user(data: SignupRequest):
        try:
            engine = mongo_controller.get_instance().get_engine()
            username = (data.username or "").strip()
            email = (data.email or "").strip().lower()
            password = (data.password or "").strip()

            if not username or not username.isalnum():
                raise HTTPException(status_code=422, detail="Username must be alphanumeric and non-empty")

            email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
            if not re.match(email_pattern, email):
                raise HTTPException(status_code=422, detail="Invalid email format")

            existing_user = await engine.find_one(
                db_user_account,
                (db_user_account.username == username) | (db_user_account.email == email)
            )
            if existing_user:
                raise HTTPException(status_code=400, detail="Username or email already exists")

            domain = email.split("@")[-1].lower()
            existing_domain_user = await engine.find_one(
                db_user_account,
                {"email": {"$regex": f"@{domain}$", "$options": "i"}}
            )
            if existing_domain_user:
                raise HTTPException(
                    status_code=400,
                    detail=f"Accounts with domain '{domain}' are not allowed since one already exists."
                )

            PRODUCTION = int(env_handler.get_instance().env("PRODUCTION", 0))
            if PRODUCTION == 1:
                non_company_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
                if domain in non_company_domains:
                    raise HTTPException(
                        status_code=400,
                        detail="Please enter your company email (Gmail, Yahoo, etc. not allowed)."
                    )

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

            user = db_user_account(
                username=username,
                email=email,
                password=hashed_password,
                role=user_role.PROFILE,
                status=UserStatus.PENDING,
                verification_token=_verification_token,
                verification_expiry=_verification_token_expire,
                licenses = [LicenseName.MAINTAINER]
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

            return {
                "message": "Signup successful. Your account is under verification.",
                "status": "pending",
                "email": email
            }

        except HTTPException as e:
            raise e
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid signup data")
