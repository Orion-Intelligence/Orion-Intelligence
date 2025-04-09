from pydantic import BaseModel, Field
from typing import Optional

class search_defacement_param_model(BaseModel):
    q: Optional[str] = Field("", max_length=150)
    pSearchParamType: Optional[str] = "all"
    mSearchParamPage: Optional[int] = 1
    mNetwork: str = "all"
