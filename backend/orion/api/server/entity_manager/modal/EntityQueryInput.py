from pydantic import BaseModel

class EntityQueryInput(BaseModel):
    type: str
    value: str
