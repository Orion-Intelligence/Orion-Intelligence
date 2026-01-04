from __future__ import annotations
from typing import Any, Dict, Optional, Set
from .base import base_converter
from .utils import safe_get, as_list, first_nonempty

class defacement_converter(base_converter):
    type_label = "orion:defacement"
    report_prefix = "defacement"
    created_ts_fields = ["m_leak_date", "m_creation_date", "m_update_date"]
    extra_url_fields = ["m_mirror_links", "m_source_url"]

    def _get_title(self, raw: Any) -> str:
        return str(first_nonempty(
            safe_get(raw, "m_title"),
            safe_get(raw, "m_url"),
            safe_get(raw, "m_base_url"),
            as_list(safe_get(raw, "m_mirror_links"))[0] if as_list(safe_get(raw, "m_mirror_links")) else None,
            str(safe_get(raw, "m_content")).splitlines()[0] if safe_get(raw, "m_content") else None,
            "Defacement - unknown title",
        ))

    def _get_url(self, raw: Any) -> Optional[str]:
        return first_nonempty(
            safe_get(raw, "m_url"),
            safe_get(raw, "m_base_url"),
            as_list(safe_get(raw, "m_source_url"))[0] if as_list(safe_get(raw, "m_source_url")) else None,
            as_list(safe_get(raw, "m_mirror_links"))[0] if as_list(safe_get(raw, "m_mirror_links")) else None,
        )

    def _get_summary_source(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_content"), safe_get(raw, "m_important_content"), ""))

    def _get_content_types(self, raw: Any) -> Set[str]:
        ct = super()._get_content_types(raw)
        if not ct:
            ct.add("defacement")
        return ct

    def _get_report_custom_fields(self, raw: Any) -> Dict[str, Any]:
        attack_vector = str(first_nonempty(
            as_list(safe_get(raw, "m_ioc_type"))[0] if as_list(safe_get(raw, "m_ioc_type")) else None,
            as_list(safe_get(raw, "m_web_server"))[0] if as_list(safe_get(raw, "m_web_server")) else None,
            "Unknown",
        ))
        mirror_count = len(as_list(safe_get(raw, "m_mirror_links")))
        return {
            "x_orion_attack_vector": attack_vector,
            "x_orion_mirror_links_count": str(mirror_count) if mirror_count else None,
        }
