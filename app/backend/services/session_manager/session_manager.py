import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException
from jwt import ExpiredSignatureError, DecodeError
from starlette.responses import RedirectResponse
from starlette.templating import Jinja2Templates

from backend.services.mongo_manager.mongo_controller import mongo_controller
from backend.constants.constant import CONSTANTS

class session_manager:
  __instance = None

  @staticmethod
  def get_instance():
    if session_manager.__instance is None:
      session_manager()
    return session_manager.__instance

  def __init__(self):
    session_manager.__instance = self
    self.__templates = Jinja2Templates(directory="templates")

  @staticmethod
  def get_admin():
    return mongo_controller.getInstance().get_admin()

  @staticmethod
  async def authenticate_user(username: str, password: str):
    user = await mongo_controller.getInstance().get_user(username)
    if not user or not CONSTANTS.S_AUTH_PWD_CONTEXT.verify(password, user["password"]):
      return None
    return user

  @staticmethod
  def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=6))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)

  @staticmethod
  async def get_current_user(request_or_token: Request | str):
    token = None

    if isinstance(request_or_token, Request):
      token = request_or_token.cookies.get("access_token")

      if not token:
        auth_header = request_or_token.headers.get("Authorization")
        if auth_header:
          if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):].strip()

    else:
      token = request_or_token.strip()

      if token.startswith("Bearer "):
        token = token[len("Bearer "):].strip()

    if not token:
      raise HTTPException(status_code=401, detail="Not authenticated")

    try:
      payload = jwt.decode(token, CONSTANTS.S_AUTH_SECRET_KEY, algorithms=[CONSTANTS.S_AUTH_ALGORITHM])
      username: str = payload.get("sub")
      if not username:
        raise HTTPException(status_code=401, detail="Invalid token")

      return await mongo_controller.getInstance().get_user(username)

    except ExpiredSignatureError:
      raise HTTPException(status_code=401, detail="Token expired. Please log in again.")
    except DecodeError:
      raise HTTPException(status_code=401, detail="Invalid token")

  @staticmethod
  async def get_current_role(request_or_token: Request | str) -> str:
      user = await session_manager.get_instance().get_current_user(request_or_token)
      if not user or "role" not in user:
          raise HTTPException(status_code=403, detail="Role not found or unauthorized")
      return user["role"]

  @staticmethod
  async def get_current_username(request_or_token: Request | str) -> str:
    user = await session_manager.get_instance().get_current_user(request_or_token)
    if not user or "username" not in user:
      raise HTTPException(status_code=403, detail="User not found or unauthorized")
    return user["username"]

  @staticmethod
  async def logout_user():
    response = RedirectResponse(url="/login", status_code=303)
    response.set_cookie(
      key="access_token",
      value="",
      expires=0,
      path="/"
    )
    return response