from typing import List, Optional

from pydantic import BaseModel, Field
from orion.api.interactive.search_manager.search_data_model.entity_filters.entity_filter_param_model import \
    entity_filter_param_model
from orion.helper_manager.helper_controller import helper_controller


class search_consolidated_param_model(BaseModel,helper_controller):
    q: Optional[str] = ""
    category: Optional[str] = "all"
    page: Optional[int] = 1
    safe: bool = False
    must: bool = False
    network: str = "all"
    daterange: Optional[str] = ""
    matchtype: Optional[str] = ""
    content: Optional[str] = "all"
    entity: Optional[str] = ""
    mitre: Optional[str] = ""
    attacker: Optional[str] = ""
    team: Optional[List[str]] = []
    platform: Optional[str] = ""

    filters: Optional[List[entity_filter_param_model]] = None   
    filters_json: Optional[str] = Field(None, alias="filters_json")

    class Config:
        allow_population_by_field_name = True
