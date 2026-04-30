from typing import Any, Dict, List, Literal

from pydantic import BaseModel, Field


class ChatHistoryMessageModel(BaseModel):
    sender: Literal["user", "bot"]
    text: str
    time: str


class chat_history_model(BaseModel):
    chat_history: List[ChatHistoryMessageModel] = Field(default_factory=list)
