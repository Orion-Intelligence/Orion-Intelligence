from typing import Optional, Dict, List
from pydantic import BaseModel

class search_chat_param_model(BaseModel):
    q: Optional[str] = ""
    page: Optional[int] = 1
    content: Optional[str] = "all"
    category: Optional[str] = "all"
    must: Optional[bool] = False
    matchtype: Optional[str] = "or"
    daterange: Optional[str] = ""
    entity_filter: Optional[Dict[str, List[str]]] = None
