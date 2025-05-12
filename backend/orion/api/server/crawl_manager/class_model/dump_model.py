from pydantic import BaseModel
from typing import List


class DumpModel(BaseModel):
    id: str
    leak_url: List[str]
    source: str
    group: str
    link: str
