from typing import Optional

from pydantic import BaseModel

class directory_param_model(BaseModel):
    page: int = 1
    content_type: Optional[str] = "all"
    index: Optional[str] = "all"
    network: Optional[str] = "all"
    mDateRange:Optional[str]=""
