from __future__ import annotations

from datetime import datetime
from typing import Optional

from odmantic import EmbeddedModel, Field, Model


class osint_feeder(EmbeddedModel):
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    index_date: Optional[datetime] = None
    index_status: Optional[bool] = None
    last_failure_date: Optional[datetime] = None
    last_failure_message: Optional[str] = None
    last_success_date: Optional[datetime] = None
    last_success_message: Optional[str] = None

class db_feeder_script_model(Model):
    name: str
    url: Optional[str] = None
    rule_key: Optional[str] = None
    entry_kind: Optional[str] = None
    values: list[dict] = Field(default_factory=list)
    feeder: osint_feeder
