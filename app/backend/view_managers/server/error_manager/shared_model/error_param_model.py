from pydantic import BaseModel

class error_param_model(BaseModel):
    error_code: int
