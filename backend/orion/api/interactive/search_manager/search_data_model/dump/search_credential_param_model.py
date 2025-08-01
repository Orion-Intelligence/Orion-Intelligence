import re
from typing import Optional

from pydantic import BaseModel, Field


class search_credential_param_model(BaseModel):
    daterange: Optional[str] = ""
    url: Optional[str] = ""
    user: Optional[str] = ""
    fullsearch: Optional[bool] = False
