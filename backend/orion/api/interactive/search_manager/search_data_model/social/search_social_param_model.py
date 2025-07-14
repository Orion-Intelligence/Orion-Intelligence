from typing import Optional

from pydantic import BaseModel, Field


class search_social_param_model(BaseModel):
    q: Optional[str] = Field("", max_length=150)
    mSearchParamPage: Optional[int] = 1
    mContentType: Optional[str] = "all"
    ctype: Optional[str] = "all"
    mDateRange: Optional[str] = ""
    mEntity: Optional[str] = ""
    mPlatform: Optional[str] = ""
    mMitreTtp: Optional[str] = ""
