from typing import List, Optional

from pydantic import BaseModel, Field
from pydantic.v1 import Extra

class CardExtractionModel(BaseModel):
    m_title: Optional[str] = ""
    m_url: Optional[str] = None
    m_screenshot: Optional[str] = None
    m_base_url: Optional[str] = ""
    m_content: Optional[str] = ""
    m_important_content: Optional[str] = ""
    m_network: Optional[str] = "onion"
    m_content_type: Optional[List[str]] = Field(default_factory=list)
    m_weblink: Optional[List[str]] = Field(default_factory=list)
    m_dumplink: Optional[List[str]] = Field(default_factory=list)
    m_name: Optional[str] = ""
    m_section: Optional[List[str]] = Field(default_factory=list)
    m_email: Optional[List[str]] = Field(default_factory=list)
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
    m_states: Optional[List[str]] = Field(default_factory=list)
    m_location: Optional[List[str]] = Field(default_factory=list)
    m_ip: Optional[List[str]] = None
    m_crypto_addresses: Optional[List[str]] = Field(default_factory=list)
    m_attacker: Optional[List[str]] = None
    m_ref_html: Optional[str] = None
    m_team: Optional[str] = None
    m_cve: Optional[List[str]] = Field(default_factory=list)
    m_cwe: Optional[List[str]] = Field(default_factory=list)

    class Config:
        extra = Extra.allow

class LeakDataModel(BaseModel):
    cards_data: List[CardExtractionModel] = Field(default_factory=list)
    contact_link: str = ""
    base_url: str = ""
    m_network: str = "onion"
