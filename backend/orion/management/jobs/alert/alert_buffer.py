from collections import defaultdict
from typing import Any

from orion.api.interactive.alert_manager.alert_summary_helper import AlertSummaryHelper


class AlertScanBuffer:
    def __init__(self, alert_manager: Any):
        self._alert_manager = alert_manager
        self._alerts_by_tenant: dict[str, list[dict[str, Any]]] = defaultdict(list)

    def add_alert(self, tenant_id: str, alert_payload: dict[str, Any] | None) -> None:
        if not alert_payload:
            return
        self._alerts_by_tenant[str(tenant_id)].append(alert_payload)

    def add_alerts(self, tenant_id: str, alert_payloads: list[dict[str, Any]]) -> None:
        for alert_payload in alert_payloads or []:
            self.add_alert(tenant_id, alert_payload)

    def clear(self, tenant_id: str) -> None:
        self._alerts_by_tenant.pop(str(tenant_id), None)

    async def flush(self, tenant_id: str, chunk_size: int = 200) -> dict:
        tenant_key = str(tenant_id)
        alerts = self._alerts_by_tenant.pop(tenant_key, [])
        summary = AlertSummaryHelper.new_scan_summary()
        if not alerts:
            return summary

        grouped_alerts: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
        for alert in alerts:
            grouped_alerts[
                (
                    alert.get("category", ""),
                    alert.get("ioc_type", ""),
                    alert.get("ioc_value", ""),
                )
            ].append(alert)

        for (category, ioc_type, ioc_value), payloads in grouped_alerts.items():
            upsert_result = await self._alert_manager.upsert_alerts_bulk(
                tenantId=tenant_key,
                alerts_payload=payloads,
                chunk_size=chunk_size,
            )
            AlertSummaryHelper.merge_scan_summary(
                summary,
                AlertSummaryHelper.scan_result_summary(category, ioc_type, ioc_value, upsert_result),
            )

        return summary
