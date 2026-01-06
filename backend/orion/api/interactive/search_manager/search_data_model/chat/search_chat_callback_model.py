from typing import List, Optional

from pydantic import BaseModel, Field
from pydantic.v1 import Extra

from orion.api.server.crawl_manager.class_model.chat_model import chat_model


class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]

class search_chat_callback_model(BaseModel):
    Result: Optional[List[chat_model]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
