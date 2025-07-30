from typing import Optional

from pydantic import BaseModel, Field


class search_social_param_model(BaseModel):
    q: Optional[str] = Field("", max_length=150)
    page: Optional[int] = 1
    content: Optional[str] = "all"
    category: Optional[str] = "all"
    network: str = "all"
    daterange: Optional[str] = ""
    entity: Optional[str] = ""
    platform: Optional[str] = ""
    mitre: Optional[str] = ""
    messagedate: Optional[str] = ""
