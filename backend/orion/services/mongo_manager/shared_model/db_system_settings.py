import re
from enum import Enum
from typing import Any

from odmantic import Model, Field
from pydantic import field_validator


class AllowedKeys(str, Enum):
    VERSION = "version"
    API_ALLOWED = "api_allowed"
    APP_NAME = "app_name"
    LANGUAGE_ALLOWED = "language_allowed"
    LOGO_URL = "logo_url"
    AI_ENDPOINT = "ai_endpoint"


VALID_LANGUAGE_CODES = {"en", "fr", "es", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "hi", "bn", "tr", "nl", "sv",
    "pl", "cs"}

IMAGE_URL_REGEX = re.compile(r"^https?://.+\.(png|jpg|jpeg|svg|webp)$", re.IGNORECASE)
ENDPOINT_URL_REGEX = re.compile(r"^https?://[^\s]+$", re.IGNORECASE)


class db_system_model(Model):
    key: AllowedKeys = Field(unique=True)
    value: str = Field(default="")

    @field_validator("value")
    def validate_value(cls, value: str, info: Any):
        key = info.data.get("key")

        validators = {AllowedKeys.API_ALLOWED: lambda v: v in ("0", "1"), AllowedKeys.VERSION: lambda v: bool(
            v.strip()), AllowedKeys.APP_NAME: lambda v: bool(
            v.strip()), AllowedKeys.LANGUAGE_ALLOWED: lambda v: v in VALID_LANGUAGE_CODES, AllowedKeys.AI_ENDPOINT: lambda
                v: v == "" or bool(
            ENDPOINT_URL_REGEX.match(v)), }

        error_messages = {AllowedKeys.API_ALLOWED: "API_ALLOWED must be '0' or '1'", AllowedKeys.VERSION: "VERSION must be a non-empty string", AllowedKeys.APP_NAME: "APP_NAME must be a non-empty string", AllowedKeys.LANGUAGE_ALLOWED: f"LANGUAGE_ALLOWED must be one of: {', '.join(sorted(VALID_LANGUAGE_CODES))}", AllowedKeys.AI_ENDPOINT: "AI_ENDPOINT must be an http(s) URL or empty", }

        if key in validators and not validators[key](value):
            raise ValueError(error_messages[key])

        return value
