from __future__ import annotations

from datetime import datetime
from datetime import timezone
from typing import List
from typing import Optional

from odmantic import EmbeddedModel
from odmantic import Field
from odmantic import Model


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ChatShareMessage(EmbeddedModel):
    sender: str
    text: str
    time: str


class db_chat_share_model(Model):
    shareId: str = Field(index=True)
    tenant_uuid: str = Field(index=True)
    userId: str = Field(index=True)
    tokenHash: str
    messages: List[ChatShareMessage] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=utc_now)
    expiresAt: datetime
    revokedAt: Optional[datetime] = None

    model_config = {"collection": "chat_shares"}
