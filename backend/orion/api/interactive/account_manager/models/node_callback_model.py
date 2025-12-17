from datetime import datetime
from typing import List, Optional
from orion.services.mongo_manager.shared_model.db_alert_model import AlertModel
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role
from pydantic import BaseModel, Field


class UserDataModel(BaseModel):
    email: str
    twofa_enabled: bool
    username: str
    role: user_role
    status: UserStatus
    hasOnboarding: bool
    subscription: bool
    verificationDate: Optional[datetime]
    license: List[LicenseName]
    image: Optional[str] = None


class TenantDataModel(BaseModel):
    id: str
    name: str
    phone: str
    country: str
    city: str
    postalCode: str
    taxId: str
    userId: str
    licenses: list[str]
    assignedQuota: str
    quotaExceeded: bool
    image: Optional[str] = None


class NodeCallbackModel(BaseModel):
    user: UserDataModel
    tenant: TenantDataModel
    alerts: List[AlertModel] = Field(default_factory=list)
