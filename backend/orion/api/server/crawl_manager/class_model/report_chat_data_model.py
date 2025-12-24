from pydantic import BaseModel


class ReportChatRequest(BaseModel):
  session_id: str
  message: str
  report: str
