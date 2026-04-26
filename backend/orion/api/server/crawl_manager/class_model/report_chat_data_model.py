from pydantic import BaseModel


class ReportChatRequest(BaseModel):
    session_id: str = ""
    message: str
    report: str


class NexusTextAnalysisRequest(BaseModel):
    text: str
    job_id: str = ""
