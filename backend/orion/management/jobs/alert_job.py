import asyncio
import json
import re
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone

from bson import ObjectId
from cryptography.fernet import Fernet

from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import (
    search_dynamic_crack_model, search_dynamic_param_model, search_dynamic_social_model
)
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import DomainScanRequest
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_param_model import search_general_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.helper_manager.helper_controller import helper_controller
from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.shared_model.db_alert_model import alert_all_ioc
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model, IocCategory
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.mongo_controller import mongo_controller

ALERT_CATEGORIES = ["general", "defacement", "breach", "exploit", "social", "discussion", "stealerlogs", "feed", "scanning"]

EXCLUDED_KEYS = {"m_hash", "m_content_type", "m_title", "m_url", "m_content", "m_network", "m_code_snippet",
                 "m_section", "m_important_content", "m_base_url"}


class alert_job:
    __instance = None

    @staticmethod
    def get_instance():
        if alert_job.__instance is None:
            alert_job.__instance = alert_job()
        return alert_job.__instance

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        self._tenant_manager = TenantManager.get_instance()
        self._alert_manager = AlertManager.getInstance()
        self._search_model = search_model.getInstance()
        self._crawl_model = crawl_model.getInstance()
        self._cancel_scan_flags = {}

    def _normalize_domain(self, domain: str) -> str:
        clean = domain.strip()
        if not clean.startswith(("http://", "https://")):
            clean = f"https://{clean}"
        return clean if clean.endswith("/") else f"{clean}/"

    async def _poll_scan_result(self, payload: DomainScanRequest, tenant_id: str) -> Optional[Dict[str, Any]]:
        while True:
            if self._cancel_scan_flags.get(tenant_id):
                return None

            response = await self._crawl_model.scan_domain(payload)
            scan_result = self._extract_response_data(response)

            if not scan_result:
                break

            if scan_result.get("status") == "pending":
                await asyncio.sleep(5)
                continue

            result = scan_result.get("result")
            return result if isinstance(result, dict) else None

    def _extract_response_data(self, response) -> Optional[Dict[str, Any]]:
        if isinstance(response, dict):
            return response
        if hasattr(response, "body"):
            return json.loads(response.body)
        if hasattr(response, "model_dump"):
            return response.model_dump()
        return None

    async def _handle_scanning_alert(self, tenant_id: str, ioc_value: str, ioc_type: str, scan_type: str):
        try:
            clean_domain = self._normalize_domain(ioc_value)
            payload = DomainScanRequest(domain=clean_domain, scanType=scan_type)
            result = await self._poll_scan_result(payload, tenant_id)

            if not result:
                return False

            grade = result.get("grade", "N/A")
            if grade == "N/A":
                return

            counts = result.get("grade_counts", {})
            threat_categories = list(result.get("threats", {}).keys())

            title = f"{scan_type.upper()} Scan: {ioc_value} (Grade: {grade})"
            description = (
                f"Security scan completed for {ioc_value}.\n"
                f"**Grade:** {grade}\n"
                f"**Risk Summary:** High: {counts.get('high', 0)} | Medium: {counts.get('medium', 0)} | Low: {counts.get('low', 0)}\n"
                f"**Issues Found:** {', '.join(threat_categories)}"
            )

            await self._alert_manager.upsert_alert(
                tenantId=tenant_id,
                category=f"{scan_type} scanning",
                ioc_type=ioc_type,
                ioc_value=ioc_value,
                title=title,
                description=description,
                url=ioc_value,
                source=f"Orion Scanner ({scan_type})",
                content_types=threat_categories,
                all_ioc=[alert_all_ioc(name=ioc_type, values=[ioc_value])]
            )
            return True

        except Exception as e:
            print(f"[{datetime.now()}] -> SCAN ERROR for {ioc_value} ({scan_type}): {e}")
            return False

    def _extract_dynamic_scan_data(self, scan_type: str, result: Dict[str, Any]) -> Tuple[str, str, str, str, List]:
        if scan_type in ["email-breach", "social-scanner"]:
            return (
                result.get("m_title", "Records for provided queries"),
                result.get("m_important_content") or result.get("m_content", "A match was found."),
                result.get("m_url") or result.get("m_base_url") or "-",
                result.get("m_network") or "-",
                result.get("m_content_type") or []
            )

        if scan_type == "playstore-scanning":
            return (
                result.get("m_app_name", "Playstore App Found"),
                f"Package ID: {result.get('m_package_id', 'N/A')}\n"
                f"Mod Features: {result.get('m_mod_features', 'None')}\n"
                f"Version: {result.get('m_version', 'N/A')}",
                result.get("m_app_url", "-"),
                result.get("m_network", "-"),
                result.get("m_content_type") or []
            )

        if scan_type == "software-scanning":
            return (
                result.get("m_app_name", "Software Match Found"),
                f"Package ID: {result.get('m_package_id', 'N/A')}\n"
                f"Version: {result.get('m_version', 'N/A')}\n"
                f"Latest Date: {result.get('m_latest_date', 'N/A')}\n"
                f"Mod Features: {result.get('m_mod_features') or 'None'}",
                result.get("m_app_url", "-"),
                result.get("m_network", "-"),
                result.get("m_content_type") or []
            )

        return None, None, None, None, None

    async def _handle_dynamic_scanning_alert(
            self, tenant_id: str, ioc_type: str, ioc_value: str,
            scan_type: str, result_list: List[Dict[str, Any]]
            ):
        try:
            if not result_list:
                return False

            for result in result_list:
                if self._cancel_scan_flags.get(tenant_id):
                    return

                title, description, url, source, content_types = self._extract_dynamic_scan_data(scan_type, result)

                if not title:
                    continue

                await self._alert_manager.upsert_alert(
                    tenantId=tenant_id,
                    category=scan_type,
                    ioc_type=ioc_type,
                    ioc_value=ioc_value,
                    title=title,
                    description=description,
                    url=url,
                    source=f"Orion Dynamic Scanner ({scan_type})",
                    content_types=content_types,
                    all_ioc=[alert_all_ioc(name=ioc_type, values=[ioc_value])]
                )
            return True

        except Exception as e:
            print(f"[{datetime.now()}] -> DYNAMIC SCAN ERROR for {ioc_value} ({scan_type}): {e}")
            return False

    def _get_scan_configs_for_ioc(self, ioc_type: str, ioc_value: str) -> List[Dict[str, Any]]:
        configs = []

        if ioc_type == "m_email" and "@" in ioc_value:
            configs.append({
                "scan_type": "email-breach",
                "payload": {"username": ioc_value.split("@")[0], "email": ioc_value},
                "category": "user",
                "model": search_dynamic_param_model
            })

        if ioc_type == "m_url" and re.search(r"play\.google\.com\/store\/apps\/details", ioc_value, re.IGNORECASE):
            configs.append({
                "scan_type": "playstore-scanning",
                "payload": {"playstore": ioc_value},
                "category": "cracked",
                "model": search_dynamic_crack_model
            })

        if ioc_type in ["m_mention", "m_social_media_profiles", "m_person", "m_company_name", "m_org"]:
            configs.append({
                "scan_type": "social-scanner",
                "payload": {"username": ioc_value},
                "category": "social",
                "model": search_dynamic_social_model
            })

        if ioc_type == "m_company_name":
            configs.append({
                "scan_type": "software-scanning",
                "payload": {"name": ioc_value},
                "category": "software",
                "model": search_dynamic_crack_model
            })

        return configs

    async def _process_scanning_category(self, tenant: db_tenant_model):
        for ioc in tenant.iocs:
            if self._cancel_scan_flags.get(tenant.id):
                return

            ioc_type = ioc.ioc_id

            if ioc_type in ["m_domain", "m_url"]:
                for ioc_value in ioc.values or []:
                    scans = ["advanced", "seo"] if ioc_type == "m_domain" else (["repo"] if "github" in ioc_value.lower() else [])
                    for scan_type in scans:
                        await self._handle_scanning_alert(str(tenant.id), ioc_value, ioc_type, scan_type)

            for ioc_value in ioc.values or []:
                for scan_config in self._get_scan_configs_for_ioc(ioc_type, ioc_value):
                    try:
                        param_model = scan_config["model"](text=scan_config["payload"])
                        response = await self._search_model.dynamic_search(param_model, scan_config["category"])
                        scan_result = self._extract_response_data(response) or {}

                        if result_list := scan_result.get("result", []):
                            await self._handle_dynamic_scanning_alert(
                                str(tenant.id), ioc_type, ioc_value, scan_config["scan_type"], result_list
                            )
                    except Exception as e:
                        print(f"Dynamic scan failed | Type: {scan_config['scan_type']} | Value: {ioc_value} | Error: {e}", flush=True)

    def _get_search_config(self, category: str) -> Optional[Tuple]:
        configs = {
            "defacement": (search_defacement_param_model, self._search_model.search_defacement_result, 'all', None),
            "breach": (search_leak_param_model, self._search_model.search_leak_result, 'all', None),
            "feed": (search_leak_param_model, self._search_model.search_leak_result, 'news', None),
            "social": (search_consolidated_param_model, self._search_model.search_consolidated_ranked_result, 'all',
                       [ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX]),
            "exploit": (search_leak_param_model, self._search_model.search_exploit_result, 'all', None),
            "general": (search_general_param_model, self._search_model.search_general_result, 'all', None),
            "discussion": (search_leak_param_model, self._search_model.search_consolidated_ranked_result, 'all',
                           [ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX]),
            "stealerlogs": (search_credential_param_model, self._search_model.search_stealerlogs_result, 'all', None)
        }
        return configs.get(category)

    def _prepare_stealer_search_param(self, param: search_credential_param_model, ioc_type: str, ioc_value: str):
        if ioc_type == "m_domain":
            param.url = ioc_value
            param.entity_filter.pop("m_domain", None)
        elif ioc_type == "m_user":
            param.user = ioc_value
            param.entity_filter.pop("m_user", None)

    def _extract_stealer_title_desc(self, result: Dict[str, Any]) -> Tuple[str, str]:
        if result.get("username") and result.get("password"):
            return result["username"][0], result["password"]

        if raw := result.get("raw"):
            cleaned = raw.split("://")[-1]
            if ":" in cleaned:
                parts = cleaned.split(":", 1)
                return parts[0], parts[1]
            return cleaned, "-"

        return "-", "-"

    async def _execute_search(self, category: str, search_func, param, base_index=None):
        if category == "stealerlogs":
            return await search_func(param, True)
        if category in ["social", "discussion"]:
            return await search_func(param, base_index, [], [])
        return await search_func(param)

    async def _process_search_category(self, tenant: db_tenant_model, category: str):
        config = self._get_search_config(category)
        if not config:
            return

        ParamModel, search_func, search_data_category, base_index = config

        for ioc in tenant.iocs:
            ioc_type = ioc.ioc_id

            for ioc_value in ioc.values or []:
                search_data = {
                    "entity_filter": {ioc_type: [ioc_value]},
                    "category": search_data_category,
                    "page": 1,
                    "size": 100,
                    "matchtype": 'or',
                    "fullsearch": True,
                    "must": True
                }

                try:
                    search_param = ParamModel(**search_data)

                    if category == "stealerlogs":
                        self._prepare_stealer_search_param(search_param, ioc_type, ioc_value)

                    es_response = await self._execute_search(category, search_func, search_param, base_index)
                    es_response_dict = self._extract_response_data(es_response)

                    if not es_response_dict:
                        continue

                    results = es_response_dict.get("Result", [])
                    if results:
                        await self._process_search_results(tenant, category, results, ioc_type, ioc_value)

                except Exception as sub_e:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] -> CRITICAL SEARCH ERROR for {category}:{ioc_type}:{ioc_value}. Error: {sub_e}")

    async def _process_search_results(
            self, tenant: db_tenant_model, category: str, results: List[Dict[str, Any]],
            ioc_type: str, ioc_value: str
            ):
        for result in results:
            hash_val = result.get("m_hash") or ""
            content_types = result.get("m_content_type") or []

            title, description = self._extract_result_title_desc(result, category)
            url = self._extract_url(result)
            source = result.get("m_network") or result.get("channel") or "-"

            all_ioc_list = [alert_all_ioc(name=ioc_type, values=[ioc_value])]

            for key, val in self.get_additional_result_keys(result):
                ioc_values = [str(v) for v in val] if isinstance(val, list) else [str(val)]
                all_ioc_list.append(alert_all_ioc(name=key, values=ioc_values))

            await self._alert_manager.upsert_alert(
                tenantId=str(tenant.id),
                category=category,
                ioc_type=ioc_type,
                ioc_value=ioc_value,
                title=title,
                description=description,
                url=url,
                source=source,
                content_types=content_types,
                all_ioc=all_ioc_list,
                data_hash=hash_val
            )

    def _extract_result_title_desc(self, result: Dict[str, Any], category: str) -> Tuple[str, str]:
        if category == "defacement":
            return result.get("m_team"), result.get("m_content") or result.get("m_important_content") or "-"

        if category == "stealerlogs":
            title, desc = self._extract_stealer_title_desc(result)
            return title, desc

        return result.get("m_title"), result.get("m_content") or result.get("m_important_content") or "-"

    def _extract_url(self, result: Dict[str, Any]) -> str:
        url = result.get("m_url") or result.get("m_base_url") or result.get("domain") or "-"
        return url[0] if isinstance(url, list) and url else url

    async def _process_tenant_alerts(self, tenant: db_tenant_model, category: str):
        self._cancel_scan_flags[str(tenant.id)] = False
        try:
            if not tenant.iocs:
                return

            if category == "scanning":
                await self._process_scanning_category(tenant)
            else:
                await self._process_search_category(tenant, category)

        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] -> CRONJOB FATAL ERROR for tenant {tenant.id} in category {category}. Error: {e}")

    async def run_all_categories(self):
        all_tenants = await self._tenant_manager.get_all_tenant()
        if not all_tenants:
            return

        for tenant in all_tenants:
            if tenant.is_default:
                continue

            status = await self._alert_manager.getInstance().get_scan_status_by_tenant_id(tenant.id)
            if status.get("scan_running"):
                continue

            await self._alert_manager.getInstance().set_scan_running(tenant.id, True)
            try:
                for category in ALERT_CATEGORIES:
                    await self._process_tenant_alerts(tenant, category)
            except Exception:
                pass
            finally:
                self._cancel_scan_flags.pop(tenant.id, None)
                await self._alert_manager.getInstance().set_scan_running(tenant.id, False)

    def get_additional_result_keys(self, result: Any) -> List[Tuple[str, Any]]:
        additional_data = []
        for key, val in result.items():
            if key in EXCLUDED_KEYS or val is None:
                continue
            if (isinstance(val, list) and not val) or (isinstance(val, str) and not val.strip()):
                continue
            additional_data.append((key, val))
        return additional_data

    async def get_iocs_of_tenant(self, tenant: db_tenant_model) -> List[IocCategory]:
        try:
            if not tenant or not tenant.iocs:
                return []

            dek = await KeyManager.get_instance().get_profile_dek(ObjectId(tenant.id))
            enc = Fernet(dek)

            return [
                IocCategory(
                    ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode() if ioc.ioc_id else ioc.ioc_id,
                    name=enc.decrypt(ioc.name.encode()).decode() if ioc.name else ioc.name,
                    values=[enc.decrypt(v.encode()).decode() if v else v for v in (ioc.values or [])]
                )
                for ioc in tenant.iocs
            ]
        except Exception:
            return []

    def _decrypt_tenant_fields(self, tenant: db_tenant_model, enc: Fernet):
        tenant.name = enc.decrypt(tenant.name.encode()).decode()
        tenant.phone = enc.decrypt(tenant.phone.encode()).decode()
        tenant.country = enc.decrypt(tenant.country.encode()).decode()
        tenant.city = enc.decrypt(tenant.city.encode()).decode()
        tenant.postal_code = enc.decrypt(tenant.postal_code.encode()).decode()
        tenant.licenses = [enc.decrypt(l.encode()).decode() for l in (tenant.licenses or [])]
        tenant.iocs = [
            IocCategory(
                ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode(),
                name=enc.decrypt(ioc.name.encode()).decode(),
                values=[enc.decrypt(v.encode()).decode() for v in (ioc.values or [])]
            )
            for ioc in (tenant.iocs or [])
        ]

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
                    "results": []
                }

            dek = await KeyManager.get_instance().get_profile_dek(ObjectId(current_tenant.id))
            enc = Fernet(dek)
            self._decrypt_tenant_fields(current_tenant, enc)

            category_statuses = []
            overall_success = True

            for category in ALERT_CATEGORIES:
                category_start_time = datetime.now(timezone.utc)
                try:
                    await self._process_tenant_alerts(current_tenant, category)
                    category_status = {
                        "category": category,
                        "status": "completed_successfully",
                        "tenant_count": 1,
                        "duration_seconds": (datetime.now(timezone.utc) - category_start_time).total_seconds(),
                        "error_count": 0
                    }
                except Exception as e:
                    overall_success = False
                    print(f"[ERROR] Category {category} failed for tenant {tenant_id}: {e}")
                    category_status = {
                        "category": category,
                        "status": "completed_with_errors",
                        "tenant_count": 1,
                        "duration_seconds": (datetime.now(timezone.utc) - category_start_time).total_seconds(),
                        "error_count": 1
                    }
                category_statuses.append(category_status)

            end_time = datetime.now(timezone.utc)
            return {
                "status": "success" if overall_success else "completed_with_errors",
                "message": f"Alert generation job finished for tenant {tenant_id}.",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "total_duration_seconds": (end_time - start_time).total_seconds(),
                "results": category_statuses
            }
        except Exception:
            pass
        finally:
            await self._alert_manager.getInstance().set_scan_running(tenant_id, False)

    async def cancel_tenant_scan(self, tenant_id: str):
        self._cancel_scan_flags[tenant_id] = True