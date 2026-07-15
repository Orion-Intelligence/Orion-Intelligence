from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from odmantic import Field, Model


class SchedulerRunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class SchedulerMailStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    PARTIAL = "partial"


class db_scheduler_model(Model):
    job_key: str
    scheduled_for: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: SchedulerRunStatus = SchedulerRunStatus.PENDING
    error_message: Optional[str] = None
    mail_status: SchedulerMailStatus = SchedulerMailStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"collection": "scheduler_runs"}
