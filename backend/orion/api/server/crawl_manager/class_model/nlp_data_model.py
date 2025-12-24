from typing import List

from pydantic import BaseModel


class nlp_data_model(BaseModel):
    data: List[str]
