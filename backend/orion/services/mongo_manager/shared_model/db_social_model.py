from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Dict, List

from odmantic import Field, Model


class db_social_model(Model):
    user_id: str = Field(index=True)
    profile_username: str = Field(index=True)
    profiles: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = {"collection": "social"}
