
from typing import Optional, Dict, List

from pydantic import BaseModel, Field
from orion.helper_manager.helper_controller import helper_controller


class search_general_param_model(BaseModel,helper_controller):
    q: Optional[str] = Field("", max_length=150)
    category: Optional[str] = "all"
    page: Optional[int] = 1
    safe: bool = False
    must: bool = False
    network: str = "all"
    matchtype: Optional[str] = "semantic"
    daterange: Optional[str] = ""
    content: Optional[str] = "all"
    profile: bool = False
    entity: Optional[str] = ""
    entity_filter: Optional[Dict[str, List[str]]] = None

    class Config:
        populate_by_name = True
