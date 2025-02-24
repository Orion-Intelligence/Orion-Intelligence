from odmantic import Model, Field
from enum import Enum

class AllowedKeys(str, Enum):
    NAME = "name"
    TITLE = "title"
    DESCRIPTION = "description"

class InputType(str, Enum):
    TEXT = "text"
    FILE = "file"

class db_system_model(Model):
    key: AllowedKeys = Field(unique=True)
    input_type: InputType = Field()
    value: str = Field(default="")
