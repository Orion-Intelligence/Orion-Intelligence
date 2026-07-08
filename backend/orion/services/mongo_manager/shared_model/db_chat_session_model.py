from __future__ import annotations

from datetime import datetime
from datetime import timezone
from typing import List

from odmantic import EmbeddedModel
from odmantic import Field
from odmantic import Model


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ChatHistoryMessage(EmbeddedModel):
    user_name: str = ""
    sender: str = ""
    time: str = ""
    text: str = ""
    m_embedding: List[float] = Field(default_factory=list)


class ChatSessionHistory(EmbeddedModel):
    messages: List[ChatHistoryMessage] = Field(default_factory=list)


class ChatSession(EmbeddedModel):
    session_id: str = "default"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    chat_history: ChatSessionHistory = Field(default_factory=ChatSessionHistory)


class db_chat_session_model(Model):
    user_id: str = Field(unique=True)
    chat_sessions: List[ChatSession] = Field(default_factory=list)

    model_config = {"collection": "chat_sessions"}
