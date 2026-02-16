from datetime import datetime, UTC
from typing import Optional, List, Dict, Any

from odmantic import Model, Field


class db_social_sessions_model(Model):
    user_id: str = Field(index=True)
    active_tab_id: Optional[str] = None
    tab_counter: int = 1

    tabs: List[Dict[str, Any]] = Field(default_factory=list)

    extra: Dict[str, Any] = Field(default_factory=dict)

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    schema_version: int = 1
