from __future__ import annotations

from datetime import datetime, UTC

from odmantic import Model, Field


class db_social_session_model(Model):
    user_id: str = Field(index=True)
    platform: str = Field(index=True)
    session_id: str = Field(index=True)
    file_name: str
    byte_size: int = 0
    username: str = ""
    verified: bool = False
    verify_error: str = ""
    verified_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    schema_version: int = 1
