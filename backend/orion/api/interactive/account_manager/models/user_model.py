from typing import List

from pydantic import BaseModel

from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role


class user_model(BaseModel):
    username: str
    email: str
    password: str
    role: user_role
    status: UserStatus
    subscription: bool
    licenses: List[LicenseName]
