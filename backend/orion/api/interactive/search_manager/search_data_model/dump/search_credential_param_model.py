import re
from typing import Optional

from pydantic import BaseModel, Field


class search_credential_param_model(BaseModel):
    mDateRange: Optional[str] = ""
    mURL: Optional[str] = ""
    mUser: Optional[str] = ""
    mFullSearch: Optional[bool] = False
