# orion/services/mongo_manager/shared_model/db_tenant_key.py
from __future__ import annotations

from datetime import datetime

from odmantic import Model, Field


class db_keys(Model):
    tenant_id: str = Field(unique=True)
    wrapped_key: str
    created_at: datetime
    updated_at: datetime
