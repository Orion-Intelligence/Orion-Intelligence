
from typing import List, Optional

from pydantic import BaseModel

from orion.api.interactive.graph_manager.graph_models.search_social_callback_model import suggestion
from orion.api.server.crawl_manager.class_model.chat_model import chat_model

result_item = chat_model


class search_chat_callback_model(BaseModel):
    Result: Optional[List[chat_model]] = None
    Suggestions: Optional[List[suggestion]] = None
    Page_Count: Optional[float] = None
