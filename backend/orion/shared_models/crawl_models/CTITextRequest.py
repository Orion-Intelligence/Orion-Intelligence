from pydantic import BaseModel

class CTITextRequest(BaseModel):
    data: str
