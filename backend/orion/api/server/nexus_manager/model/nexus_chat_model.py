from typing import Literal

from pydantic import BaseModel, Field, field_validator


MAX_CHAT_MESSAGE_LENGTH = 500


class ReportChatRequest(BaseModel):
    session_id: str = ""
    session_type: Literal["persistent", "temporary"] = "persistent"
    request_id: str = ""
    message: str = Field(min_length=1, max_length=MAX_CHAT_MESSAGE_LENGTH)
    report: str = ""
    tool: str = "open_chat"
    type: str = "default"

    @field_validator("message", mode="before")
    @classmethod
    def strip_message(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class NexusTextAnalysisRequest(BaseModel):
    text: str
    job_id: str = ""
