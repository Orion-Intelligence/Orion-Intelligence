import re
from typing import Dict

from pydantic import BaseModel, Field


class search_dynamic_param_model(BaseModel):
    text: Dict[str, str] = Field(
        default_factory=dict,
        examples=[
            {
                "username": "",
                "email": "msmannan00@gmail.com"
            }
        ]
    )


class search_dynamic_crack_model(BaseModel):
    text: Dict[str, str] = Field(
        default_factory=dict,
        examples=[
            {
                "playstore": "https://play.google.com/store/apps/details?id=com.jrzheng.supervpnfree&hl=en"
            }
        ]
    )

class search_dynamic_social_model(BaseModel):
    text: Dict[str, str] = Field(
        default_factory=dict,
        examples=[
            {
                "username": "bitcoin"
            }
        ]
    )
