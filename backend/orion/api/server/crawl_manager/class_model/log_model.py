from typing import List, Optional
from pydantic import BaseModel

class LogModel(BaseModel):
    url: List[str] = []
    email: List[str] = []
    username: List[str] = []
    domain: List[str] = []
    ip: Optional[str] = None
    ioc: List[str] = []
    type: Optional[str] = None
    password: Optional[str] = None

class LogBatchModel(BaseModel):
    logs: List[LogModel]
