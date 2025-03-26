from pydantic import BaseModel, Field
from typing import Union


class MetricComparison(BaseModel):
  key: str = "-"
  value: Union[int, float, str, None] = None
  change_weekly: str = "0%"
  change_daily: str = "0%"


class GenericModelComparison(BaseModel):
  document_count: MetricComparison = Field(default_factory=MetricComparison)
  most_recent: MetricComparison = Field(default_factory=MetricComparison)
  oldest_update: MetricComparison = Field(default_factory=MetricComparison)
  updated_5_days_ago: MetricComparison = Field(default_factory=MetricComparison)
  updated_9_days_ago: MetricComparison = Field(default_factory=MetricComparison)
  average_score: MetricComparison = Field(default_factory=MetricComparison)
  url_document_count: MetricComparison = Field(default_factory=MetricComparison)
  archive_document_count: MetricComparison = Field(default_factory=MetricComparison)
  email_document_count: MetricComparison = Field(default_factory=MetricComparison)
  phone_document_count: MetricComparison = Field(default_factory=MetricComparison)
  clearnet_document_count: MetricComparison = Field(default_factory=MetricComparison)
  common_types: MetricComparison = Field(default_factory=MetricComparison)


class LeakModelComparison(BaseModel):
  document_count: MetricComparison = Field(default_factory=MetricComparison)
  url_document_count: MetricComparison = Field(default_factory=MetricComparison)
  dumps_document_count: MetricComparison = Field(default_factory=MetricComparison)
  updated_5_days_ago: MetricComparison = Field(default_factory=MetricComparison)
  updated_9_days_ago: MetricComparison = Field(default_factory=MetricComparison)
  most_recent: MetricComparison = Field(default_factory=MetricComparison)
  oldest_update: MetricComparison = Field(default_factory=MetricComparison)
  mirror_links: MetricComparison = Field(default_factory=MetricComparison)  # Query 8 (part of combined agg)


class DefacementModelComparison(BaseModel):
  document_count: MetricComparison = Field(default_factory=MetricComparison)
  most_recent: MetricComparison = Field(default_factory=MetricComparison)
  oldest_update: MetricComparison = Field(default_factory=MetricComparison)
  updated_5_days_ago: MetricComparison = Field(default_factory=MetricComparison)
  updated_9_days_ago: MetricComparison = Field(default_factory=MetricComparison)
  top_team: MetricComparison = Field(default_factory=MetricComparison)
  common_server: MetricComparison = Field(default_factory=MetricComparison)
  mirror_links: MetricComparison = Field(default_factory=MetricComparison)

class InsightComparisonModel(BaseModel):
  general: GenericModelComparison = Field(default_factory=GenericModelComparison)
  leak: LeakModelComparison = Field(default_factory=LeakModelComparison)
  defacement: DefacementModelComparison = Field(default_factory=DefacementModelComparison)
