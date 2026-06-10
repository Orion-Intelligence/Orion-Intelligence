from datetime import datetime
from typing import Dict, List, Optional, Literal

from pydantic import BaseModel, Field

from orion.services.mongo_manager.shared_model.db_alert_model import AlertModel
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role


class UserDataModel(BaseModel):
    email: str
    twofa_enabled: bool
    username: str
    role: user_role
    status: UserStatus
    subscription: bool
    verificationDate: Optional[datetime]
    password_reset_required: bool = False
    password_reset_token: Optional[str] = None
    license: List[LicenseName]
    image: Optional[str] = None
    theme: Literal["dark-theme", "light-theme"] = "dark-theme"
    preferences: Optional[Dict[str, object]] = None
    demo_tour: bool


class TenantDataModel(BaseModel):
    id: str
    name: str
    phone: str
    country: str
    city: str
    postalCode: str
    taxId: str
    hasOnboarding: bool
    isDefault: bool
    userId: str
    licenses: list[str]
    assignedQuota: str
    quotaExceeded: bool
    image: Optional[str] = None
    profileVisibilityEnabled: bool = True
    eventManagementEnabled: bool = False
    accountsMailPassword: str = ""
    accountsMail: str = ""
    accountsSmtpServer: str = ""
    accountsSmtpPort: str = ""


class NodeCallbackModel(BaseModel):
    user: UserDataModel
    tenant: TenantDataModel
    alerts: List[AlertModel] = Field(default_factory=list)
    alert_summary: Dict[str, Dict[str, int] | int] = Field(default_factory=lambda: {
        "unseen_total": 0,
        "counts_by_type": {},
        "counts_by_risk": {"critical": 0, "high": 0, "medium": 0, "low": 0},
    })
