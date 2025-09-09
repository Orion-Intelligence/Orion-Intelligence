from fastapi import HTTPException
import threading
from datetime import datetime, timedelta, timezone

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account,user_role,UserStatus
from orion.services.mongo_manager.signup_model.signup_request_model import SignupRequest
from orion.services.session_manager.session_manager import session_manager
from orion.services.mail_manager.mail_manager import mail_manager


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

    async def authenticate_user(self, username: str, password: str):
        user = await self._engine.find_one(db_user_account, db_user_account.username == username)
        if not user or not CONSTANTS.S_AUTH_PWD_CONTEXT.verify(password, user.password):
            return None
        return user
    
    async def signup_user(data: SignupRequest):
        engine = mongo_controller.get_instance().get_engine()
        existing_user = await engine.find_one(
            db_user_account,
            (db_user_account.username == data.username) |
            (db_user_account.email == data.email)
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")

        hashed_password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(data.password)
        _verification_token=session_manager.get_instance().generate_verification_token()
        _verification_token_expire=datetime.now(timezone.utc) + timedelta(days=1)

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
        verify_url = f"http://localhost:4200/welcome/{_verification_token}"
        await mail_manager.get_instance().send_verification_mail(
                to=user.email,
                subject="Please verify your account",
                body=f"Hi {user.username},\n\nPlease verify your email by clicking the link below "
            "(valid for 24 hours):\n\n"
            f"{verify_url}\n\n"
            "Best regards,\nTeam"
            )

        return {"message": "Signup successful. Your account is under verification.", "status": "pending"}
    
    async def verify_user(token: str):
        engine = mongo_controller.get_instance().get_engine()
        user = await engine.find_one(db_user_account, db_user_account.verification_token == token)
        if not user:
            raise HTTPException(status_code=404, detail="Invalid token")

        if not user.verification_expiry or datetime.now(timezone.utc) > user.verification_expiry.replace(tzinfo=timezone.utc):
            raise HTTPException(status_code=400, detail="Verification link expired")

        user.status = UserStatus.ONBOARDING 
        user.verification_token = None
        user.verification_expiry = None
        await engine.save(user)

        return {"message": "Email verified successfully. You may continue onboarding."}
    
    async def forgot_password(mail: str):
        engine = mongo_controller.get_instance().get_engine()
        user = await engine.find_one(db_user_account, db_user_account.email == mail)
        if not user:
            raise HTTPException(status_code=404, detail="Entered mail is not resgister")
        
        forgotToken=session_manager.get_instance().generate_verification_token()

        user.verification_token=forgotToken
        await engine.save(user)

        verify_url = f"http://localhost:4200/forgot/{forgotToken}"
        await mail_manager.get_instance().send_verification_mail(
                to=user.email,
                subject="Password rest link for orion intelligence",
                body=f"Hi {user.username},\n\nDon't share this link with anyone\n"
            f"{verify_url}\n\n"
            "Best regards,\nTeam"
            )
        
        return {"message": "Reset password mail send successfully."}
    
    async def update_password(token:str,password:str):
        engine = mongo_controller.get_instance().get_engine()
        user = await engine.find_one(db_user_account, db_user_account.verification_token == token)
        if not user:
            raise HTTPException(status_code=404, detail="Invaild Link")
        
        hashed_password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(password)
        user.verification_token=None
        user.password=hashed_password
        await engine.save(user)

        return {"message": "Password reset successfully."}
        
        

        
        
