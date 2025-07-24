from typing import List, Optional
from pydantic import BaseModel
from pydantic.v1 import Extra


class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]


class stealerlog_result_item(BaseModel):
    url: Optional[str] = None
    username: Optional[str] = None
    domain: Optional[str] = None
    password: Optional[str] = None
    log_hash: Optional[str] = None
    timestamp: Optional[str] = None

    class Config:
        extra = Extra.allow


class search_stealerlog_callback_model(BaseModel):
    Result: Optional[List[stealerlog_result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None

    class Config:
        extra = Extra.allow
