from typing import Optional

from pydantic import BaseModel


class search_consolidated_param_model(BaseModel):
    q: Optional[str] = ""
    mSearchParamType: Optional[str] = "all"
    mSearchParamPage: Optional[int] = 1
    mSearchParamSafeSearch: bool = False
    mNetwork: str = "all"
    mDateRange: Optional[str] = ""
    mContentType: Optional[str] = "all"
    mEntity: Optional[str] = ""
    mMitreTtp: Optional[str] = ""
    mAttacker: Optional[str] = ""
    mTeam: Optional[str] = ""
    mPlatform: Optional[str] = ""
