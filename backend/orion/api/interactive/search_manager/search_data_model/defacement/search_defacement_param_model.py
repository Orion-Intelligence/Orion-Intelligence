from typing import Optional, Dict, List, Annotated

from pydantic import BaseModel, Field, StringConstraints

from orion.helper_manager.helper_controller import helper_controller


class search_defacement_param_model(BaseModel, helper_controller):
    q: Optional[str] = Field("")
    category: Optional[str] = "all"
    page: Optional[int] = 1
    network: str = "all"
    daterange: Annotated[str, StringConstraints(pattern=r"^$|^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")] = ""
    must: Optional[bool] = False
    matchtype: Optional[str] = ""
    attacker: Optional[str] = ""
    team: Optional[str] = ""
    content: Optional[str] = ""
    entity_filter: Optional[Dict[str, List[str]]] = Field(
        default=None, examples=[{"m_country": ["pakistan"]}])

    class Config:
        populate_by_name = True
