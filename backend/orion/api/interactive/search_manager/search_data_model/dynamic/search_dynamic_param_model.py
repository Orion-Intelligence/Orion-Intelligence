import re
from typing import Optional, Dict

from pydantic import BaseModel, Field, field_validator


class search_dynamic_param_model(BaseModel):
    text: Dict[str, str]