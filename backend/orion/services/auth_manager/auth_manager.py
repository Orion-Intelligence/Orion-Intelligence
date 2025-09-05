from fastapi import HTTPException
import threading

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account,user_role,UserStatus
from orion.services.mongo_manager.signup_model.signup_request_model import SignupRequest


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

        user = db_user_account(
            username=data.username,
            email=data.email,
            password=hashed_password,
            role=user_role.PROFILE,
            status=UserStatus.PENDING
        )
        await engine.save(user)

        return {"message": "Signup successful. Your account is under verification.", "status": "pending"}
