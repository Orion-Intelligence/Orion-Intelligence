from pydantic import BaseModel

class EntityQueryModel(BaseModel):
    data_point_type: str
    model_type: str
    query_value: str = "all"
    edge: str
    depth: str

