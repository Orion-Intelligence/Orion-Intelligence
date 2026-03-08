import json
from typing import Dict

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
        except Exception:
            # Cache invalidation should not block alert mutations.
            pass

    @staticmethod
    def risk_from_alert_type(alert_type: str) -> str:
        normalized = (alert_type or "").strip().lower()
        if normalized in ("general", "seo scanning"):
            return "low"
        if normalized in (
            "breach",
            "exploit",
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
        except Exception:
            pass

        alerts_doc = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == str(tenant_id))
        alerts = alerts_doc.alerts if alerts_doc and alerts_doc.alerts else []
        summary = self.build_alert_summary(alerts)

        try:
            await self._redis.invoke_trigger(
                REDIS_COMMANDS.S_SET_STRING,
                [key, json.dumps(summary), self._ttl_seconds]
            )
        except Exception:
            pass

        return summary
