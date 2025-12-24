from typing import Optional

from pydantic import BaseModel, Field


class audit_log_param_model(BaseModel):
  page: int = Field(1, ge=1)
  daterange: Optional[str] = None
