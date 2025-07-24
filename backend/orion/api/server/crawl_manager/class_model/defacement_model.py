from typing import List, Optional

from pydantic import BaseModel, Field


class CardExtractionModel(BaseModel):
    m_location: Optional[List[str]] = None
    m_attacker: Optional[List[str]] = None
    m_team: Optional[str] = None
    m_web_server: Optional[List[str]] = None
    m_base_url: Optional[str] = None
    m_url: Optional[str] = None
    m_ioc_type: Optional[List[str]] = None
    m_ip: Optional[List[str]] = None
    m_date_of_leak: Optional[str] = None
    m_source_url: Optional[List[str]] = None
    m_screenshot: Optional[str] = None
    m_mirror_links: Optional[List[str]] = Field(default_factory=list)


class DefacementDataModel(BaseModel):
    cards_data: Optional[List[CardExtractionModel]] = Field(default_factory=list)
    contact_link: Optional[str] = None
    base_url: Optional[str] = None
    m_network: Optional[str] = None
