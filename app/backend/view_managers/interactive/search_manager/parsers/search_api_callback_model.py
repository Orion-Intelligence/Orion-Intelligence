from typing import List, Optional, Union
from pydantic import BaseModel, HttpUrl
from datetime import datetime

class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[str]

class result_item(BaseModel):
    m_title: str
    m_url: Optional[HttpUrl]  # Some URLs might be missing
    m_base_url: Optional[HttpUrl]
    m_content: str
    m_important_content: str
    m_weblink: List[HttpUrl] = []  # Default to empty list
    m_dumplink: List[str] = []  # Default to empty list
    m_content_type: Union[str, List[str]]  # Convert list to string before passing
    m_extra_tags: List[str] = []  # Default to empty list
    m_contact_link: Optional[HttpUrl] = None  # Make optional
    m_update_date: datetime
    m_hash: str
    m_creation_date: datetime

class search_api_callback_model(BaseModel):
    Result: List[result_item]
    Suggestions: List[suggestion]
    Page_Count: float