from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
import jwt

from orion.constants.constant import CONSTANTS
from orion.helper_manager.env_handler import env_handler
from orion.services.mongo_manager.shared_model.db_auth_models import user_role, UserStatus
from orion.services.session_manager.session_manager import session_manager
from configs.auth_cookie import token_from_request
# from orion.api.interactive.auth_manager.rules.license_rules import LICENSE_RULES
from orion.constants import constant

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/token", auto_error=False)

PASSWORD_RESET_ALLOWED_PATHS = {"/api/get/tenant/node"}


def enforce_password_reset(user, request: Request):
    if getattr(user, "password_reset_required", False) and request.url.path not in PASSWORD_RESET_ALLOWED_PATHS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Password reset required")


def get_request_token(request: Request, token: str | None) -> str | None:
    return token_from_request(request) or token


async def get_current_role(request: Request, token: str = Depends(oauth2_scheme)):
    auth = env_handler.get_instance().env("AUTH")
    if auth == "0":
        return user_role.DEMO

    token = get_request_token(request, token)
    user = await session_manager.get_instance().get_current_user(token)
    enforce_password_reset(user, request)
    role = user.role
    try:
        _ = user_role(role)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")

    return role


async def get_current_status(request: Request, token: str = Depends(oauth2_scheme)):
    token = get_request_token(request, token)
    user = await session_manager.get_instance().get_current_user(token)
    enforce_password_reset(user, request)
    user_status = user.status
    try:
        _ = UserStatus(user_status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User access not found")

    return user_status


def role_required(required_roles: list[user_role]):
    async def verify_role(role: user_role = Depends(get_current_role)):
        if role not in required_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")
        return role

    return verify_role


async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
    session_mgr = session_manager.get_instance()
    token = get_request_token(request, token)
    user = await session_mgr.get_current_user(token)
    enforce_password_reset(user, request)
    return user


async def get_is_free_token(request: Request, token: str = Depends(oauth2_scheme)) -> bool:
    token = get_request_token(request, token)
    if not token:
        return False

    token = token.strip()
    if token.startswith("Bearer "):
        token = token[len("Bearer ") :].strip()

    try:
        payload = jwt.decode(
            token,
            CONSTANTS.S_AUTH_SECRET_KEY,
            algorithms=[CONSTANTS.S_AUTH_ALGORITHM],
            options={"verify_exp": True},
        )
    except jwt.InvalidTokenError:
        return False

    return payload.get("free") is True


def status_required(status_required: list[UserStatus], bypass_roles: Optional[list[user_role]] = None):
    async def verify_status(user_status: UserStatus = Depends(get_current_status),
            role: user_role = Depends(get_current_role), ):
        if bypass_roles and role in bypass_roles:
            return user_status

        if user_status not in status_required:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")
        return user_status

    return verify_status


def license_required(feature: str, bypass_roles: Optional[list[user_role]] = None, bypass_licenses: Optional[list[str]] = None,):
    async def checker(user=Depends(get_current_user), role: user_role = Depends(get_current_role)):
        if bypass_roles and role in bypass_roles:
            return True

        user_licenses = set(getattr(user, "licenses", []) or [])
        if bypass_licenses and user_licenses.intersection(bypass_licenses):
            return True

        permissions = get_user_permissions(user)
        if feature.startswith("module:"):
            module_name = feature.split(":", 1)[1]
            if permissions["modules"] == "all" or module_name in permissions["modules"]:
                return True
            raise HTTPException(
                403, f"No license for module: {module_name}")
        if not permissions.get(feature, False):
            raise HTTPException(
                403, f"License required: {feature}")
        return True

    return checker
def get_user_permissions(user):
    final = {"modules": set(), "cti_graph": False, "mapping": False, "scanning": False, "maintainer": False, "geo_fencing": False}

    for lic in user.licenses:
        rules = constant.license_rules.get(lic, {})
        if rules.get("modules") == "all":
            final["modules"] = "all"
        elif final["modules"] != "all":
            final["modules"].update(rules.get("modules", []))

        final["cti_graph"] |= rules.get("cti_graph", False)
        final["mapping"] |= rules.get("mapping", False)
        final["scanning"] |= rules.get("scanning", False)
        final["maintainer"] |= rules.get("maintainer", False)
        final["geo_fencing"] |= rules.get("geo_fencing", False)
    return final
