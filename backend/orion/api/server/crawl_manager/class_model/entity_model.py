from typing import List, Optional

from pydantic import BaseModel


class entity_model(BaseModel):
    m_family: Optional[List[str]] = None
    m_family_ids: Optional[List[str]] = None

    model_config = {"extra": "allow"}
