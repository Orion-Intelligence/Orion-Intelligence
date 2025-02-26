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
    m_meta_description: Optional[str] = None
    m_weblink: List[HttpUrl] = []
    m_dumplink: List[HttpUrl] = []
    m_sub_url: List[HttpUrl] = []
    m_document: List[str] = []
    m_video: List[str] = []
    m_archive_url: List[HttpUrl] = []
    m_images: List[str] = []
    m_validity_score: Optional[int] = None
    m_meta_keywords: Optional[str] = None
    m_content_type: Union[str, List[str]]
    m_section: List[str] = []
    m_names: List[str] = []
    m_emails: List[str] = []
    m_phone_numbers: List[str] = []
    m_clearnet_links: List[HttpUrl] = []
    m_update_date: datetime
    m_hash_content: Optional[str] = None
    m_hash_url: Optional[str] = None
    m_hash: Optional[str] = None
    m_creation_date: datetime
    m_contact_link: Optional[HttpUrl] = None

class search_general_callback_model(BaseModel):
    Result: List[result_item]
    Suggestions: List[suggestion]
    Page_Count: float