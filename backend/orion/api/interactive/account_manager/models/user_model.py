from typing import List, Optional

from pydantic import BaseModel, Field

from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role
from orion.services.permission_manager.permission_models import UserPermission


class user_model(BaseModel):
    username: str
    email: str
    password: str
    role: user_role
    status: UserStatus
    subscription: bool
    licenses: List[LicenseName]
    permissions: List[UserPermission] = Field(default_factory=list)
    alerts_allowed_all: bool = False
    alerts_allowed_tenant_ids: Optional[List[str]] = Field(default_factory=list)
    workspace_quota_bytes: Optional[int] = None
