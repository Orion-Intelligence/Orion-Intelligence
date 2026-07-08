from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from odmantic import Model, Field


class db_url_data_model(Model):
    url: str
    content_type: List[str] = Field(default_factory=list)
    index_type: List[str] = Field(default_factory=list)
    leak_model_last_update: Optional[datetime] = None
    geneic_model_last_update: Optional[datetime] = None
    network_type: Optional[str] = "onion"
    name: Optional[str] = None
