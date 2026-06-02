from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field


class ChatHistoryMessageModel(BaseModel):
    sender: Literal["user", "bot", "error"]
    user_name: str = ""
    text: str
    time: str


class chat_history_model(BaseModel):
    session_id: str = "default"
    chat_history: List[ChatHistoryMessageModel] = Field(default_factory=list)


class CreateChatShareRequest(BaseModel):
    expiresInHours: int = Field(default=168, ge=1, le=720)
    messages: List[ChatHistoryMessageModel] = Field(default_factory=list)


class ChatShareResponse(BaseModel):
    shareId: str
    token: str
    path: str
    expiresAt: datetime
