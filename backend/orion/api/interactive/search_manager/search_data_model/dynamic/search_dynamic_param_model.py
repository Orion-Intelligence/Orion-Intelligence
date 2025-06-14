import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class search_dynamic_param_model(BaseModel):
    email: Optional[str] = Field(None, max_length=150)
    username: Optional[str] = Field(None, max_length=150)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        if value in (None, "") or re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", value):
            return value
        raise ValueError("Invalid email format")
