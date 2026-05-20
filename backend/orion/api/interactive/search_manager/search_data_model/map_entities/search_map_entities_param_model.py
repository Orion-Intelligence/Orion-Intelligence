from pydantic import BaseModel, Field


class search_map_entities_param_model(BaseModel):
    page: int = 1
    size: int = 100
