from typing import Literal

from typing_extensions import Annotated
from pydantic import BaseModel, ConfigDict, Field, StringConstraints


class directory_param_model(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    page: int = Field(
        1, ge=1, )

    content_type: Literal[
        "all", "general", "forums", "news", "stolen", "drugs", "hacking", "marketplaces", "cryptocurrency", "leaks", "adult", "tracking", "chat", "social"] = "all"

    index: Literal["all", "general", "leak", "defacement", "chat", "exploit", "twitter", "reddit"] = "all"

    network: Literal["all", "clearnet", "onion", "i2p"] = "all"

    mDateRange: Annotated[str, StringConstraints(pattern=r"^$|^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")] = Field(
        default="",
        alias="daterange",
    )
