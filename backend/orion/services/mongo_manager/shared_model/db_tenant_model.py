from __future__ import annotations

from enum import Enum
from typing import List, Optional

from odmantic import Model, EmbeddedModel
from pydantic import BaseModel, model_validator


class IocCategory(EmbeddedModel):
    ioc_id: str
    name: Optional[str] = ""
    values: List[str] = []

class TenantStatus(str, Enum):
    ONBOARDING = "onboarding"
    ACTIVE = "active"
    DISABLE = "disable"

class db_tenant_model(Model):
    iocs: List[IocCategory] = []
    name: str
    phone: str = ""
    country: str = ""
    subscription: bool = False
    city: str = ""
    is_default: bool = False
    postal_code: str = ""
    verified: bool = False
    user_quota: int = 0
    status: TenantStatus = TenantStatus.DISABLE
    licenses: List[str] = []
    email: Optional[str] = ""
    profile_visibility_enabled: bool = True
    event_management_enabled: bool = False

    @model_validator(mode="before")
    @classmethod
    def validate_all(cls, values):
        return values

class TenantRequest(BaseModel):
    id: str = "-1"
    iocs: List[IocCategory] = []
    name: str
    phone: str = ""
    country: str = ""
    subscription: bool = False
    city: str = ""
    postal_code: str = ""
    verified: Optional[bool] = None
    user_quota: Optional[int] = None
    status: Optional[TenantStatus] = None
    licenses: List[str] = []
    profile_visibility_enabled: Optional[bool] = None
    event_management_enabled: Optional[bool] = None
    password_reset_required: Optional[bool] = None
