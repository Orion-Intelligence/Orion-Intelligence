from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.api.interactive.alert_manager.alert_summary_helper import AlertSummaryHelper
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.management.jobs.alert.cancellation_service import CancellationService
from orion.management.jobs.alert.category_processor import CategoryAlertProcessor
from orion.management.jobs.alert.config import ALERT_CATEGORIES
from orion.management.jobs.alert.dynamic_scanning_processor import DynamicScanningProcessor
from orion.management.jobs.alert.result_mappers import ResultMetadataMapper
from orion.management.jobs.alert.scanning_processor import ScanningAlertProcessor
from orion.management.jobs.alert.tenant_ioc_service import TenantIocService
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_tenant_model import IocCategory, db_tenant_model


class alert_job:
    _instances = None
    _category_index = 0

    @classmethod
    def get_instance(cls):
        if cls._instances is None:
            cls._instances = cls()
        return cls._instances

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        self._tenant_manager = TenantManager.get_instance()
        self._alert_manager = AlertManager.getInstance()
        self._search_model = search_model.getInstance()
        self._crawl_model = crawl_model.getInstance()
        self._cancellation_service = CancellationService()
        self._cancel_scan_flags = self._cancellation_service._cancel_scan_flags
        self._tenant_ioc_service = TenantIocService()
        self._category_processor = CategoryAlertProcessor(self._alert_manager, self._search_model)
        self._scanning_processor = ScanningAlertProcessor(self._alert_manager, self._crawl_model, self._cancellation_service)
        self._dynamic_scanning_processor = DynamicScanningProcessor(self._alert_manager, self._search_model, self._cancellation_service)

    @staticmethod
    def _tenant_key(tenant_id) -> str:
        return str(tenant_id)

    @staticmethod
    def _value(data: Any, field: str, default: Any = None) -> Any:
        if isinstance(data, dict):
            return data.get(field, default)
        return getattr(data, field, default)

    async def _handle_scanning_alert(self, tenant_id: str, ioc_value: str, ioc_type: str, scan_type: str):
        return await self._scanning_processor.handle_scanning_alert(tenant_id, ioc_value, ioc_type, scan_type)

    async def _handle_dynamic_scanning_alert( self, tenant_id: str, ioc_type: str, ioc_value: str, scan_type: str, search_payload: dict, dynamic_search_category: str, model_cls):
        return await self._dynamic_scanning_processor.handle_dynamic_scanning_alert( tenant_id, ioc_type, ioc_value, scan_type, search_payload, dynamic_search_category, model_cls,)

    async def _process_tenant_alerts(self, tenant: db_tenant_model, category: str):
        tenant_key = self._cancellation_service.ensure_tenant(self._value(tenant, "id", ""))
        summary = AlertSummaryHelper.new_scan_summary()

        try:
            iocs = self._value(tenant, "iocs", [])
            if not iocs:
                return summary

            if category == "scanning":
                return await self._process_scanning_category(tenant_key, iocs)

            return await self._category_processor.process_tenant_category(tenant_key, iocs, category)
        except Exception as e:
            log.g().e(f"Tenant alert processing failed for tenant={tenant_key}, category={category}: {e}")
        return summary

    async def _process_scanning_category(self, tenant_id: str, iocs: list[Any]) -> dict:
        summary = AlertSummaryHelper.new_scan_summary()

        for ioc in iocs:
            if self._cancellation_service.is_cancelled(tenant_id):
                return summary

            ioc_type_name = self._value(ioc, "ioc_id", "")
            ioc_values = self._value(ioc, "values", []) or []

            scan_summary = await self._scanning_processor.process_ioc(tenant_id, ioc_type_name, ioc_values)
            AlertSummaryHelper.merge_scan_summary(summary, scan_summary)

            dynamic_summary = await self._dynamic_scanning_processor.process_ioc(tenant_id, ioc_type_name, ioc_values)
            AlertSummaryHelper.merge_scan_summary(summary, dynamic_summary)

        return summary

    async def run_all_categories(self):
        all_tenants = await self._tenant_manager.get_all_tenant()
        if not all_tenants:
            return

        for tenant in all_tenants:
            tenant_id = self._tenant_key(self._value(tenant, "id", ""))
            if self._value(tenant, "is_default", False):
                continue

            status = await self._alert_manager.getInstance().get_scan_status_by_tenant_id(tenant_id)
            if status.get("scan_running"):
                continue

            scan_summary = AlertSummaryHelper.new_scan_summary()
            scan_status = "success"
            await self._alert_manager.getInstance().set_scan_running(tenant_id, True)
            try:
                for category in ALERT_CATEGORIES:
                    category_summary = await self._process_tenant_alerts(tenant, category)
                    AlertSummaryHelper.merge_scan_summary(scan_summary, category_summary)
            except Exception:
                scan_status = "completed_with_errors"
                log.g().e(f"Alert category run failed for tenant={tenant_id}")
            finally:
                self._cancellation_service.clear(tenant_id)
                await self._alert_manager.getInstance().set_scan_running(tenant_id, False)
                await self._alert_manager.send_scan_completed_mail(
                    tenant_id=tenant_id,
                    scan_status=scan_status,
                    summary=scan_summary,
                    tenant=tenant,
                )

    def get_additional_result_keys(self, result: Any) -> list[tuple[str, Any]]:
        return ResultMetadataMapper.get_additional_result_keys(result)

    async def get_iocs_of_tenant(self, tenant: db_tenant_model) -> list[IocCategory]:
        return await self._tenant_ioc_service.get_iocs_of_tenant(tenant)

    async def run_all_categories_for_api(self, current_user) -> dict:
        tenant_id = current_user.tenant_uuid
        await self._alert_manager.getInstance().set_scan_running(tenant_id, True)
        current_tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(tenant_id))
        start_time = datetime.now(timezone.utc)

        try:
            if not current_tenant:
                return {
                    "status": "error",
                    "message": "Invalid tenant/user object provided.",
                    "duration_seconds": (datetime.now(timezone.utc) - start_time).total_seconds(),
                    "results": [],
                }

            current_tenant = await self._tenant_ioc_service.decrypt_tenant_for_api(current_tenant)

            category_statuses = []
            overall_success = True
            scan_summary = AlertSummaryHelper.new_scan_summary()

            for category in ALERT_CATEGORIES:
                category_start_time = datetime.now(timezone.utc)
                try:
                    category_summary = await self._process_tenant_alerts(current_tenant, category)
                    AlertSummaryHelper.merge_scan_summary(scan_summary, category_summary)

                    category_status = {
                        "category": category,
                        "status": "completed_successfully",
                        "tenant_count": 1,
                        "duration_seconds": (datetime.now(timezone.utc) - category_start_time).total_seconds(),
                        "error_count": 0,
                    }
                except Exception:
                    overall_success = False
                    category_status = {
                        "category": category,
                        "status": "completed_with_errors",
                        "tenant_count": 1,
                        "duration_seconds": (datetime.now(timezone.utc) - category_start_time).total_seconds(),
                        "error_count": 1,
                    }

                category_statuses.append(category_status)

            end_time = datetime.now(timezone.utc)
            response_status = "success" if overall_success else "completed_with_errors"
            await self._alert_manager.send_scan_completed_mail(
                tenant_id=str(tenant_id),
                scan_status=response_status,
                summary=scan_summary,
                current_user=current_user,
                tenant=current_tenant,
            )
            return {
                "status": response_status,
                "message": f"Alert generation job finished for tenant {tenant_id}.",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "total_duration_seconds": (end_time - start_time).total_seconds(),
                "results": category_statuses,
            }
        except Exception as exc:
            log.error(f"Alert generation job failed for tenant {tenant_id}: {exc}")
        finally:
            await self._alert_manager.getInstance().set_scan_running(tenant_id, False)

    async def cancel_tenant_scan(self, tenant_id: str):
        self._cancellation_service.cancel(tenant_id)
