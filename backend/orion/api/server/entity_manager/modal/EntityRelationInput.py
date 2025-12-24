from typing import Optional, Dict

from pydantic import BaseModel
from pydantic import Field


class EntityRelationInput(BaseModel):
  from_type: str
  from_value: str
  to_type: str
  to_value: str
  relation_type: str
  metadata: Optional[Dict[str, str]] = Field(default_factory=dict)
