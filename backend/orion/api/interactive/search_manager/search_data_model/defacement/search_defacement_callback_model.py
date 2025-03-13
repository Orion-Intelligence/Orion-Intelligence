from typing import List, Optional, Union
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime

class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]

class result_item(BaseModel):
    m_location: List[str]
    m_attacker: List[str]
    m_team: str
    m_web_server: List[str]
    m_base_url: str
    m_ip: List[str]
    m_leak_date: Optional[str] = None
    m_web_url: List[str]
    m_screenshot: Optional[str] = None
    m_mirror_links: List[str] = Field(default_factory=list)

class search_defacement_callback_model(BaseModel):
    Result: Optional[List[result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
