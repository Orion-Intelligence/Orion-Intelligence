from odmantic import Model, Field
from enum import Enum
from pydantic import field_validator
from typing import Any
import re

class AllowedKeys(str, Enum):
    VERSION = "version"
    API_ALLOWED = "api_allowed"
    LANGUAGE_ALLOWED = "language_allowed"
    LOGO_URL = "logo_url"  # 👈 new image URL setting

VALID_LANGUAGE_CODES = {
    "en", "fr", "es", "de", "it", "pt", "ru", "zh", "ja", "ko",
    "ar", "hi", "bn", "tr", "nl", "sv", "pl", "cs"
}

# Simple regex to validate image URLs
IMAGE_URL_REGEX = re.compile(r"^https?://.+\.(png|jpg|jpeg|svg|webp)$", re.IGNORECASE)

class db_system_model(Model):
    key: AllowedKeys = Field(unique=True)
    value: str = Field(default="")

    @field_validator("value")
    def validate_value(cls, value: str, info: Any):
        key = info.data.get("key")

        validators = {
            AllowedKeys.API_ALLOWED: lambda v: v in ("0", "1"),
            AllowedKeys.VERSION: lambda v: bool(v.strip()),
            AllowedKeys.LANGUAGE_ALLOWED: lambda v: v in VALID_LANGUAGE_CODES,
            AllowedKeys.LOGO_URL: lambda v: bool(IMAGE_URL_REGEX.match(v)),
        }

        error_messages = {
            AllowedKeys.API_ALLOWED: "API_ALLOWED must be '0' or '1'",
            AllowedKeys.VERSION: "VERSION must be a non-empty string",
            AllowedKeys.LANGUAGE_ALLOWED: f"LANGUAGE_ALLOWED must be one of: {', '.join(sorted(VALID_LANGUAGE_CODES))}",
            AllowedKeys.LOGO_URL: "LOGO_URL must be a valid image URL ending with .png, .jpg, .svg, etc.",
        }

        if key in validators and not validators[key](value):
            raise ValueError(error_messages[key])

        return value
