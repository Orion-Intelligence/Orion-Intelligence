from typing import Optional
from pydantic import BaseModel, Field

class search_chat_param_model(BaseModel):
    q: Optional[str] = ""
    page: Optional[int] = 1
    content: Optional[str] = "all"
    category: Optional[str] = "all"
    must: Optional[str] = False
    matchtype: Optional[str] = "or"
    daterange: Optional[str] = ""
    entity: Optional[str] = ""
    mitre: Optional[str] = ""
