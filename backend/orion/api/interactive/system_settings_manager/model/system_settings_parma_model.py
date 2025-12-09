from pydantic import BaseModel, Field
from typing import Optional


class SystemSettingsParmaModel(BaseModel):
    language: str 
    version: str 
    api_allowed: str 