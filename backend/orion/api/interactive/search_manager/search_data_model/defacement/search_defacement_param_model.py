from typing import Optional

from pydantic import BaseModel, Field
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

    class Config:
        allow_population_by_field_name = True
