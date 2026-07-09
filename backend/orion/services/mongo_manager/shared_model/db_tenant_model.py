from __future__ import annotations

import re
from enum import Enum
from typing import List, Optional

from odmantic import Model, EmbeddedModel
from pydantic import BaseModel, field_validator, model_validator


ALERT_RUN_TIME_PATTERN = r"^([01]\d|2[0-3]):[0-5]\d$"


def normalize_alert_run_time(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None

    if not re.match(ALERT_RUN_TIME_PATTERN, value):
        raise ValueError("alert_run_time must be in HH:mm 24-hour format")
    return value


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
    alerts_visible_to_admin: bool = True
    alert_run_time: Optional[str] = None
    accounts_mail_password: Optional[str] = None
    accounts_mail: Optional[str] = None
    accounts_smtp_server: Optional[str] = None
    accounts_smtp_port: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def validate_all(cls, values):
        return values

    @field_validator("alert_run_time", mode="before")
    @classmethod
    def validate_alert_run_time(cls, value):
        return normalize_alert_run_time(value)

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
    alerts_visible_to_admin: Optional[bool] = None
    alert_run_time: Optional[str] = None
    password_reset_required: Optional[bool] = None
    accounts_mail_password: Optional[str] = None
    accounts_mail: Optional[str] = None
    accounts_smtp_server: Optional[str] = None
    accounts_smtp_port: Optional[str] = None

    @field_validator("alert_run_time", mode="before")
    @classmethod
    def validate_alert_run_time(cls, value):
        return normalize_alert_run_time(value)
