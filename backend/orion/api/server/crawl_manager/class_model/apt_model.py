from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AptCardModel(BaseModel):
    m_entity_type: Optional[str] = None
    m_entity_id: Optional[str] = None
    m_source_url: Optional[str] = None
    m_title: str
    m_content: Optional[str] = None
    m_family: Optional[List[str]] = Field(default_factory=list)
    m_family_ids: Optional[List[str]] = Field(default_factory=list)
    m_aliases: Optional[List[str]] = Field(default_factory=list)
    m_references: Optional[List[str]] = Field(default_factory=list)
    m_platform: str
    m_country: Optional[str] = None
    m_name: Optional[str] = None
    m_last_updated: Optional[str] = None
    m_actor_names: Optional[List[str]] = Field(default_factory=list)
    m_os: Optional[str] = None
    m_status: Optional[List[str]] = Field(default_factory=list)
    m_published_date: Optional[str] = None
    m_organization: Optional[str] = None
    m_authors: Optional[List[str]] = Field(default_factory=list)
    m_embedding: List[float] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")


class AptDataModel(BaseModel):
    cards_data: List[AptCardModel] = Field(default_factory=list)
    contact_link: str = ""
    base_url: str = ""
