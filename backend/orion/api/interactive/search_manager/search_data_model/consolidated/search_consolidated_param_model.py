from typing import List, Optional

from pydantic import BaseModel, Field
from orion.api.interactive.search_manager.search_data_model.entity_filters.entity_filter_param_model import \
    entity_filter_param_model
from orion.helper_manager.helper_controller import helper_controller


class search_consolidated_param_model(BaseModel,helper_controller):
    q: Optional[str] = ""
    mSearchParamType: Optional[str] = "all"
    mSearchParamPage: Optional[int] = 1
    mSearchParamSafeSearch: bool = False
    mNetwork: str = "all"
    mDateRange: Optional[str] = ""
    mMessageDate: Optional[str] = ""
    mContentType: Optional[str] = "all"
    mEntity: Optional[str] = ""
    mMitreTtp: Optional[str] = ""
    mAttacker: Optional[str] = ""
    mTeam: Optional[str] = ""
    mPlatform: Optional[str] = ""

    filters: Optional[List[entity_filter_param_model]] = None   
    filters_json: Optional[str] = Field(None, alias="filters_json")
    filters: Optional[List[entity_filter_param_model]] = None

    class Config:
        allow_population_by_field_name = True
