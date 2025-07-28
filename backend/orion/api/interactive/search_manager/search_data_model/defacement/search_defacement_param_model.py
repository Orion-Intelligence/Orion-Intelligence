import json
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field,validator,root_validator
from orion.api.interactive.search_manager.search_data_model.entity_filters.entity_filter_param_model import \
    entity_filter_param_model
from orion.helper_manager.helper_controller import helper_controller

class search_defacement_param_model(BaseModel,helper_controller):
    q: Optional[str] = Field("", max_length=150)
    category: Optional[str] = "all"
    page: Optional[int] = 1
    network: str = "all"
    daterange: Optional[str] = ""
    attacker: Optional[str] = ""
    team: Optional[str] = ""
    content: Optional[str] = ""

    filters: Optional[List[entity_filter_param_model]] = None   
    filters_json: Optional[str] = Field(None, alias="filters_json")
    

    class Config:
        allow_population_by_field_name = True
