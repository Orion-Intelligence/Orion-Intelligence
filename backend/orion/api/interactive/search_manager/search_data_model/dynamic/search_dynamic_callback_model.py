from typing import List, Optional
from pydantic import BaseModel, HttpUrl, Field

class card_data(BaseModel):
    m_title: Optional[str] = None
    m_url: Optional[str] = None
    m_base_url: Optional[str] = None
    m_content: Optional[str] = None
    m_important_content: Optional[str] = None
    m_network: Optional[str] = None
    m_content_type: Optional[List[str]] = Field(default_factory=list)
    m_weblink: Optional[List[str]] = Field(default_factory=list)
    m_dumplink: Optional[List[str]] = Field(default_factory=list)
    m_name: Optional[str] = None
    m_email_addresses: Optional[List[str]] = Field(default_factory=list)
    m_industry: Optional[str] = None
    m_phone_numbers: Optional[List[str]] = Field(default_factory=list)
    m_addresses: Optional[List[str]] = Field(default_factory=list)
    m_social_media_profiles: Optional[List[str]] = Field(default_factory=list)
    m_websites: Optional[List[str]] = Field(default_factory=list)
    m_company_name: Optional[str] = None
    m_logo_or_images: Optional[List[str]] = Field(default_factory=list)
    m_leak_date: Optional[str] = None
    m_data_size: Optional[str] = None
    m_country_name: Optional[str] = None
    m_revenue: Optional[str] = None
class breach_data(BaseModel):
    cards_data: List[card_data] = Field(default_factory=list)
    base_url: Optional[str] = ""
    m_network: Optional[str] = ""
