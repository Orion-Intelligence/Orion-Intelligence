from typing import List
from pydantic import BaseModel

class LogModel(BaseModel):
    logs: List[str]
