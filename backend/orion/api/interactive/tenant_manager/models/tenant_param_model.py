from typing import List
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, user_role
from pydantic import BaseModel
from enum import Enum

class UserStatus(str, Enum):
    ACTIVE = "active"
    DISABLE = "disable"

class tenant_param_model(BaseModel):
    username: str
    email: str
    status: UserStatus
    subscription:bool
    licenses: List[LicenseName] 
