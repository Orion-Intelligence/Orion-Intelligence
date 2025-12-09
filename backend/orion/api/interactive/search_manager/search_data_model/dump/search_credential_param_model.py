from typing import Optional, Annotated
from pydantic import BaseModel, StringConstraints


class search_credential_param_model(BaseModel):
    daterange: Annotated[str,
        StringConstraints(pattern=r"^$|^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")
    ] = ""

    q: Optional[str] = ""
    url: Optional[str] = ""
    user: Optional[str] = ""
    type: Optional[str] = "c"
    page: Optional[int] = 1
    category: Optional[str] = ""
    fullsearch: Optional[bool] = False
