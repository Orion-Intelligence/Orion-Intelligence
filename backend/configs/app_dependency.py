from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from orion.helper_manager.env_handler import env_handler
from orion.services.mongo_manager.shared_model.db_auth_models import user_role,UserStatus
from orion.services.session_manager.session_manager import session_manager

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")


async def get_current_role(token: str = Depends(oauth2_scheme)):
    auth = env_handler.get_instance().env("AUTH")
    if auth == "0":
        return user_role.DEMO

    role = await session_manager.get_instance().get_current_role(token)
    if role is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")

    return role

async def get_current_status(token: str = Depends(oauth2_scheme)):
    status = await session_manager.get_instance().get_current_status(token)
    if status is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")

    return status


def role_required(required_roles: list[user_role]):
    async def verify_role(role: user_role = Depends(get_current_role)):
        if role not in required_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")
        return role
    
    return verify_role

def status_required(status_required: list[UserStatus], bypass_roles: Optional[list[user_role]] = None):
    async def verify_status(user_status: UserStatus = Depends(get_current_status),role: user_role = Depends(get_current_role),
    ):
        if bypass_roles and role in bypass_roles:
            return user_status

        if user_status not in status_required:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")
        return user_status

    return verify_status
