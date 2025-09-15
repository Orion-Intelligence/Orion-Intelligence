from typing import Optional

from pydantic import BaseModel


class dump_param_model(BaseModel):
    page: int = 1
    source: Optional[str] = "all"
    group: Optional[str] = "all"
    status: Optional[bool | str] = "all"
    daterange: Optional[str] = ""
    q: Optional[str] = "*"
