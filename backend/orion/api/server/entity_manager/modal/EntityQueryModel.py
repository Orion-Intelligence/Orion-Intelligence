from pydantic import BaseModel, Field


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
    query_values: list[str] = Field(default_factory=list)
    operator: str = "||"
    scope_cluster: str = ""


class EntityGraphBatchQueryModel(BaseModel):
    requests: list[EntityGraphQueryItem] = Field(default_factory=list)
    data_point_type: str = ""
    model_type: str = ""
    query_value: str = "all"
    query_values: list[str] = Field(default_factory=list)
    edge: str
    depth: str
    scope_cluster: str = ""
