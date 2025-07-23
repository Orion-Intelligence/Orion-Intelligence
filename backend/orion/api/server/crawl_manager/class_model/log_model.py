from typing import List, Optional
from pydantic import BaseModel

class LogModel(BaseModel):
    url: str
    username: Optional[str]
    domain: Optional[str]
    password: Optional[str]

class LogBatchModel(BaseModel):
    logs: List[LogModel]
