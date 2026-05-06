from pydantic import BaseModel, Field


class search_power_plants_param_model(BaseModel):
    page: int = 1
    size: int = 100
