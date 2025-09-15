from typing import List, Optional

from pydantic import BaseModel
from pydantic.v1 import Extra


class GeneralDataModel(BaseModel):
    m_base_url: str
    m_url: str
    m_network: str
    m_title: str
    m_meta_description: str
    m_content: str
    m_important_content: str
    m_images: List[str]
    m_sub_url: List[str]
    m_document: List[str]
    m_video: List[str]
    m_archive_url: List[str]
    m_validity_score: int
    m_meta_keywords: str
    m_content_type: Optional[List[str]] = None
    m_clearnet_links: List[str]
    m_embedding:List[float] = []

    class Config:
        extra = Extra.allow
