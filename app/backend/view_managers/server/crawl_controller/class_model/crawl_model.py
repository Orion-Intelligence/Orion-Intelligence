from pydantic import BaseModel
from typing import Optional

class crawl_model(BaseModel):
    m_command: Optional[str] = None
    m_data: Optional[str] = None

