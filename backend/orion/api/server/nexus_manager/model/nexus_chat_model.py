from typing import Literal

from pydantic import BaseModel


class ReportChatRequest(BaseModel):
    session_id: str = ""
    session_type: Literal["persistent", "temporary"] = "persistent"
    message: str
    report: str = ""
    tool: str = "open_chat"
    type: str = "default"


class NexusTextAnalysisRequest(BaseModel):
    text: str
    job_id: str = ""
