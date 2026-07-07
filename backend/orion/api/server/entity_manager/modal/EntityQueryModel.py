from pydantic import BaseModel


class EntityQueryModel(BaseModel):
    data_point_type: str
    model_type: str
    query_value: str = "all"
    edge: str
    depth: str
    scope_cluster: str = ""


class EntityGraphQueryItem(BaseModel):
    data_point_type: str
    model_type: str
    query_value: str = ""
    query_values: list[str] = []
    operator: str = "||"
    scope_cluster: str = ""


class EntityGraphBatchQueryModel(BaseModel):
    requests: list[EntityGraphQueryItem] = []
    data_point_type: str = ""
    model_type: str = ""
    query_value: str = "all"
    query_values: list[str] = []
    edge: str
    depth: str
    scope_cluster: str = ""
