from pydantic import BaseModel, Field
from typing import List, Optional

class CardExtractionModel(BaseModel):
    m_location: List[str]
    m_attacker: List[str]
    m_team: str
    m_web_server: List[str]
    m_base_url: str
    m_url: str
    m_ip: List[str]
    m_date_of_leak: Optional[str] = None
    m_web_url: List[str]
    m_screenshot: Optional[str] = None
    m_mirror_links: List[str] = Field(default_factory=list)

class DefacementDataModel(BaseModel):
    cards_data: List[CardExtractionModel] = Field(default_factory=list)
    contact_link: str = ""
    base_url: str = ""
    m_network: str = "onion"
