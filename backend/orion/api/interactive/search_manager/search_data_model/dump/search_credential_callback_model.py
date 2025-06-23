from typing import List, Optional
from pydantic import BaseModel
from pydantic.v1 import Extra


class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]


class credential_result_item(BaseModel):
    u: str
    l: List[str]
    s: int
    g: int
    c: Optional[str] = None

    class Config:
        extra = Extra.allow


class search_credential_callback_model(BaseModel):
    Result: Optional[List[credential_result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
