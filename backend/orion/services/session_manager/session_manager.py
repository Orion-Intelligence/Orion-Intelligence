import threading
import time
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from starlette.responses import JSONResponse
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.shared_model.db_auth_models import user_role, db_user_account


class session_manager:
  __instance = None
  __lock = threading.Lock()
  __cache = {}

  @staticmethod
  def get_instance():
    if session_manager.__instance is None:
      with session_manager.__lock:
        if session_manager.__instance is None:
          session_manager.__instance = session_manager()
    return session_manager.__instance

  def __init__(self):
    if session_manager.__instance is not None:
      raise Exception("This class is a singleton!")
    session_manager.__instance = self
    self._engine = mongo_controller.get_instance().get_engine()

  async def get_current_user(self, token: str):
    if not token:
      raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = token.strip()
    if token.startswith("Bearer "):
      token = token[len("Bearer "):].strip()

    current_time = time.time()
    if token in session_manager.__cache:
      cached_user, expiry = session_manager.__cache[token]
      if expiry > current_time:
        return cached_user
      else:
        del session_manager.__cache[token]

    try:
      payload = jwt.decode(
        token,
        CONSTANTS.S_AUTH_SECRET_KEY,
        algorithms=[CONSTANTS.S_AUTH_ALGORITHM],
        options={"verify_exp": True},
      )
      username: str = payload.get("sub")

      if not username:
        raise HTTPException(status_code=401, detail="Missing or invalid token")

      user = await self._engine.find_one(db_user_account, db_user_account.username == username)
      if not user:
        raise HTTPException(status_code=401, detail="Missing or invalid token")

      session_manager.__cache[token] = (user, current_time + 60)
      return user

    except jwt.ExpiredSignatureError:
      raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
      raise HTTPException(status_code=401, detail="Invalid token")

  async def get_current_role(self, token: str) -> str:
    user = await self.get_current_user(token)
    if not user or isinstance(user, JSONResponse):
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

    role = user.role
    try:
      _ = user_role(role)
    except ValueError:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")
    return role

  async def create_access_token(self, data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire.timestamp()})
    token = jwt.encode(to_encode, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)
    role = await self.get_current_role(token)
    return token, role

  async def refresh_token(self, token: str):
    try:
      payload = jwt.decode(
        token,
        CONSTANTS.S_AUTH_SECRET_KEY,
        algorithms=[CONSTANTS.S_AUTH_ALGORITHM],
        options={"verify_exp": True},
      )
      username = payload.get("sub")

      if not username:
        raise HTTPException(status_code=401, detail="Invalid token")

      user = await self._engine.find_one(db_user_account, db_user_account.username == username)
      if not user:
        raise HTTPException(status_code=401, detail="User not found")

      new_token_expiry = time.time() + CONSTANTS.S_AUTH_ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 60 * 24
      new_token_payload = {"sub": username, "exp": new_token_expiry}
      new_token = jwt.encode(new_token_payload, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)

      session_manager.__cache[new_token] = (user, new_token_expiry)

      return {"access_token": new_token, "token_type": "bearer"}

    except jwt.ExpiredSignatureError:
      raise HTTPException(status_code=401, detail="Token has expired, please log in again")
    except jwt.InvalidTokenError:
      raise HTTPException(status_code=401, detail="Invalid token")

  @staticmethod
  def logout_user(ptoken: str):
    if not ptoken:
      return
    token = ptoken.strip()
    if token.startswith("Bearer "):
      token = token[len("Bearer "):].strip()
    session_manager.__cache.pop(token, None)
