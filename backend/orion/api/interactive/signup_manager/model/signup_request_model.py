from datetime import datetime
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role
from pydantic import BaseModel, EmailStr
from odmantic import Field
from typing import Any, Dict, List, Optional

class SignupRequest(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str

class AdminCreateTenantUserRequest(BaseModel):
    username: str = Field(unique=True)
    password: str
    email: str = Field(default="")
    role: user_role = Field(default=user_role.DEMO)
    status: Optional[UserStatus] = Field(default=None)

    account_verify_at: Optional[datetime] = Field(default=None)
    subscription: bool = Field(default=False)
    licenses: List[LicenseName] = Field(default=[LicenseName.FREE])
    