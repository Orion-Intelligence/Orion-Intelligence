from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional

from odmantic import Field, Model
from pydantic import BaseModel


class TakedownRequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DENIED = "denied"
    FAILED = "failed"


class db_takedown_request_model(Model):
    tenant_uuid: str = ""
    requester_tenant_uuid: str = ""
    user_uuid: str = ""
    username: str = ""

    report_id: str = ""
    target_url: str = ""
    target_domain: str = ""
    abuse_email: str = ""

    status: TakedownRequestStatus = TakedownRequestStatus.PENDING
    evidence: Dict[str, Any] = Field(default_factory=dict)
    dispatch_response: Dict[str, Any] = Field(default_factory=dict)
    denial_reason: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    decided_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None

    model_config = {"collection": "takedown_requests"}


class TakedownCreateRequest(BaseModel):
    report_id: str = ""
    target_url: str


class TakedownDecisionRequest(BaseModel):
    reason: Optional[str] = None


class TakedownListResponse(BaseModel):
    items: list[dict[str, Any]]
    page: int
    limit: int
    total: int
