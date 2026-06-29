from typing import Optional

from pydantic import BaseModel, Field


class GenericModel(BaseModel):
    document_count: int = 0
    most_recent: Optional[str] = "-"
    oldest_update: Optional[str] = "-"
    updated_5_days_ago: int = 0
    updated_9_days_ago: int = 0
    average_score: float = 0.0
    url_document_count: int = 0
    archive_document_count: int = 0
    email_document_count: int = 0
    phone_document_count: int = 0
    clearnet_document_count: int = 0
    common_types: Optional[str] = "-"


class LeakModel(BaseModel):
    document_count: int = 0
    unique_base_urls: int = 0
    url_document_count: int = 0
    dumps_document_count: int = 0
    updated_5_days_ago: int = 0
    updated_9_days_ago: int = 0
    most_recent: Optional[str] = "-"
    oldest_update: Optional[str] = "-"


class DefacementModel(BaseModel):
    document_count: int = 0
    updated_5_days_ago: int = 0
    top_team: Optional[str] = "-"
    common_server: Optional[str] = "-"


class InsightData(BaseModel):
    general: GenericModel = Field(default_factory=GenericModel)
    leak: LeakModel = Field(default_factory=LeakModel)
    defacement: DefacementModel = Field(default_factory=DefacementModel)


GENERIC_AGGREGATION_MAPPING = {"Document Count": "document_count", "Most Recent": "most_recent", "Oldest Update": "oldest_update", "Updated 5 Days ago": "updated_5_days_ago", "Updated 9 Days ago": "updated_9_days_ago", "Average Score": "average_score", "Indexed URLs": "url_document_count", "Known Domains": "archive_document_count", "Languages Tagged": "email_document_count", "Organizations Tagged": "phone_document_count", "Countries Tagged": "clearnet_document_count", "Common Type": "common_types", }

LEAK_AGGREGATION_MAPPING = {"Document Count": "document_count", "Most Recent": "most_recent", "Oldest Update": "oldest_update", "Updated 5 Days ago": "updated_5_days_ago", "Updated 9 Days ago": "updated_9_days_ago", "Actor Coverage": "unique_base_urls", "Victim Records": "url_document_count", "Countries Tagged": "dumps_document_count", }

DEFACEMENT_AGGREGATION_MAPPING = {"Document Count": "document_count", "Most Recent": "most_recent", "Oldest Update": "oldest_update", "Updated 5 Days ago": "updated_5_days_ago", "Updated 9 Days ago": "updated_9_days_ago", "Top Team": "top_team", "Top Actor": "common_server", }
