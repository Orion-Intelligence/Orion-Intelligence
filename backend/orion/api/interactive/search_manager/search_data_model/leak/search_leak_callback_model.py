from typing import List, Optional, Union
from pydantic import BaseModel, HttpUrl
from datetime import datetime

class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]

class result_item(BaseModel):
    m_title: str
    m_url: Optional[HttpUrl] = None
    m_base_url: Optional[HttpUrl] = None
    m_content: str
    m_important_content: str
    m_network: Optional[str] = None
    m_content_type: Union[str, List[str]]
    m_weblink: List[HttpUrl] = []
    m_dumplink: List[HttpUrl] = []
    m_name: Optional[str] = None
    m_email_addresses: List[str] = []
    m_industry: Optional[str] = None
    m_phone_numbers: List[str] = []
    m_addresses: List[str] = []
    m_social_media_profiles: List[str] = []
    m_websites: List[str] = []
    m_company_name: Optional[str] = None
    m_logo_or_images: List[str] = []
    m_leak_date: Optional[datetime] = None
    m_data_size: Optional[str] = None
    m_country_name: Optional[str] = None
    m_revenue: Optional[str] = None
    m_hash: str
    m_update_date: datetime
    m_contact_link: Optional[HttpUrl] = None
    m_creation_date: datetime

class search_leak_callback_model(BaseModel):
    Result: List[result_item]
    Suggestions: List[suggestion]
    Page_Count: float