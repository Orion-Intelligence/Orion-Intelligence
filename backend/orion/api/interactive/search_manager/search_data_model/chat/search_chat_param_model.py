from typing import Optional

from pydantic import BaseModel, Field


class search_chat_param_model(BaseModel):
    q: Optional[str] = Field("", max_length=150)
    mSearchParamPage: Optional[int] = 1
    mContentType: Optional[str] = "all"
    mDateRange: Optional[str] = ""
    mEntity: Optional[str] = ""
    mMitreTtp: Optional[str] = ""
