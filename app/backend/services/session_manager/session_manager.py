from datetime import datetime, timedelta, timezone
import jwt

from backend.constants.constant import CONSTANTS
from backend.services.mongo_manager.mongo_controller import mongo_controller
from backend.services.session_manager.shared_model.auth_models import account

class session_manager:
  __instance = None

  @staticmethod
  def getInstance():
    if session_manager.__instance is None:
      session_manager()
    return session_manager.__instance

  def __init__(self):
    session_manager.__instance = self

  @staticmethod
  async def get_default_admin():
    secret_password = CONSTANTS.S_AUTH_SECRET_KEY
    admin_user = {
      "username": "admin",
      "email": "admin",
      "hashed_password": account.hash_password(secret_password),
      "is_admin": True
    }
    return admin_user

  @staticmethod
  async def authenticate_user(username: str, password: str):
    user = await mongo_controller.getInstance().get_user(username)
    if not user or not CONSTANTS.S_AUTH_PWD_CONTEXT.verify(password, user["hashed_password"]):
      return None
    return user

  @staticmethod
  def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=CONSTANTS.S_AUTH_ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)

  async def get_current_user(self, token: str):
    if not token or not token.startswith("Bearer "):
      return None

    token = token.split("Bearer ")[1]
    try:
      payload = jwt.decode(token, CONSTANTS.S_AUTH_SECRET_KEY, algorithms=[CONSTANTS.S_AUTH_ALGORITHM])
      username: str = payload.get("sub")
      if username is None:
        return None

      return await self.get_default_admin()
    except jwt.PyJWTError:
      return None
