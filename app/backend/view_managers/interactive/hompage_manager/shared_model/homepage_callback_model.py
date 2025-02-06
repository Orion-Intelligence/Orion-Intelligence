from pydantic import BaseModel, Field
from typing import List, Dict, Union


class statistic_item(BaseModel):
    value: Union[int, float, str] = Field(..., description="The numerical or string value of the statistic.")
    name: str = Field(..., description="The name of the statistic.")
    daily_change: str = Field("-", description="Daily percentage change, defaults to '-'.")
    icon: str = Field(..., description="Icon name for the statistic.")
    weekly_change: str = Field("-", description="Weekly percentage change, defaults to '-'.")

class homepage_callback_model(BaseModel):
    mHomepageCallbackStatistics: Dict[str, List[statistic_item]] = Field(
        default_factory=dict,
        description="Main statistics data."
    )
