from pydantic import BaseModel, Field


class ReportChatRequest(BaseModel):
    session_id: str = ""
    message: str
    report: str = ""
    tool: str = "open_chat"
    type: str = "default"
    history: list[dict[str, str]] = Field(default_factory=list)


class NexusTextAnalysisRequest(BaseModel):
    text: str
    job_id: str = ""
