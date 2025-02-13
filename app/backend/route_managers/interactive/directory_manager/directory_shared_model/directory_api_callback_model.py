from pydantic import BaseModel
from typing import List, Optional

class document_model(BaseModel):
    _id: str
    url: str
    content_type: List[str]
    index: str
    leak_status_date: int
    network_type: str
    url_status_date: int

class directory_api_callback_model(BaseModel):
    documents: List[document_model]
    count: int
    content_type_parameter: str
    index_parameter: str
