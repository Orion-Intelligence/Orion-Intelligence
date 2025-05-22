from pydantic import BaseModel, Field
from typing import Optional

class search_chat_param_model(BaseModel):
    q: Optional[str] = Field("", max_length=150)
    mSearchParamPage: Optional[int] = 1
    pSearchParamType: Optional[str] = "all"
    pSearchParamDate:Optional[str]=""
    pSearchParamEntity:Optional[str]=""
    pSearchParamMitryTtp:Optional[str]=""

