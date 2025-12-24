from typing import Optional, List

from pydantic import BaseModel, Field


class credential_model(BaseModel):
  username: Optional[str] = None
  file: Optional[str] = None
  password: Optional[str] = None
  link: Optional[List[str]] = None
  source: Optional[int] = None
  group: Optional[int] = None

  model_config = {"extra": "allow"}


class credential_data_model(BaseModel):
  m_credential_data: List[credential_model] = Field(default_factory=list)
