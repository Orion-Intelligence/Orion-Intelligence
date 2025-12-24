from typing import List, Optional

from pydantic import BaseModel


class DumpModel(BaseModel):
    id: str
    leak_url: List[str]
    source: str
    group: str
    link: str
    status: Optional[bool] = False
