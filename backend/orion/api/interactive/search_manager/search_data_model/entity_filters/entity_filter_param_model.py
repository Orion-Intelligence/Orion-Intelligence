from pydantic import BaseModel, Field
from typing import List

class entity_filter_param_model(BaseModel):
    categoryId: str = Field(..., alias="categoryId")
    categoryName: str = Field(..., alias="categoryName")
    tags: List[str] 