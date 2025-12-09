from typing import Optional, Dict, List, Annotated
from pydantic import BaseModel, Field, StringConstraints


class search_social_param_model(BaseModel):
    q: Optional[str] = ""
    page: Optional[int] = 1
    content: Optional[str] = "all"
    category: Optional[str] = "all"
    network: str = "all"
    matchtype: Optional[str] = "or"
    platform: Optional[str] = ""
    must: Optional[bool] = False

    daterange: Annotated[str,
        StringConstraints(pattern=r"^$|^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")
    ] = ""
    entity_filter: Optional[Dict[str, List[str]]] = Field(
        default=None,
        examples=[{"m_country": ["pakistan"]}]
    )
