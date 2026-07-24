from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Any, Dict

from odmantic import Field, Model


class AlertConnectorProvider(str, Enum):
    SLACK = "slack"
    JIRA = "jira"


class AlertConnectorType(str, Enum):
    APP = "app"
    TENANT = "tenant"


class db_alert_connector_model(Model):
    connector_type: AlertConnectorType = Field(index=True)
    provider: AlertConnectorProvider = Field(index=True)
    tenant_id: str = Field(default="", index=True)
    enabled: bool = Field(default=False)
    data: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = {"collection": "alert_connectors"}
