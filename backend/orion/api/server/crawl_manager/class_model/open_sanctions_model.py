from datetime import datetime
from pydantic import BaseModel, ConfigDict


class open_sanctions_data_model(BaseModel):
    id: str
    first_seen: datetime
    last_seen: datetime
    last_change: datetime

    model_config = ConfigDict(
        extra="allow",          # allow any other fields dynamically
        populate_by_name=True
    )