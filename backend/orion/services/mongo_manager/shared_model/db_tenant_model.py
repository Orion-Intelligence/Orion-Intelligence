from enum import Enum
from typing import List
from odmantic import Model, EmbeddedModel
from pydantic import BaseModel


class IocCategory(EmbeddedModel):
    ioc_id: str
    name: str
    values: List[str]

    def __str__(self):
        return f"{self.name} ({len(self.values)} values)"


class TenantStatus(str, Enum):
    ONBOARDING = "onboarding"
    ACTIVE = "active"
    DISABLE = "disable"


class db_tenant_model(Model):
    iocs: List[IocCategory] = []
    companyName: str
    phone: str = ""
    country: str = ""
    city: str = ""
    postal_code: str = ""
    verified:bool = False
    user_quota: int = 0
    status: TenantStatus = TenantStatus.DISABLE
    licenses: List[str] = []


class TenantRequest(BaseModel):
    id: str = "-1"
    iocs: List[IocCategory] = []
    companyName: str
    phone: str = ""
    country: str = ""
    city: str = ""
    postal_code: str = ""
    verified:bool = None
    user_quota: int = 0
    status: TenantStatus = TenantStatus.DISABLE
    licenses: List[str] = []
