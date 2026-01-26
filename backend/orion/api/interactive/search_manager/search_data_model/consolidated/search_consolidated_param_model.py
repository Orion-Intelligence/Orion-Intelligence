from typing import Optional, List, Dict, Annotated
import json

from pydantic import BaseModel, root_validator, StringConstraints, Field


class search_consolidated_param_model(BaseModel):
    q: Optional[str] = ""
    category: Optional[str] = "all"
    page: Optional[int] = 1
    fullsearch: Optional[bool] = False
    safe: bool = False
    must: bool = False
    network: str = "all"
    matchtype: Optional[str] = ""
    content: Optional[str] = "all"
    attacker: Optional[str] = ""
    team: Optional[str] = ""
    platform: Optional[str] = ""
    url: Optional[str] = ""
    user: Optional[str] = ""
    ioc: Optional[str] = ""
    daterange: Annotated[str, StringConstraints(pattern=r"^$|^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")] = ""
    entity_filter: Optional[Dict[str, List[str]]] = Field(
        default=None, examples=[{"m_country": ["pakistan"]}])

    class Config:
        populate_by_name = True

    @root_validator(pre=True)
    def parse_entity_filter(cls, values):
        raw = values.get("entity_filter")
        if isinstance(raw, str):
            try:
                values["entity_filter"] = json.loads(raw)
            except json.JSONDecodeError:
                values["entity_filter"] = {}
        return values
