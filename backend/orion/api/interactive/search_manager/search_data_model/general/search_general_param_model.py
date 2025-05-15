from pydantic import BaseModel, Field
from typing import Optional

class search_general_param_model(BaseModel):
    q: Optional[str] = Field("", max_length=150)
    pSearchParamType: Optional[str] = "all"
    mSearchParamPage: Optional[int] = 1
    mSearchParamSafeSearch: bool = False
    mNetwork: str = "all"
    mDateRange:Optional[str]=""
    mContentType:Optional[str]="all"
    mEntity:Optional[str]=""