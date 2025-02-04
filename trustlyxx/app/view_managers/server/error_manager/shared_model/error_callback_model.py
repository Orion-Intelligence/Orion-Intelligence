
from pydantic import BaseModel

class error_callback_model(BaseModel):
    mErrorCode: int
    mErrorMessage: str
