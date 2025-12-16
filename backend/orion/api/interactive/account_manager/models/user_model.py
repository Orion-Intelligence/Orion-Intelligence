from typing import List
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role
from pydantic import BaseModel

class user_model(BaseModel):
    username: str
    email: str
    password: str
    role: user_role
    status: UserStatus
    subscription:bool
    licenses: List[LicenseName]