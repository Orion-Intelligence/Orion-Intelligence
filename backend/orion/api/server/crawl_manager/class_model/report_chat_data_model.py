from pydantic import BaseModel


class ReportChatRequest(BaseModel):
    session_id: str = ""
    message: str
    report: str = ""
    tool: str = "default"
    type: str = "default"


class NexusTextAnalysisRequest(BaseModel):
    text: str
    job_id: str = ""
