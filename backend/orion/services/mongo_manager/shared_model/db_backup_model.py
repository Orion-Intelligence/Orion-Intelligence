from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from odmantic import Model, Field


class BackupType(str, Enum):
    SCHEDULED = "scheduled"
    INSTANT = "instant"


class db_backup_model(Model):
    filename: str
    backup_datetime: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    backup_type: BackupType
