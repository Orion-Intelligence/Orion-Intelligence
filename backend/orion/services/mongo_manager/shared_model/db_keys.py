# orion/services/mongo_manager/shared_model/db_tenant_key.py
from datetime import datetime

from odmantic import Model, Field


class db_keys(Model):
    auth_id: str = Field(index=True)
    wrapped_key: str
    created_at: datetime
    updated_at: datetime
