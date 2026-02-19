from typing import List

from pydantic import BaseModel


class suggestion(BaseModel):
    text: str
    offset: int
    length: int
    options: List[dict]
