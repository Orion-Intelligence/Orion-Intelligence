from typing import Any

from orion.api.interactive.alert_manager.alert_summary_helper import AlertSummaryHelper
from orion.management.jobs.alert.config import CATEGORY_SEARCH_CONFIG, CategorySearchConfig
from orion.management.jobs.alert.response_parser import ResponseParser
from orion.management.jobs.alert.result_mappers import ElasticsearchResultMapper
from orion.services.log_manager.log_controller import log


class CategoryAlertProcessor:
    def __init__(self, alert_manager: Any, search_model: Any):
        self._alert_manager = alert_manager
        self._search_model = search_model

    @staticmethod
    def _value(data: Any, field: str, default: Any = None) -> Any:
        if isinstance(data, dict):
            return data.get(field, default)
        return getattr(data, field, default)

    async def process_tenant_category(self, tenant_id: str, iocs: list[Any], category: str) -> dict:
        summary = AlertSummaryHelper.new_scan_summary()
        config = CATEGORY_SEARCH_CONFIG.get(category)
        if not config:
            return summary

        try:
            for ioc in iocs:
                ioc_type_name = self._value(ioc, "ioc_id", "")

                for ioc_value in self._value(ioc, "values", []) or []:
                    await self._process_ioc_value(tenant_id, category, config, summary, ioc_type_name, ioc_value)
        except Exception as e:
            log.g().e(f"Tenant alert processing failed for tenant={tenant_id}, category={category}: {e}")

        return summary

    async def _process_ioc_value(
        self,
        tenant_id: str,
        category: str,
        config: CategorySearchConfig,
        summary: dict,
        ioc_type_name: str,
        ioc_value: str,
    ) -> None:
        search_data = {
            "entity_filter": {ioc_type_name: [ioc_value]},
            "category": config.search_data_category,
            "page": 1,
            "size": 100,
            "matchtype": "or",
            "fullsearch": True,
            "must": True,
            "ioc": f"{ioc_type_name}:{ioc_value}",
        }

        try:
            search_param = config.param_model(**search_data)
            es_response = await self._search(category, config, search_param)
            es_response_dict = ResponseParser.to_dict(es_response, allow_body=False)
            if es_response_dict is None:
                return

            results = es_response_dict.get("Result", [])
            if not results:
                return

            bulk_alerts = []
            for result in results:
                bulk_alerts.append(
                    ElasticsearchResultMapper.to_alert_payload(category, ioc_type_name, ioc_value, result)
                )

                if len(bulk_alerts) >= 200:
                    await self._flush_bulk_alerts(tenant_id, category, ioc_type_name, ioc_value, summary, bulk_alerts)
                    bulk_alerts = []

            if bulk_alerts:
                await self._flush_bulk_alerts(tenant_id, category, ioc_type_name, ioc_value, summary, bulk_alerts)

        except Exception:
            log.g().e(
                f"Alert processing failed for tenant={tenant_id}, "
                f"category={category}, ioc={ioc_type_name}:{ioc_value}"
            )

    async def _search(self, category: str, config: CategorySearchConfig, search_param: Any) -> Any:
        search_func = getattr(self._search_model, config.search_method)

        if category == "stealerlogs":
            return await search_func(search_param)

        return await search_func(
            search_param,
            config.base_index,
            config.blocked_categories or [],
            config.allowed_categories or [],
        )

    async def _flush_bulk_alerts(
        self,
        tenant_id: str,
        category: str,
        ioc_type_name: str,
        ioc_value: str,
        summary: dict,
        bulk_alerts: list[dict[str, Any]],
    ) -> None:
        upsert_result = await self._alert_manager.upsert_alerts_bulk(
            tenantId=tenant_id,
            alerts_payload=bulk_alerts,
            chunk_size=200,
        )
        AlertSummaryHelper.merge_scan_summary(
            summary,
            AlertSummaryHelper.scan_result_summary(category, ioc_type_name, ioc_value, upsert_result),
        )
