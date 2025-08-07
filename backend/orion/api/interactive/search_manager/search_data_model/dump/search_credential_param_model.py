from typing import Optional
from pydantic import BaseModel


class search_credential_param_model(BaseModel):
    daterange: Optional[str] = ""
    url: Optional[str] = ""
    user: Optional[str] = ""
    fullsearch: Optional[bool] = False
