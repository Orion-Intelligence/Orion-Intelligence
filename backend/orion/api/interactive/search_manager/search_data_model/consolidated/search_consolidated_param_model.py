from typing import Optional, List, Dict, Annotated
import json

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


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
    family: Optional[str] = "all"
    m_country: Optional[str] = "all"
    content_type: Optional[str] = "all"
    m_reporter: Optional[str] = "all"
    attacker: Optional[str] = ""
    team: Optional[str] = ""
    platform: Optional[str] = ""
    url: Optional[str] = ""
    user: Optional[str] = ""
    ioc: Optional[str] = ""
    platform_result_count: Optional[int] = 15
    sort_latest: Optional[bool] = False
    daterange: Annotated[str, StringConstraints(pattern=r"^$|^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")] = ""
    entity_filter: Optional[Dict[str, List[str]]] = Field(
        default=None, examples=[{"m_country": ["pakistan"]}])

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="before")
    @classmethod
    def parse_entity_filter(cls, values):
        if not isinstance(values, dict):
            return values
        raw = values.get("entity_filter")
        if isinstance(raw, str):
            try:
                values["entity_filter"] = json.loads(raw)
            except json.JSONDecodeError:
                values["entity_filter"] = {}
        return values
