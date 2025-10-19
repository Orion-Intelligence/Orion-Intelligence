from typing import Optional, Dict, List

from pydantic import BaseModel, Field
from orion.helper_manager.helper_controller import helper_controller

class search_defacement_param_model(BaseModel,helper_controller):
    q: Optional[str] = Field("")
    category: Optional[str] = "all"
    page: Optional[int] = 1
    network: str = "all"
    profile: bool = False
    daterange: Optional[str] = ""
    attacker: Optional[str] = ""
    must: Optional[bool] = False
    matchtype: Optional[str] = ""
    team: Optional[str] = ""
    content: Optional[str] = ""
    entity_filter: Optional[Dict[str, List[str]]] = None

    class Config:
        populate_by_name = True
