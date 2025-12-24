from typing import Literal, Annotated

from pydantic import BaseModel, Field, StringConstraints


class dump_param_model(BaseModel):
    page: int = Field(1, ge=1)

    source: Literal["all", "telegram", "websites"] = "all"

    group: str = "all"

    status: Literal["all", "parsed", "unparsed"] = "all"

    daterange: Annotated[str, StringConstraints(pattern=r"^$|^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")] = ""

    q: str = "*"
