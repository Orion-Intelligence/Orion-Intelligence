export interface InsightMetric {
  key: string;
  value: string | number;
  change_weekly?: string;
  change_daily?: string;
}

export interface GenericModel {
  document_count: InsightMetric;
  most_recent: InsightMetric;
  oldest_update: InsightMetric;
  updated_5_days_ago: InsightMetric;
  updated_9_days_ago: InsightMetric;
  average_score: InsightMetric;
  url_document_count: InsightMetric;
  archive_document_count: InsightMetric;
  email_document_count: InsightMetric;
  phone_document_count: InsightMetric;
  clearnet_document_count: InsightMetric;
  common_types: InsightMetric;

  [key: string]: InsightMetric;
}

export interface LeakModel {
  document_count: InsightMetric;
  unique_base_urls: InsightMetric;
  url_document_count: InsightMetric;
  dumps_document_count: InsightMetric;
  updated_5_days_ago: InsightMetric;
  updated_9_days_ago: InsightMetric;
  most_recent: InsightMetric;
  oldest_update: InsightMetric;

  [key: string]: InsightMetric;
}

export interface DefacementModel {
  document_count: InsightMetric;
  most_recent: InsightMetric;
  oldest_update: InsightMetric;
  updated_5_days_ago: InsightMetric;
  updated_9_days_ago: InsightMetric;
  top_team: InsightMetric;
  common_server: InsightMetric;
  unique_base_urls: InsightMetric;

  [key: string]: InsightMetric;
}

export interface InsightCallbackModel {
  general: GenericModel;
  leak: LeakModel;
  defacement: DefacementModel;
}
