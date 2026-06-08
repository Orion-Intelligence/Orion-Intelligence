import asyncio
from typing import Any

from orion.api.interactive.alert_manager.alert_summary_helper import AlertSummaryHelper
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import DomainScanRequest
from orion.management.jobs.alert.cancellation_service import CancellationService
from orion.management.jobs.alert.response_parser import ResponseParser
from orion.management.jobs.alert.result_mappers import ScanResultMapper


class ScanningAlertProcessor:
    def __init__(self, alert_manager: Any, crawl_model: Any, cancellation_service: CancellationService):
        self._alert_manager = alert_manager
        self._crawl_model = crawl_model
        self._cancellation_service = cancellation_service

    @staticmethod
    def scan_types_for_ioc(ioc_type: str, ioc_value: str) -> list[str]:
        if ioc_type == "m_domain":
            return ["advanced", "seo"]
        if ioc_type == "m_url" and "github" in ioc_value.lower():
            return ["repo"]
        return []

    async def process_ioc(self, tenant_id: str, ioc_type: str, values: list[str]) -> dict:
        summary = AlertSummaryHelper.new_scan_summary()

        if ioc_type not in ["m_domain", "m_url"]:
            return summary

        for ioc_value in values or []:
            if self._cancellation_service.is_cancelled(tenant_id):
                return summary

            for scan_type in self.scan_types_for_ioc(ioc_type, ioc_value):
                scan_summary = await self.handle_scanning_alert(tenant_id, ioc_value, ioc_type, scan_type)
                AlertSummaryHelper.merge_scan_summary(summary, scan_summary)

        return summary

    async def handle_scanning_alert(self, tenant_id: str, ioc_value: str, ioc_type: str, scan_type: str):
        try:
            clean_domain = ioc_value.strip()
            if not clean_domain.startswith(("http://", "https://")):
                clean_domain = "https://" + clean_domain
            if not clean_domain.endswith("/"):
                clean_domain += "/"

            payload = DomainScanRequest(domain=clean_domain, scanType=scan_type)

            while True:
                if self._cancellation_service.is_cancelled(tenant_id):
                    return None

                response = await self._crawl_model.scan_domain(payload)
                scan_result = ResponseParser.to_dict(response, allow_model_dump=False, allow_dict_method=False)
                if scan_result is None:
                    break

                status = scan_result.get("status")
                if status == "pending":
                    await asyncio.sleep(5)
                    continue

                result = scan_result.get("result")
                if not isinstance(result, dict):
                    return False

                break

            alert_fields = ScanResultMapper.to_alert_fields(scan_type, ioc_type, ioc_value, result)
            if not alert_fields:
                return None

            upsert_result = await self._alert_manager.upsert_alert(
                tenantId=tenant_id,
                category=alert_fields["category"],
                ioc_type=alert_fields["ioc_type"],
                ioc_value=alert_fields["ioc_value"],
                title=alert_fields["title"],
                description=alert_fields["description"],
                url=alert_fields["url"],
                source=alert_fields["source"],
                content_types=alert_fields["content_types"],
                all_ioc=alert_fields["all_ioc"],
            )
            return AlertSummaryHelper.scan_result_summary(
                alert_fields["category"], ioc_type, ioc_value, upsert_result
            )

        except Exception:
            return AlertSummaryHelper.new_scan_summary()
