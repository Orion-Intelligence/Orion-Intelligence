from typing import List, Optional, Union
from pydantic import BaseModel, HttpUrl
from datetime import datetime

class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]

class result_item(BaseModel):
    m_title: Optional[str] = None
    m_url: Optional[HttpUrl] = None
    m_base_url: Optional[HttpUrl] = None
    m_content: Optional[str] = None
    m_important_content: Optional[str] = None
    m_network: Optional[str] = None
    m_content_type: Optional[Union[str, List[str]]] = None
    m_weblink: Optional[List[HttpUrl]] = None
    m_dumplink: Optional[List[HttpUrl]] = None
    m_name: Optional[str] = None
    m_email_addresses: Optional[List[str]] = None
    m_industry: Optional[str] = None
    m_phone_numbers: Optional[List[str]] = None
    m_addresses: Optional[List[str]] = None
    m_social_media_profiles: Optional[List[str]] = None
    m_websites: Optional[List[str]] = None
    m_company_name: Optional[str] = None
    m_logo_or_images: Optional[List[str]] = None
    m_leak_date: Optional[datetime] = None
    m_data_size: Optional[str] = None
    m_country_name: Optional[str] = None
    m_revenue: Optional[str] = None
    m_hash: Optional[str] = None
    m_update_date: Optional[datetime] = None
    m_contact_link: Optional[HttpUrl] = None
    m_creation_date: Optional[datetime] = None

class search_leak_callback_model(BaseModel):
    Result: Optional[List[result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
