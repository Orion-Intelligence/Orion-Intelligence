from typing import Any

from orion.helper_manager.helper_controller import helper_controller
from orion.services.mongo_manager.shared_model.db_alert_model import alert_all_ioc


class ResultMetadataMapper:
    EXCLUDED_KEYS = {
        "m_hash",
        "m_content_type",
        "m_title",
        "m_url",
        "m_content",
        "m_network",
        "m_code_snippet",
        "m_section",
        "m_important_content",
        "m_base_url",
    }

    @classmethod
    def get_additional_result_keys(cls, result: dict[str, Any]) -> list[tuple[str, Any]]:
        additional_data = []

        for key, val in result.items():
            if key in cls.EXCLUDED_KEYS:
                continue
            if val is None:
                continue
            if isinstance(val, list) and len(val) == 0:
                continue
            if isinstance(val, str) and val.strip() == "":
                continue

            additional_data.append((key, val))
        return additional_data

    @classmethod
    def all_iocs_for_result(cls, result: dict[str, Any], ioc_type: str, ioc_value: str) -> list[alert_all_ioc]:
        all_ioc_list = [alert_all_ioc(name=ioc_type, values=[ioc_value])]

        for key, val in cls.get_additional_result_keys(result):
            if isinstance(val, list):
                ioc_values = [str(v) for v in val]
            else:
                ioc_values = [str(val)]
            all_ioc_list.append(alert_all_ioc(name=key, values=ioc_values))

        return all_ioc_list


class ElasticsearchResultMapper:
    @staticmethod
    def to_alert_payload(category: str, ioc_type: str, ioc_value: str, result: dict[str, Any]) -> dict[str, Any]:
        data_hash = result.get("m_hash") or ""
        content_types = result.get("m_content_type") or []
        raw = result.get("raw") or ""
        title = result.get("m_title")
        description = result.get("m_content") or result.get("m_important_content")

        if category == "defacement":
            title = result.get("m_team")

        if category == "stealerlogs":
            data_hash = helper_controller.extract_stealer_hash(result)
            if result.get("username") and result.get("password"):
                title = result.get("username")[0]
                description = result.get("password")
            elif raw:
                cleaned = raw.split("://")[-1]
                if ":" in cleaned:
                    parts = cleaned.split(":", 1)
                    title = parts[0]
                    description = parts[1]
                else:
                    title = cleaned
                    description = "-"
            else:
                title = "-"
                description = "-"
        else:
            description = description or "-"

        url = result.get("m_url") or result.get("m_base_url") or result.get("domain") or "-"
        url = url[0] if isinstance(url, list) and url else url
        source = result.get("m_network") or result.get("channel") or "-"

        return {
            "category": category,
            "ioc_type": ioc_type,
            "ioc_value": ioc_value,
            "title": title,
            "description": description,
            "url": url,
            "source": source,
            "content_types": content_types,
            "all_ioc": ResultMetadataMapper.all_iocs_for_result(result, ioc_type, ioc_value),
            "data_hash": data_hash,
        }


class ScanResultMapper:
    @staticmethod
    def to_alert_fields(scan_type: str, ioc_type: str, ioc_value: str, result: dict[str, Any]) -> dict[str, Any] | None:
        grade = result.get("grade", "N/A")
        if grade == "N/A":
            return None

        counts = result.get("grade_counts", {})
        threat_categories = list(result.get("threats", {}).keys())

        description = (
            f"Security scan completed for {ioc_value}.\n"
            f"**Grade:** {grade}\n"
            f"**Risk Summary:** High: {counts.get('high', 0)} | "
            f"Medium: {counts.get('medium', 0)} | Low: {counts.get('low', 0)}\n"
            f"**Issues Found:** {', '.join(threat_categories)}"
        )

        return {
            "category": f"{scan_type} scanning",
            "ioc_type": ioc_type,
            "ioc_value": ioc_value,
            "title": f"{scan_type.upper()} Scan: {ioc_value} (Grade: {grade})",
            "description": description,
            "url": ioc_value,
            "source": f"Orion Scanner ({scan_type})",
            "content_types": threat_categories,
            "all_ioc": [alert_all_ioc(name=ioc_type, values=[ioc_value])],
        }


class DynamicResultMapper:
    @staticmethod
    def to_alert_fields(scan_type: str, ioc_type: str, ioc_value: str, result: dict[str, Any]) -> dict[str, Any] | None:
        if scan_type in ["email-breach", "social-scanner"]:
            title = result.get("m_title", "Records for provided queries")
            description = result.get("m_important_content") or result.get("m_content", "A match was found.")
            url = result.get("m_url") or result.get("m_base_url") or "-"
            content_types = result.get("m_content_type") or []
        elif scan_type == "playstore-scanning":
            title = result.get("m_app_name", "Playstore App Found")
            description = (
                f"Package ID: {result.get('m_package_id', 'N/A')}\n"
                f"Mod Features: {result.get('m_mod_features', 'None')}\n"
                f"Version: {result.get('m_version', 'N/A')}"
            )
            url = result.get("m_app_url", "-")
            content_types = result.get("m_content_type") or []
        elif scan_type == "software-scanning":
            title = result.get("m_app_name", "Software Match Found")
            description = (
                f"Package ID: {result.get('m_package_id', 'N/A')}\n"
                f"Version: {result.get('m_version', 'N/A')}\n"
                f"Latest Date: {result.get('m_latest_date', 'N/A')}\n"
                f"Mod Features: {result.get('m_mod_features') or 'None'}"
            )
            url = result.get("m_app_url", "-")
            content_types = result.get("m_content_type") or []
        else:
            return None

        return {
            "category": scan_type,
            "ioc_type": ioc_type,
            "ioc_value": ioc_value,
            "title": title,
            "description": description,
            "url": url,
            "source": f"Orion Dynamic Scanner ({scan_type})",
            "content_types": content_types,
            "all_ioc": [alert_all_ioc(name=ioc_type, values=[ioc_value])],
        }
