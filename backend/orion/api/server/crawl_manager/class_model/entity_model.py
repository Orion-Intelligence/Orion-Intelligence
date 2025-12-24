from pydantic import BaseModel


class entity_model(BaseModel):
  model_config = {"extra": "allow"}
