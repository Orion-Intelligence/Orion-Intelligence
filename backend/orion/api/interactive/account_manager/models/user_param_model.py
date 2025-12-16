from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from enum import Enum
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName

class UserStatus(str, Enum):
    ACTIVE = "active"
    DISABLE = "disable"

class user_param_model(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    status: Optional[UserStatus] = None
    subscription: Optional[bool] = None
    licenses: Optional[List[LicenseName]] = None
    preferences: Optional[Dict[str, Any]] = None
