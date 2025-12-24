from datetime import datetime, timezone

from odmantic import Model, Field


class db_audit_log(Model):
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tenant_id: str
    actor_id: str
    event: str
