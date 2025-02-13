from odmantic import Model, Field
from datetime import datetime, timezone
from typing import Optional, List


class db_url_data_model(Model):
    url: str
    content_type: List[str] = Field(default_factory=list)
    index_type: Optional[str] = "leak"
    leak_model_last_update: Optional[datetime] = None
    geneic_model_last_update: Optional[datetime] = None
    network_type: Optional[str] = "onion"
