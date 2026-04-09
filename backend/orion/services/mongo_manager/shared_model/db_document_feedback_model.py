from datetime import UTC, datetime
from enum import Enum
from typing import List, Optional

from odmantic import EmbeddedModel, Field, Model


class FeedbackTrustState(str, Enum):
    TRUST = "trust"
    UNTRUST = "untrust"


class DocumentFeedbackComment(EmbeddedModel):
    user_id: str
    username: str = ""
    tenant_id: str = ""
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class DocumentFeedbackReaction(EmbeddedModel):
    user_id: str
    username: str = ""
    tenant_id: str = ""
    recommended: bool = False
    trust_state: Optional[FeedbackTrustState] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class db_document_feedback_model(Model):
    doc_id: str = Field(unique=True, index=True)
    recommended_count: int = 0
    trust_count: int = 0
    untrust_count: int = 0
    comments: List[DocumentFeedbackComment] = Field(default_factory=list)
    reactions: List[DocumentFeedbackReaction] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    schema_version: int = 1
