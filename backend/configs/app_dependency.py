from fastapi import Depends, HTTPException, status, Request
from orion.helper_manager.env_handler import env_handler
from orion.services.session_manager.session_manager import session_manager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role


async def get_token_from_header(request: Request) -> str:
  auth_header = request.headers.get("Authorization")
  if not auth_header or not auth_header.startswith("Bearer "):
    raise HTTPException(status_code=401, detail="Missing or invalid token")

  user_token = auth_header[len("Bearer "):].strip()
  return user_token


async def get_current_role(user_token: str = Depends(get_token_from_header)):
  auth = env_handler.get_instance().env("AUTH")

  if auth == "0":
    return user_role.DEMO

  role = await session_manager.get_instance().get_current_role(user_token)
  if role is None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")

  return role


def role_required(required_roles: list[user_role]):
  async def verify_role(role: user_role = Depends(get_current_role)):
    if role not in required_roles:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")
    return role

  return verify_role
