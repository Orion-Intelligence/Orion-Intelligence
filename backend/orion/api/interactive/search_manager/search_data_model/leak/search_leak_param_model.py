from typing import Optional, Dict, List
from pydantic import BaseModel, Field
from orion.helper_manager.helper_controller import helper_controller



class search_leak_param_model(BaseModel,helper_controller):
    q: Optional[str] = Field("")
    category: Optional[str] = "all"
    page: Optional[int] = 1
    safe: bool = False
    network: str = "all"
    matchtype: Optional[str] = "or"
    daterange: Optional[str] = ""
    content: Optional[str] = "all"
    entity: Optional[str] = ""
    must: Optional[bool] = False
    entity_filter: Optional[Dict[str, List[str]]] = None

    class Config:
        allow_population_by_field_name = True
