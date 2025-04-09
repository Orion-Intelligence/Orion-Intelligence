from odmantic import Model, Field
from enum import Enum
from pydantic import field_validator
from typing import Any

class AllowedKeys(str, Enum):
    VERSION = "version"
    API_ALLOWED = "api_allowed"
    LANGUAGE_ALLOWED = "language_allowed"

VALID_LANGUAGE_CODES = { "en", "fr", "es", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "hi", "bn", "tr", "nl", "sv", "pl", "cs" }

class db_system_model(Model):
    key: AllowedKeys = Field(unique=True)
    value: str = Field(default="")

    @field_validator("value")
    def validate_value_based_on_key(cls, value: str, info: Any):
        key = info.data.get("key")

        if key == AllowedKeys.API_ALLOWED and value not in ("0", "1"):
            raise ValueError("API_ALLOWED must be '0' or '1'")

        elif key == AllowedKeys.VERSION and (not isinstance(value, str) or not value.strip()):
            raise ValueError("VERSION must be a non-empty string")

        elif key == AllowedKeys.LANGUAGE_ALLOWED and value not in VALID_LANGUAGE_CODES:
            raise ValueError(f"LANGUAGE_ALLOWED must be a valid language code. Allowed: {', '.join(VALID_LANGUAGE_CODES)}")

        return value
