import re
from typing import Optional

from pydantic import BaseModel, Field


class search_credential_param_model(BaseModel):
    q: Optional[str] = Field(None, max_length=150)
    mDateRange: Optional[str] = ""
