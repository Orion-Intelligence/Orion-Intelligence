from typing import List, Optional, Union

from pydantic import BaseModel
from pydantic.v1 import Extra

from orion.api.interactive.graph_manager.graph_models.search_social_callback_model import suggestion


class result_item(BaseModel):
    m_title: Optional[str] = None
    m_url: Optional[str] = None
    m_base_url: Optional[str] = None
    m_content: Optional[str] = None
    m_important_content: Optional[str] = None
    m_network: Optional[str] = None
    m_meta_description: Optional[str] = None
    m_weblink: Optional[List[str]] = None
    m_dumplink: Optional[List[str]] = None
    m_sub_url: Optional[List[str]] = None
    m_document: Optional[List[str]] = None
    m_video: Optional[List[str]] = None
    m_archive_url: Optional[List[str]] = None
    m_images: Optional[List[str]] = None
    m_validity_score: Optional[int] = None
    m_meta_keywords: Optional[str] = None
    m_content_type: Optional[Union[str, List[str]]] = None
    m_section: Optional[List[str]] = None
    m_clearnet_links: Optional[List[str]] = None
    m_update_date: Optional[str] = None
    m_hash_content: Optional[str] = None
    m_hash_url: Optional[str] = None
    m_hash: Optional[str] = None
    m_creation_date: Optional[str] = None
    m_contact_link: Optional[str] = None
    m_highlighted: Optional[str] = None

    class Config:
        extra = Extra.allow


class search_general_callback_model(BaseModel):
    Result: Optional[List[result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
