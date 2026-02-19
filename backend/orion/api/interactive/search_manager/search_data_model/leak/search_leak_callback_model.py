from typing import List, Optional, Union

from pydantic import BaseModel
from pydantic.v1 import Extra

from orion.api.interactive.graph_manager.graph_models.search_social_callback_model import suggestion


class result_item(BaseModel):
    m_crypto_addresses: List[str] = []
    m_attacker: Optional[List[str]] = None
    m_ref_html: Optional[str] = None
    m_title: Optional[str] = None
    m_url: Optional[str] = None
    m_base_url: Optional[str] = None
    m_content: Optional[str] = None
    m_important_content: Optional[str] = ""
    m_network: Optional[str] = None
    m_content_type: Optional[Union[str, List[str]]] = None
    m_weblink: Optional[List[str]] = None
    m_dumplink: Optional[List[str]] = None
    m_name: Optional[str] = None
    m_email: Optional[List[str]] = None
    m_industry: Optional[str] = None
    m_phone_numbers: Optional[List[str]] = None
    m_addresses: Optional[List[str]] = None
    m_social_media_profiles: Optional[List[str]] = None
    m_websites: Optional[List[str]] = None
    m_company_name: Optional[str] = None
    m_logo_or_images: Optional[List[str]] = None
    m_leak_date: Optional[str] = None
    m_data_size: Optional[str] = None
    m_country_name: Optional[str] = None
    m_revenue: Optional[str] = None
    m_hash: Optional[str] = None
    m_update_date: Optional[str] = None
    m_contact_link: Optional[str] = None
    m_creation_date: Optional[str] = None
    m_highlighted: Optional[str] = ""

    class Config:
        extra = Extra.allow


class search_leak_callback_model(BaseModel):
    Result: Optional[List[result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
