from pydantic import BaseModel, Field
from typing import Optional

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

GENERIC_AGGREGATION_MAPPING = {
    "Document Count": "document_count",
    "Most Recent": "most_recent",
    "Oldest Update": "oldest_update",
    "Updated 5 Days ago": "updated_5_days_ago",
    "Updated 9 Days ago": "updated_9_days_ago",
    "Average Score": "average_score",
    "URL/Document": "url_document_count",
    "Archive/Document": "archive_document_count",
    "Email/Document": "email_document_count",
    "Phone/Document": "phone_document_count",
    "Clearnet/Document": "clearnet_document_count",
    "Common Type": "common_types",
}

LEAK_AGGREGATION_MAPPING = {
    "Document Count": "document_count",
    "Most Recent": "most_recent",
    "Oldest Update": "oldest_update",
    "Updated 5 Days ago": "updated_5_days_ago",
    "Updated 9 Days ago": "updated_9_days_ago",
    "Unique Base URLs": "unique_base_urls",
    "URL/Documents": "url_document_count",
    "Dumps/Document": "dumps_document_count",
}

DEFACEMENT_AGGREGATION_MAPPING = {
    "Document Count": "document_count",
    "Most Recent": "most_recent",
    "Oldest Update": "oldest_update",
    "Updated 5 Days ago": "updated_5_days_ago",
    "Updated 9 Days ago": "updated_9_days_ago",
    "Top Team": "top_team",
    "Common Server": "common_server",
    "Unique Base URLs": "unique_base_urls",
}