from typing import List, Optional

from pydantic import BaseModel, Field


class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]


class result_item(BaseModel):
    m_location: Optional[List[str]] = None
    m_attacker: Optional[List[str]] = None
    m_team: Optional[str] = None
    m_hash: Optional[str] = None
    m_web_server: Optional[List[str]] = None
    m_ioc_type: Optional[List[str]] = None
    m_base_url: Optional[str] = None
    m_url: Optional[str] = None
    m_ip: Optional[List[str]] = None
    m_leak_date: Optional[str] = None
    m_source_url: Optional[List[str]] = None
    m_screenshot: Optional[str] = None
    m_mirror_links: Optional[List[str]] = Field(default_factory=list)


class search_defacement_callback_model(BaseModel):
    Result: Optional[List[result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
