from typing import List, Optional
from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]


class result_item(BaseModel):
    m_title: Optional[str] = None
    m_sender_name: Optional[str] = None
    m_message_sharable_link: str
    m_weblink: List[str] = Field(default_factory=list)
    m_network: str
    m_content: Optional[str] = None
    m_content_type: List[str] = Field(default_factory=list)
    m_message_date: Optional[date] = None
    m_channel_url: Optional[str] = None
    m_message_id: Optional[str] = None
    m_platform: str

    model_config = ConfigDict(extra="allow")


class search_social_callback_model(BaseModel):
    Result: Optional[List[result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
