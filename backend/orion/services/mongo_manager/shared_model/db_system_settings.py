import json
import re
from enum import Enum
from typing import Any

from odmantic import Model, Field
from pydantic import field_validator

class AllowedKeys(str, Enum):
    VERSION = "version"
    API_ALLOWED = "api_allowed"
    APP_NAME = "app_name"
    META_INFO = "meta_info"
    LANGUAGE_ALLOWED = "language_allowed"
    AI_ENDPOINT = "ai_endpoint"
    S_ONION = "s_onion"
    LOGO_URL = "logo_url"
    LOGO_WIDE_LIGHT = "logo_wide_light"
    LOGO_WIDE_DARK = "logo_wide_dark"

VALID_LANGUAGE_CODES = {"en", "fr", "es", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "hi", "bn", "tr", "nl", "sv",
    "pl", "cs"}

IMAGE_URL_REGEX = re.compile(r"^https?://.+\.(png|jpg|jpeg|svg|webp)$", re.IGNORECASE)
ENDPOINT_URL_REGEX = re.compile(r"^https?://[^\s]+$", re.IGNORECASE)
ONION_ADDRESS_REGEX = re.compile(r"^(?:https?://)?[a-z2-7]{56}\.onion/?$", re.IGNORECASE)


class db_system_model(Model):
    key: AllowedKeys = Field(unique=True)
    value: str = Field(default="")

    @field_validator("value")
    def validate_value(cls, value: str, info: Any):
        key = info.data.get("key")

        validators = {AllowedKeys.API_ALLOWED: lambda v: v in ("0", "1"), AllowedKeys.VERSION: lambda v: bool(
            v.strip()), AllowedKeys.APP_NAME: lambda v: bool(
            v.strip()), AllowedKeys.META_INFO: lambda v: v == "" or _is_valid_meta_info(v), AllowedKeys.LANGUAGE_ALLOWED: lambda v: v in VALID_LANGUAGE_CODES, AllowedKeys.AI_ENDPOINT: lambda
                v: v == "" or bool(
            ENDPOINT_URL_REGEX.match(v)), AllowedKeys.S_ONION: lambda v: v == "" or bool(
            ONION_ADDRESS_REGEX.match(v)), }

        error_messages = {AllowedKeys.API_ALLOWED: "API_ALLOWED must be '0' or '1'", AllowedKeys.VERSION: "VERSION must be a non-empty string", AllowedKeys.APP_NAME: "APP_NAME must be a non-empty string", AllowedKeys.META_INFO: "META_INFO must be a JSON object with string keys and string or boolean values or empty", AllowedKeys.LANGUAGE_ALLOWED: f"LANGUAGE_ALLOWED must be one of: {', '.join(sorted(VALID_LANGUAGE_CODES))}", AllowedKeys.AI_ENDPOINT: "AI_ENDPOINT must be an http(s) URL or empty", AllowedKeys.S_ONION: "S_ONION must be a valid onion address or empty", }

        if key in validators and not validators[key](value):
            raise ValueError(error_messages[key])

        return value


def _is_valid_meta_info(value: str) -> bool:
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return False

    if not isinstance(parsed, dict):
        return False

    return all(isinstance(k, str) and isinstance(v, (str, bool)) for k, v in parsed.items())
