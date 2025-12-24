from typing import Optional, Dict, List, Annotated

from pydantic import BaseModel, Field, StringConstraints

from orion.helper_manager.helper_controller import helper_controller


class search_leak_param_model(BaseModel, helper_controller):
    q: Optional[str] = Field("")
    category: Optional[str] = "all"
    page: Optional[int] = 1
    safe: bool = False
    network: str = "all"
    matchtype: Optional[str] = "or"
    daterange: Annotated[str, StringConstraints(pattern=r"^$|^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")] = ""
    content: Optional[str] = "all"
    must: Optional[bool] = False
    entity_filter: Optional[Dict[str, List[str]]] = Field(
        default=None, examples=[{"m_country": ["pakistan"]}])

    class Config:
        populate_by_name = True


class search_news_param_model(BaseModel, helper_controller):
    q: Optional[str] = Field("")
    page: Optional[int] = 1
    safe: bool = False
    network: str = "all"
    matchtype: Optional[str] = "or"
    daterange: Annotated[str, StringConstraints(pattern=r"^$|^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")] = ""
    content: Optional[str] = "all"
    must: Optional[bool] = False
    entity_filter: Optional[Dict[str, List[str]]] = Field(
        default=None, examples=[{"m_country": ["pakistan"]}])

    class Config:
        populate_by_name = True


class search_news_internal_param_model(search_news_param_model):
    mContentType: str = "news"
    category: str = "news"
