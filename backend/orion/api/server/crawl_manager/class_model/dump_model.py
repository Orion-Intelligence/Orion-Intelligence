from typing import List

from pydantic import BaseModel


class DumpModel(BaseModel):
    id: str
    leak_url: List[str]
    source: str
    group: str
    link: str
