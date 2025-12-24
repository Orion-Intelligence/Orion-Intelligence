from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class LogModel(BaseModel):
  type: Optional[str] = None
  raw: Optional[str] = None
  channel: Optional[str] = None
  filename: Optional[str] = None

  model_config = ConfigDict(extra="allow")


class LogBatchModel(BaseModel):
  logs: List[LogModel]
