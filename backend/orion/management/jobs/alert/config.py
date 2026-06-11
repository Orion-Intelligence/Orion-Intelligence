import re
from dataclasses import dataclass
from typing import Any, Callable

from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import (
    search_consolidated_param_model,
)
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import (
    search_credential_param_model,
)
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import (
    search_dynamic_crack_model,
    search_dynamic_param_model,
    search_dynamic_social_model,
)
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX

ALERT_CATEGORIES = [
    "general",
    "defacement",
    "breach",
    "exploit",
    "social",
    "discussion",
    "stealerlogs",
    "feed",
    "scanning",
]


@dataclass(frozen=True)
class CategorySearchConfig:
    param_model: type
    search_method: str
    base_index: list[Any] | None = None
    search_data_category: str = "all"
    blocked_categories: list[str] | None = None
    allowed_categories: list[str] | None = None


CATEGORY_SEARCH_CONFIG: dict[str, CategorySearchConfig] = {
    "defacement": CategorySearchConfig(
        param_model=search_consolidated_param_model,
        search_method="search_consolidated_ranked_result",
        base_index=[ELASTIC_INDEX.S_DEFACEMENT_INDEX],
    ),
    "breach": CategorySearchConfig(
        param_model=search_consolidated_param_model,
        search_method="search_consolidated_ranked_result",
        base_index=[ELASTIC_INDEX.S_LEAK_INDEX],
        blocked_categories=["news"],
        allowed_categories=["leaks", "tracking"],
    ),
    "feed": CategorySearchConfig(
        param_model=search_consolidated_param_model,
        search_method="search_consolidated_ranked_result",
        base_index=[ELASTIC_INDEX.S_LEAK_INDEX],
        search_data_category="news",
        allowed_categories=["news"],
    ),
    "social": CategorySearchConfig(
        param_model=search_consolidated_param_model,
        search_method="search_consolidated_ranked_result",
        base_index=[ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX],
    ),
    "exploit": CategorySearchConfig(
        param_model=search_consolidated_param_model,
        search_method="search_consolidated_ranked_result",
        base_index=[ELASTIC_INDEX.S_EXPLOIT_INDEX],
    ),
    "general": CategorySearchConfig(
        param_model=search_consolidated_param_model,
        search_method="search_consolidated_ranked_result",
        base_index=[ELASTIC_INDEX.S_GENERIC_INDEX],
    ),
    "discussion": CategorySearchConfig(
        param_model=search_consolidated_param_model,
        search_method="search_consolidated_ranked_result",
        base_index=[ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX],
    ),
    "stealerlogs": CategorySearchConfig(
        param_model=search_credential_param_model,
        search_method="search_stealer_iocs",
    ),
}


@dataclass(frozen=True)
class DynamicScanRule:
    scan_type: str
    category: str
    model: type
    matches: Callable[[str, str], bool]
    build_payload: Callable[[str], dict[str, Any]]


def _is_email(ioc_type: str, ioc_value: str) -> bool:
    return ioc_type == "m_email" and "@" in ioc_value


def _is_playstore_url(ioc_type: str, ioc_value: str) -> bool:
    return ioc_type == "m_url" and bool(
        re.search(r"play\.google\.com\/store\/apps\/details", ioc_value, re.IGNORECASE)
    )


def _is_social_ioc(ioc_type: str, _: str) -> bool:
    return ioc_type in ["m_mention", "m_social_media_profiles", "m_person", "m_company_name", "m_org"]


def _is_company_name(ioc_type: str, _: str) -> bool:
    return ioc_type == "m_company_name"


DYNAMIC_SCAN_RULES: tuple[DynamicScanRule, ...] = (
    DynamicScanRule(
        scan_type="email-breach",
        category="user",
        model=search_dynamic_param_model,
        matches=_is_email,
        build_payload=lambda value: {"username": value.split("@")[0], "email": value},
    ),
    DynamicScanRule(
        scan_type="playstore-scanning",
        category="cracked",
        model=search_dynamic_crack_model,
        matches=_is_playstore_url,
        build_payload=lambda value: {"playstore": value},
    ),
    DynamicScanRule(
        scan_type="social-scanner",
        category="social",
        model=search_dynamic_social_model,
        matches=_is_social_ioc,
        build_payload=lambda value: {"username": value},
    ),
    DynamicScanRule(
        scan_type="software-scanning",
        category="software",
        model=search_dynamic_crack_model,
        matches=_is_company_name,
        build_payload=lambda value: {"name": value},
    ),
)
