import json
from typing import Any, Dict

from fastapi import HTTPException

from orion.services.mongo_manager.shared_model.db_alert_model import db_alert_model, AlertModel
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS


class AlertSummaryHelper:
    def __init__(self, engine, redis_client, ttl_seconds: int = 300):
        self._engine = engine
        self._redis = redis_client
        self._ttl_seconds = ttl_seconds

    @staticmethod
    def summary_cache_key(tenant_id: str) -> str:
        return f"alert_summary:{tenant_id}"

    async def invalidate_alert_summary_cache(self, tenant_id: str) -> None:
        try:
            await self._redis.invoke_trigger(
                REDIS_COMMANDS.S_DELETE_KEY,
                [self.summary_cache_key(str(tenant_id))]
            )
        except Exception as ex:
            raise HTTPException(status_code=500, detail=f"Redis cache delete failed: {ex}")

    @staticmethod
    def risk_from_alert_type(alert_type: str) -> str:
        normalized = (alert_type or "").strip().lower()
        if normalized in ("general", "seo scanning"):
            return "low"
        if normalized in (
            "breach",
            "exploit",
            "malware",
            "feed",
            "playstore-scanning",
            "social-scanner",
            "email-breach",
            "stealerlogs",
            "software-scanning",
        ):
            return "critical"
        if normalized in ("defacement", "advanced scanning", "repo scanning"):
            return "high"
        if normalized in ("social", "discussion"):
            return "medium"
        return "unknown"

    def build_alert_summary(self, alerts_list: list[AlertModel]) -> Dict[str, Dict[str, int] | int]:
        counts_by_type: Dict[str, int] = {}
        counts_by_risk: Dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        unseen_total = 0

        for alert in alerts_list or []:
            alert_type = (alert.type or "").strip().lower()
            if alert_type:
                counts_by_type[alert_type] = counts_by_type.get(alert_type, 0) + 1

            if not bool(alert.report_seen):
                unseen_total += 1

            risk = self.risk_from_alert_type(alert.type or "")
            if risk in counts_by_risk:
                counts_by_risk[risk] += 1

        return {"unseen_total": unseen_total, "counts_by_type": counts_by_type, "counts_by_risk": counts_by_risk}

    async def get_alert_summary(self, tenant_id: str) -> Dict[str, Dict[str, int] | int]:
        key = self.summary_cache_key(str(tenant_id))
        try:
            cached = await self._redis.invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [key, None, None])
            if cached:
                return json.loads(cached)
        except Exception as ex:
            raise HTTPException(status_code=500, detail=f"Redis cache read failed: {ex}")

        alerts_doc = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == str(tenant_id))
        alerts = alerts_doc.alerts if alerts_doc and alerts_doc.alerts else []
        summary = self.build_alert_summary(alerts)

        try:
            await self._redis.invoke_trigger(
                REDIS_COMMANDS.S_SET_STRING,
                [key, json.dumps(summary), self._ttl_seconds]
            )
        except Exception as ex:
            raise HTTPException(status_code=500, detail=f"Redis cache write failed: {ex}")

        return summary
    
    @staticmethod
    def new_scan_summary() -> dict:
        return {
            "created": 0,
            "updated": 0,
            "total": 0,
            "counts_by_category": {},
            "ioc_values": [],
        }

    @staticmethod
    def merge_scan_summary(target: dict, source: dict | None) -> dict:
        if not source:
            return target
        target["created"] += int(source.get("created", 0) or 0)
        target["updated"] += int(source.get("updated", 0) or 0)
        target["total"] += int(source.get("total", 0) or 0)
        for category, count in (source.get("counts_by_category", {}) or {}).items():
            target["counts_by_category"][category] = target["counts_by_category"].get(category, 0) + int(count or 0)
        for ioc_row in source.get("ioc_values", []) or []:
            if ioc_row not in target["ioc_values"]:
                target["ioc_values"].append(ioc_row)
        return target

    @staticmethod
    def scan_result_summary(category: str, ioc_type: str, ioc_value: str, result: Any) -> dict:
        summary = AlertSummaryHelper.new_scan_summary()
        if isinstance(result, dict):
            created = int(result.get("created", 0) or 0)
            updated = int(result.get("updated", 0) or 0)
        elif result == "Created":
            created = 1
            updated = 0
        elif result == "Updated":
            created = 0
            updated = 1
        else:
            return summary

        total = created
        summary["created"] = created
        summary["updated"] = updated
        summary["total"] = total
        if created > 0:
            summary["counts_by_category"][category] = created
            summary["ioc_values"].append({"type": ioc_type or "IOC", "value": ioc_value or ""})
        return summary
