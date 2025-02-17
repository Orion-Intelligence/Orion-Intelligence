from fastapi import Depends, HTTPException, status
from starlette.requests import Request

from orion.helper_manager.env_handler import env_handler
from orion.services.session_manager.session_manager import session_manager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role


async def get_current_role(request: Request):
  auth = env_handler.get_instance().env("AUTH")

  if auth == "0":
    return user_role.DEMO

  role = await session_manager.get_instance().get_current_role(request)
  if role is None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")

  return role


def role_required(required_roles: list[user_role]):
  async def verify_role(role: user_role = Depends(get_current_role)):
    if role not in required_roles:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")
    return role

  return verify_role
