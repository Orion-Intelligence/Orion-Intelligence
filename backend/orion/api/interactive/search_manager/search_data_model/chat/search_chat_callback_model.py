from typing import List, Optional

from pydantic import BaseModel, Field
from pydantic.v1 import Extra


class suggestion(BaseModel):
  text: str
  offset: int
  length: int
  options: List[dict]


class result_item(BaseModel):
  m_content: Optional[str] = None
  m_caption: Optional[str] = None
  m_message_date: Optional[str] = None
  m_time: Optional[str] = None
  m_message_id: Optional[str] = None
  m_message_sharable_link: Optional[str] = None
  m_channel_id: Optional[str] = None
  m_views: Optional[str] = None
  m_file_name: Optional[List[str]] = Field(default_factory=list)
  m_file_size: Optional[str] = None
  m_forwarded_from: Optional[str] = None
  m_sender_name: Optional[str] = None
  m_sender_username: Optional[str] = None
  m_channel_url: Optional[str] = None
  m_message_type: Optional[List[str]] = None
  m_media_url: Optional[str] = None
  m_media_caption: Optional[str] = None
  m_reply_to_message_id: Optional[str] = None
  m_message_status: Optional[str] = None
  m_file_saved_as: Optional[str] = None
  m_file_path: Optional[List[str]] = None
  m_channel_name: Optional[str] = None
  m_weblink: Optional[List[str]] = Field(default_factory=list)
  m_users: Optional[List[str]] = None
  m_ref_html: Optional[str] = None
  m_hashtags: Optional[List[str]] = None
  m_content_type: Optional[List[str]] = None

  class Config:
    extra = Extra.allow


class search_chat_callback_model(BaseModel):
  Result: Optional[List[result_item]] = None
  Suggestions: Optional[List[suggestion]] = None
  Page_Count: Optional[float] = None
