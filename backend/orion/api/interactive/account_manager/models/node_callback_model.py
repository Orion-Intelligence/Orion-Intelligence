from typing import List
from orion.services.mongo_manager.shared_model.db_alert_model import AlertModel
from pydantic import BaseModel, Field


class UserDataModel(BaseModel):
    email: str
    twofa_enabled: bool


class TenantDataModel(BaseModel):
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


class NodeCallbackModel(BaseModel):
    user: UserDataModel
    tenant: TenantDataModel
    alerts: List[AlertModel] = Field(default_factory=list)
