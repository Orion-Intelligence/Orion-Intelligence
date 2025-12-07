from typing import Literal
from pydantic import BaseModel, Field


class directory_param_model(BaseModel):
    page: int = Field(
        1,
        ge=1,
    )

    content_type: Literal[
        "all", "general", "forums", "news", "stolen", "drugs",
        "hacking", "marketplaces", "cryptocurrency", "leaks",
        "adult", "tracking", "chat", "social"
    ] = "all"

    index: Literal[
        "all", "general", "leak", "defacement", "chat",
        "exploit", "twitter", "reddit"
    ] = "all"

    network: Literal["all", "clearnet", "onion", "i2p"] = "all"

    mDateRange: str = ""
