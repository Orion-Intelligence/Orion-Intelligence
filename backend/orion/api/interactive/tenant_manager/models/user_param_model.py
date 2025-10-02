from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role
from pydantic import BaseModel

class user_param_model(BaseModel):
    username: str
    email: str
    role: user_role
    status: UserStatus
    subscription:bool