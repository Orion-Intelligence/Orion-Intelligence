from pydantic import BaseModel, Field
from typing import List, Optional

class CardExtractionModel(BaseModel):
    m_title: str = ""
    m_url: str
    m_base_url: str = ""
    m_content: str = ""
    m_important_content: str = ""
    m_network: str = "onion"
    m_content_type: List[str] = Field(default_factory=list)
    m_weblink: List[str] = Field(default_factory=list)
    m_dumplink: List[str] = Field(default_factory=list)
    m_name: str = ""
    m_email_addresses: List[str] = Field(default_factory=list)
    m_industry: Optional[str] = None
    m_phone_numbers: List[str] = Field(default_factory=list)
    m_addresses: List[str] = Field(default_factory=list)
    m_social_media_profiles: List[str] = Field(default_factory=list)
    m_websites: List[str] = Field(default_factory=list)
    m_company_name: Optional[str] = None
    m_logo_or_images: List[str] = Field(default_factory=list)
    m_leak_date: Optional[str] = None
    m_data_size: Optional[str] = None
    m_country_name: Optional[str] = None
    m_revenue: Optional[str] = None

class LeakDataModel(BaseModel):
    cards_data: List[CardExtractionModel] = Field(default_factory=list)
    contact_link: str = ""
    base_url: str = ""
    m_network: str = "onion"
