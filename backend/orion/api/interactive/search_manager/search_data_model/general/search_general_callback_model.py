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
    m_meta_description: Optional[str] = None
    m_weblink: Optional[List[HttpUrl]] = None
    m_dumplink: Optional[List[HttpUrl]] = None
    m_sub_url: Optional[List[HttpUrl]] = None
    m_document: Optional[List[str]] = None
    m_video: Optional[List[str]] = None
    m_archive_url: Optional[List[HttpUrl]] = None
    m_images: Optional[List[str]] = None
    m_validity_score: Optional[int] = None
    m_meta_keywords: Optional[str] = None
    m_content_type: Optional[Union[str, List[str]]] = None
    m_section: Optional[List[str]] = None
    m_names: Optional[List[str]] = None
    m_emails: Optional[List[str]] = None
    m_phone_numbers: Optional[List[str]] = None
    m_clearnet_links: Optional[List[HttpUrl]] = None
    m_update_date: Optional[datetime] = None
    m_hash_content: Optional[str] = None
    m_hash_url: Optional[str] = None
    m_hash: Optional[str] = None
    m_creation_date: Optional[datetime] = None
    m_contact_link: Optional[HttpUrl] = None

class search_general_callback_model(BaseModel):
    Result: Optional[List[result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
