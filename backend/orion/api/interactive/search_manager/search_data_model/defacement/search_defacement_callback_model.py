from typing import List, Optional
from pydantic import BaseModel, Field

class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]

class result_item(BaseModel):
    m_location: List[str]
    m_attacker: List[str]
    m_team: str
    m_hash: str
    m_web_server: List[str]
    m_base_url: str
    m_ip: List[str]
    m_date_of_leak: Optional[str] = None
    m_web_url: List[str]
    m_screenshot: Optional[str] = None
    m_mirror_links: List[str] = Field(default_factory=list)

class search_defacement_callback_model(BaseModel):
    Result: Optional[List[result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
