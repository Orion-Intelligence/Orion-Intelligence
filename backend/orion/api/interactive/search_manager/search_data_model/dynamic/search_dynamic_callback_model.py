from typing import List, Optional

from pydantic import BaseModel, Field


class card_data(BaseModel):
  m_attacker: Optional[str] = None
  m_crypto_addresses: Optional[str] = None
  m_ref_html: Optional[str] = None
  m_password: Optional[str] = None
  m_title: Optional[str] = None
  m_url: Optional[str] = None
  m_base_url: Optional[str] = None
  m_content: Optional[str] = None
  m_important_content: Optional[str] = None
  m_network: Optional[str] = None
  m_content_type: List[str] = Field(default_factory=list)
  m_weblink: List[str] = Field(default_factory=list)
  m_dumplink: List[str] = Field(default_factory=list)
  m_name: Optional[str] = None
  m_email: List[str] = Field(default_factory=list)
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


class breach_data(BaseModel):
  cards_data: List[card_data] = Field(default_factory=list)
  base_url: Optional[str] = Field(default="")
  m_network: Optional[str] = Field(default="")
