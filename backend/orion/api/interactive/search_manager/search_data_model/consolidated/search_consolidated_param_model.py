from typing import Optional, List, Dict
from pydantic import BaseModel, root_validator
import json


class search_consolidated_param_model(BaseModel):
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

    entity_filter: Optional[Dict[str, List[str]]] = None

    class Config:
        allow_population_by_field_name = True

    @root_validator(pre=True)
    def parse_entity_filter(cls, values):
        raw = values.get("entity_filter")
        if isinstance(raw, str):
            try:
                values["entity_filter"] = json.loads(raw)
            except json.JSONDecodeError:
                values["entity_filter"] = {}
        return values
