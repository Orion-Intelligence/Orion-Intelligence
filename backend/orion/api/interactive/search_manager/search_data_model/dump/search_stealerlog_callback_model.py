from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]


class stealerlog_result_item(BaseModel):
    _id: Optional[str] = None
    type: Optional[str] = None
    raw: Optional[str] = None
    channel: Optional[str] = None
    file: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class search_stealerlog_callback_model(BaseModel):
    Result: Optional[List[stealerlog_result_item]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None

    model_config = ConfigDict(extra="allow")
