from odmantic import Model, Field
from enum import Enum
from pydantic import field_validator

class AllowedKeys(str, Enum):
    VERSION = "version"
    API_ALLOWED = "api_allowed"
    LANGUAGE_ALLOWED = "language_allowed"

class db_system_model(Model):
    key: AllowedKeys = Field(unique=True)
    value: str = Field(default="")

    @field_validator("value")
    def validate_value_based_on_key(cls, value, info):
        key = info.data.get("key")
        if key == AllowedKeys.API_ALLOWED:
            if value not in ("0", "1"):
                raise ValueError("API_ALLOWED must be 0 or 1")
        elif key == AllowedKeys.VERSION:
            if not isinstance(value, str) or not value.strip():
                raise ValueError("VERSION must be a non-empty string")
        return value