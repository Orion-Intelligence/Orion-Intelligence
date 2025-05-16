from pydantic import BaseModel
from typing import Optional

class entity_model(BaseModel):
    m_password: Optional[str] = None
    model_config = {
        "extra": "allow"
    }
