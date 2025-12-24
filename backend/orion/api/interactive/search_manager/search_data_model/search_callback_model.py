from datetime import datetime
from typing import List, Optional, Union

from pydantic import BaseModel, HttpUrl


class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[str]


class result_item(BaseModel):
    m_title: str
    m_url: Optional[HttpUrl] = None
    m_base_url: Optional[HttpUrl] = None
    m_network: Optional[str] = None
    m_meta_description: Optional[str] = None
    m_content: str
    m_important_content: str
    m_images: List[str] = []
    m_sub_url: List[str] = []
    m_document: List[str] = []
    m_video: List[str] = []
    m_archive_url: List[str] = []
    m_validity_score: Optional[int] = None
    m_meta_keywords: Optional[str] = None
    m_content_type: Union[str, List[str]]
    m_section: List[str] = []
    m_names: List[str] = []
    m_emails: List[str] = []
    m_phone_numbers: List[str] = []
    m_clearnet_links: List[str] = []
    m_update_date: datetime
    m_hash_content: Optional[str] = None
    m_hash_url: Optional[str] = None
    m_hash: Optional[str] = None
    m_creation_date: datetime
    m_sub_host: Optional[str] = None
    m_host: Optional[str] = None


class search_callback_model(BaseModel):
    Result: List[result_item]
    Suggestions: List[suggestion]
    Page_Count: float
