from pydantic import BaseModel
from backend.constants.strings import GENERAL_STRINGS

class directory_param_model(BaseModel):
    page_number: int = 1
    content_type: list[str] = []
    index: str = "all"
    network: str = "all"
    site: str = GENERAL_STRINGS.S_GENERAL_HTTP

    def __init__(self, **data):
        super().__init__(**data)
        if isinstance(self.content_type, str) and self.content_type.lower() != "all":
            self.content_type = [ctype.strip() for ctype in self.content_type.split(",") if ctype.strip()]
        else:
            self.content_type = []
        self.index = self.index if self.index and self.index.lower() != "all" else None
        self.network = self.network if self.network and self.network.lower() != "all" else None
