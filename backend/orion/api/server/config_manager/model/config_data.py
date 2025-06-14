from typing import Dict

from pydantic import BaseModel


class config_data(BaseModel):
    settings: Dict[str, str]
