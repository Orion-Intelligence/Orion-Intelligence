from datetime import datetime, timezone
from odmantic import Model, Field,Reference
from enum import Enum
from typing import List, Optional


class UserStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    PENDING = "Pending"


class SystemStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    SUSPENDED = "Suspended"


class TenantMetadata(Model):
    name: str
    email: str
    userStatus: UserStatus = Field(default=UserStatus.PENDING)
    systemStatus: SystemStatus = Field(default=SystemStatus.PENDING)
    verificationToken: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


class TenantMappings(Model):
    emails: List[str] = []
    phones: List[str] = []


class db_tenant_model(Model):
    id: str = Field(primary_field=True)

    metadata: TenantMetadata=Reference()
    mappings: TenantMappings = Reference()

