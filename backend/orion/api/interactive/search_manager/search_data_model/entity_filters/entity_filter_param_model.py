from typing import List

from pydantic import BaseModel, Field


class entity_filter_param_model(BaseModel):
    categoryId: str = Field(..., alias="categoryId")
    tags: List[str]
