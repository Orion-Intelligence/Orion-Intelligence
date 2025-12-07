from typing import Literal
from pydantic import BaseModel, Field


class dump_param_model(BaseModel):
    page: int = Field(1, ge=1)

    source: Literal["all", "telegram", "websites"] = "all"

    group: str = "all"

    status: Literal["all", "parsed", "unparsed"] = "all"

    daterange: str = ""

    q: str = "*"
