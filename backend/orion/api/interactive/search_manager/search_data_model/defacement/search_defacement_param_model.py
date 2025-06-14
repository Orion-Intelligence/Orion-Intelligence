from typing import Optional

from pydantic import BaseModel, Field


class search_defacement_param_model(BaseModel):
    q: Optional[str] = Field("", max_length=150)
    pSearchParamType: Optional[str] = "all"
    mSearchParamPage: Optional[int] = 1
    mNetwork: str = "all"
    mDateRange: Optional[str] = ""
    mAttacker: Optional[str] = ""
    mTeam: Optional[str] = ""
