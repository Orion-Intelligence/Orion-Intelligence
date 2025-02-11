import threading
import jwt
from datetime import datetime, timedelta, timezone
from backend.services.mongo_manager.mongo_controller import mongo_controller
from backend.constants.constant import CONSTANTS


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

    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta | None = None):
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=6))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)

    @staticmethod
    async def authenticate_user(username: str, password: str):
      user = await mongo_controller.getInstance().get_user(username)
      if not user or not CONSTANTS.S_AUTH_PWD_CONTEXT.verify(password, user["password"]):
        return None
      return user
