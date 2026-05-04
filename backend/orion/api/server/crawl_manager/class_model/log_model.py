from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class LogModel(BaseModel):
    type: Optional[str] = None
    channel: Optional[str] = None
    filename: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class LogBatchModel(BaseModel):
    logs: List[LogModel]


class InjectionLogModel(BaseModel):
    raw: str = Field(..., description="Raw SIEM or security log line to ingest.")
    source: Optional[str] = Field(default=None, description="Originating system or sensor, such as `waf`, `edr`, or `vpn`.")
    event_type: Optional[str] = Field(default=None, description="Normalized event category, such as `auth_failure` or `waf_block`.")
    severity: Optional[str] = Field(default=None, description="Severity label for the event, for example `low`, `medium`, `high`, or `critical`.")
    host: Optional[str] = Field(default=None, description="Host, node, appliance, or gateway that produced the event.")
    user: Optional[str] = Field(default=None, description="Username, account, or actor associated with the event when available.")
    tags: List[str] = Field(default_factory=list, description="Optional labels used for quick grouping or filtering.")
    timestamp: Optional[str] = Field(default=None, description="Original event timestamp in ISO 8601 format.")
    ingested_at: Optional[str] = Field(default=None, description="Optional ingestion timestamp in ISO 8601 format. If omitted, the API sets it automatically.")
    hash: Optional[str] = Field(default=None, description="Optional caller-provided hash. If omitted, the API generates one from the authenticated tenant and raw log content.")

    model_config = ConfigDict(
        extra="allow",
        json_schema_extra={
            "example": {
                "raw": "Failed login attempt for admin from 10.10.0.15 targeting login-0015.security.example for admin@alerts.example",
                "source": "waf",
                "event_type": "auth_failure",
                "severity": "high",
                "host": "edge-gateway-01",
                "user": "admin",
                "tags": ["auth", "waf"],
                "timestamp": "2026-04-24T10:15:00+00:00"
            }
        },
    )


class InjectionBatchRequestModel(BaseModel):
    logs: List[InjectionLogModel] = Field(..., description="Batch of log records to ingest into the SIEM index.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "logs": [
                    {
                        "raw": "Failed login attempt for admin from 10.10.0.15 targeting login-0015.security.example for admin@alerts.example",
                        "source": "waf",
                        "event_type": "auth_failure",
                        "severity": "high",
                        "host": "edge-gateway-01",
                        "user": "admin",
                        "tags": ["auth", "waf"],
                        "timestamp": "2026-04-24T10:15:00+00:00"
                    }
                ]
            }
        },
    )


class InjectionBatchResponseModel(BaseModel):
    indexed: int = Field(..., description="Number of log records successfully upserted.")
    index: str = Field(..., description="Target Elasticsearch index name.")
    ids: List[str] = Field(..., description="Generated document ids for the ingested records.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "indexed": 2,
                "index": "siem_model",
                "ids": [
                    "1ceff28b8f1c9e3d9bb61d6f9c7f2a1d8bde8b6b469db1ce4a724ee8c70e8d8d",
                    "853e82363b8e684d5c8c6ae6f4d5bb2d1230c9bb58bc7cf56b9dfefc5659ca3d"
                ]
            }
        },
    )


class SiemSearchRequestModel(BaseModel):
    q: str = Field(..., description="Free-text SIEM search query. Matches raw log content and indexed SIEM fields.")
    from_: int = Field(default=0, alias="from", description="Starting offset for the result window.")
    size: int = Field(default=500, description="Maximum number of SIEM log records to return in one batch.")
    date_range: Optional[str] = Field(default=None, description="Optional timestamp date range in `YYYY-MM-DD,YYYY-MM-DD` format.")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "q": "admin@alerts.example login-0015.security.example 10.10.0.15 auth_failure",
                "from": 0,
                "size": 500,
                "date_range": "2026-04-01,2026-04-24"
            }
        },
    )


class SiemSearchResponseModel(BaseModel):
    cards_data: List[dict] = Field(..., description="Matched SIEM log documents for the authenticated tenant.")
    total_hits: int = Field(..., description="Total number of matching SIEM log records.")
    page_count: int = Field(..., description="Total number of pages for the requested batch size.")
    batch_size: int = Field(..., description="Batch size used for the current search request.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "cards_data": [
                    {
                        "tenant_id": "<authenticated-user-tenant-id>",
                        "event_id": "siem-event-0001",
                        "hash": "1ceff28b8f1c9e3d9bb61d6f9c7f2a1d8bde8b6b469db1ce4a724ee8c70e8d8d",
                        "raw": "Failed login attempt for admin from 10.10.0.15 targeting login-0015.security.example for admin@alerts.example",
                        "timestamp": "2026-04-24T10:15:00+00:00",
                        "ingested_at": "2026-04-24T10:15:05+00:00",
                        "source": "waf",
                        "event_type": "auth_failure",
                        "severity": "high",
                        "host": "edge-gateway-01",
                        "user": "admin",
                        "tags": ["auth", "waf"]
                    }
                ],
                "total_hits": 1,
                "page_count": 1,
                "batch_size": 500
            }
        },
    )
