from typing import Optional

from pydantic import BaseModel


class search_social_param_model(BaseModel):
    q: Optional[str] = ""
    page: Optional[int] = 1
    content: Optional[str] = "all"
    category: Optional[str] = "all"
    network: str = "all"
    daterange: Optional[str] = ""
    entity: Optional[str] = ""
    platform: Optional[str] = ""
    mitre: Optional[str] = ""
    messagedate: Optional[str] = ""
