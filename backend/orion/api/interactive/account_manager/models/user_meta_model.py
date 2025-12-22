from typing import Optional, Dict, Any
from pydantic import BaseModel
from orion.services.mongo_manager.shared_model.db_auth_models import (
    LicenseName,
    UserStatus,
    user_role,
)

class user_meta_model(BaseModel):
    username: str
    email: Optional[str] = None
    password: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    twofa_enabled: Optional[bool] = None