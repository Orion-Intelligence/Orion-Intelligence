from pydantic import BaseModel


class EntityQueryInput(BaseModel):
  model_type: str
  query_value: str