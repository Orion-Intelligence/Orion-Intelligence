from pydantic import BaseModel
from backend.constants.strings import GENERAL_STRINGS

class directory_param_model(BaseModel):
    m_page_number: int = 1
    m_content_type: str = GENERAL_STRINGS.S_GENERAL_EMPTY
    m_index: str = GENERAL_STRINGS.S_GENERAL_EMPTY
    m_network: str = GENERAL_STRINGS.S_GENERAL_EMPTY
    m_site: str = GENERAL_STRINGS.S_GENERAL_HTTP
