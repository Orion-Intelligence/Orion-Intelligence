from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

class telegram_chat_model(BaseModel):
    m_content: Optional[str] = None
    m_caption: Optional[str] = None
    m_message_date: Optional[date] = None
    m_time: Optional[str] = None
    m_message_id: Optional[str] = None
    m_message_sharable_link: Optional[str] = None
    m_channel_id: Optional[str] = None
    m_views: Optional[str] = None
    m_file_name: Optional[List[str]] = None
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

    model_config = {
        "extra": "allow"
    }

class chat_data_model(BaseModel):
    m_chat_data: List[telegram_chat_model] = Field(default_factory=list)
    m_network: str = "telegram"
    m_channel_name:str = None
    m_source_channel_url: Optional[str] = None
