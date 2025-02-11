from pydantic import BaseModel
from backend.constants.strings import GENERAL_STRINGS

class directory_param_model(BaseModel):
    page_number: int = 1
    content_type: str = GENERAL_STRINGS.S_GENERAL_EMPTY
    index: str = GENERAL_STRINGS.S_GENERAL_EMPTY
    network: str = GENERAL_STRINGS.S_GENERAL_EMPTY
    site: str = GENERAL_STRINGS.S_GENERAL_HTTP
