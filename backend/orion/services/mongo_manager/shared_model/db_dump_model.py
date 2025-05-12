from odmantic import Model, Field
from datetime import datetime, timezone

class db_dump_record_model(Model):
    id: str = Field(primary_field=True)
    leak_url: str
    source: str
    group: str
    link: str
    parsed_status: bool
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
