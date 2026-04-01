import asyncio
import json
import re
from typing import List, Dict, Any
from datetime import datetime, timezone

from bson import ObjectId
from cryptography.fernet import Fernet

from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import search_dynamic_crack_model, search_dynamic_param_model, search_dynamic_social_model
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import DomainScanRequest
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.helper_manager.helper_controller import helper_controller
from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.shared_model.db_alert_model import alert_all_ioc
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model, IocCategory
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller

ALERT_CATEGORIES = ["general", "defacement", "breach", "exploit", "social", "discussion", "stealerlogs", "feed",
    "scanning"]


class alert_job:
    __instance = None
    __category_index = 0

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

    @staticmethod
    def _tenant_key(tenant_id) -> str:
        return str(tenant_id)

    async def _handle_scanning_alert(self, tenant_id: str, ioc_value: str, ioc_type: str, scan_type: str):
        try:
            clean_domain = ioc_value.strip()
            if not clean_domain.startswith(("http://", "https://")):
                clean_domain = "https://" + clean_domain
            if not clean_domain.endswith("/"):
                clean_domain += "/"

            payload = DomainScanRequest(domain=clean_domain, scanType=scan_type)

            while True:
                if self._cancel_scan_flags.get(tenant_id):
                    return
                response = await self._crawl_model.scan_domain(payload)

                if isinstance(response, dict):
                    scan_result = response
                elif hasattr(response, "body"):
                    scan_result = json.loads(response.body)
                else:
                    break

                status = scan_result.get("status")
                if status == "pending":
                    await asyncio.sleep(5)
                    continue

                result = scan_result.get("result")
                if not isinstance(result, dict):
                    return False

                break

            grade = result.get("grade", "N/A")
            if grade == "N/A":
                return

            counts = result.get("grade_counts", {})
            high_risk = counts.get("high", 0)
            med_risk = counts.get("medium", 0)
            low_risk = counts.get("low", 0)

            threat_categories = list(result.get("threats", {}).keys())

            title = f"{scan_type.upper()} Scan: {ioc_value} (Grade: {grade})"

            description = (f"Security scan completed for {ioc_value}.\n"
                           f"**Grade:** {grade}\n"
                           f"**Risk Summary:** High: {high_risk} | Medium: {med_risk} | Low: {low_risk}\n"
                           f"**Issues Found:** {', '.join(threat_categories)}")

            all_ioc_list = [alert_all_ioc(name=ioc_type, values=[ioc_value])]

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
                all_ioc=all_ioc_list)
            return True

        except Exception:
            return False

    async def _handle_dynamic_scanning_alert(self,
            tenant_id: str,
            ioc_type: str,
            ioc_value: str,
            scan_type: str,
            result_list: List[Dict[str, Any]]):

        try:
            if not result_list:
                return False
            for result in result_list:
                if self._cancel_scan_flags.get(tenant_id):
                    return
                if scan_type in ["email-breach", "social-scanner"]:
                    _title = result.get("m_title", "Records for provided queries")
                    _description = result.get("m_important_content") or result.get("m_content", "A match was found.")
                    _url = result.get("m_url") or result.get("m_base_url") or "-"
                    _source = result.get("m_network") or "-"
                    _content_types = result.get("m_content_type") or []

                elif scan_type == "playstore-scanning":
                    _title = result.get("m_app_name", "Playstore App Found")
                    _description = (f"Package ID: {result.get('m_package_id', 'N/A')}\n"
                                    f"Mod Features: {result.get('m_mod_features', 'None')}\n"
                                    f"Version: {result.get('m_version', 'N/A')}")
                    _url = result.get("m_app_url", "-")
                    _source = result.get("m_network", "-")
                    _content_types = result.get("m_content_type") or []
                elif scan_type == "software-scanning":
                    _title = result.get("m_app_name", "Software Match Found")
                    _description = (
                        f"Package ID: {result.get('m_package_id', 'N/A')}\n"
                        f"Version: {result.get('m_version', 'N/A')}\n"
                        f"Latest Date: {result.get('m_latest_date', 'N/A')}\n"
                        f"Mod Features: {result.get('m_mod_features') or 'None'}"
                    )
                    _url = result.get("m_app_url", "-")
                    _source = result.get("m_network", "-")
                    _content_types = result.get("m_content_type") or []
                else:
                    continue

                all_ioc_list = []
                triggering_ioc = alert_all_ioc(name=ioc_type, values=[ioc_value])
                all_ioc_list.append(triggering_ioc)

                await self._alert_manager.upsert_alert(
                    tenantId=tenant_id,
                    category=scan_type,
                    ioc_type=ioc_type,
                    ioc_value=ioc_value,
                    title=_title,
                    description=_description,
                    url=_url,
                    source=f"Orion Dynamic Scanner ({scan_type})",
                    content_types=_content_types,
                    all_ioc=all_ioc_list)
            return True

        except Exception as e:
            return False

    async def _process_tenant_alerts(self, tenant: db_tenant_model, category: str):
        tenant_key = self._tenant_key(tenant.id)
        if tenant_key not in self._cancel_scan_flags:
            self._cancel_scan_flags[tenant_key] = False
        try:
            iocs = tenant.iocs
            if not iocs:
                return
            if category == "scanning":
                for ioc in iocs:
                    if self._cancel_scan_flags.get(tenant_key):
                        return
                    ioc_type_name = ioc.ioc_id
                    if ioc_type_name in ["m_domain", "m_url"]:
                        for ioc_value in ioc.values or []:
                            scans_to_run = []
                            if ioc_type_name == "m_domain":
                                scans_to_run = ["advanced", "seo"]
                            elif ioc_type_name == "m_url":
                                if "github" in ioc_value.lower():
                                    scans_to_run = ["repo"]
                            for scan_type in scans_to_run:
                                await self._handle_scanning_alert(
                                    tenant_key, ioc_value, ioc_type_name, scan_type)

                    for ioc_value in ioc.values or []:
                        scans = []
                        if ioc_type_name == "m_email" and "@" in ioc_value:
                            scans.append(
                                {"scan_type": "email-breach", "payload": {"username": ioc_value.split("@")[
                                    0], "email": ioc_value, }, "category": "user", "model": search_dynamic_param_model, })
                        if (ioc_type_name == "m_url" and re.search(
                                r"play\.google\.com\/store\/apps\/details", ioc_value, re.IGNORECASE)):
                            scans.append(
                                {"scan_type": "playstore-scanning", "payload": {"playstore": ioc_value}, "category": "cracked", "model": search_dynamic_crack_model, })
                        if ioc_type_name in ["m_mention", "m_social_media_profiles", "m_person", "m_company_name",
                            "m_org", ]:
                            scans.append(
                                {"scan_type": "social-scanner", "payload": {"username": ioc_value}, "category": "social", "model": search_dynamic_social_model, })
                        if ioc_type_name == "m_company_name":
                            scans.append(
                                {"scan_type": "software-scanning", "payload": {"name": ioc_value}, "category": "software", "model": search_dynamic_crack_model, })

                    for scan in scans:
                        scan_type = scan["scan_type"]
                        search_payload = scan["payload"]
                        dynamic_search_category = scan["category"]
                        model_cls = scan["model"]
                        try:
                            param_model = model_cls(text=search_payload)

                            response = await self._search_model.dynamic_search(
                                param_model, dynamic_search_category)

                            if isinstance(response, dict):
                                scan_result = response
                            elif hasattr(response, "body"):
                                scan_result = json.loads(response.body)
                            elif hasattr(response, "model_dump"):
                                scan_result = response.model_dump()
                            else:
                                scan_result = {}

                            result_list = scan_result.get("result", [])
                            if result_list:
                                await self._handle_dynamic_scanning_alert(
                                    tenant_key, ioc_type_name, ioc_value, scan_type, result_list)

                        except Exception as _:
                            log.g().e(f"Dynamic alert scan failed for tenant={tenant_key}, category={dynamic_search_category}, ioc={ioc_type_name}:{ioc_value}")
                return

            search_data_category = 'all'
            if category == "defacement":
                base_index = [ELASTIC_INDEX.S_DEFACEMENT_INDEX]
                ParamModel = search_consolidated_param_model
                search_func = self._search_model.search_consolidated_ranked_result
            elif category == "breach":
                base_index = [ELASTIC_INDEX.S_LEAK_INDEX]
                ParamModel = search_consolidated_param_model
                search_func = self._search_model.search_consolidated_ranked_result
            elif category == "feed":
                base_index = [ELASTIC_INDEX.S_LEAK_INDEX]
                search_data_category = 'news'
                ParamModel = search_consolidated_param_model
                search_func = self._search_model.search_consolidated_ranked_result
            elif category == "social":
                base_index = [ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX]
                ParamModel = search_consolidated_param_model
                search_func = self._search_model.search_consolidated_ranked_result
            elif category == "exploit":
                base_index = [ELASTIC_INDEX.S_EXPLOIT_INDEX]
                ParamModel = search_consolidated_param_model
                search_func = self._search_model.search_consolidated_ranked_result
            elif category == "general":
                base_index = [ELASTIC_INDEX.S_GENERIC_INDEX]
                ParamModel = search_consolidated_param_model
                search_func = self._search_model.search_consolidated_ranked_result
            elif category == "discussion":
                base_index = [ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX]
                ParamModel = search_consolidated_param_model
                search_func = self._search_model.search_consolidated_ranked_result
            elif category == "stealerlogs":
                ParamModel = search_credential_param_model
                search_func = self._search_model.search_stealer_iocs
            else:
                return

            total_alerts_processed = 0
            for ioc in iocs:
                ioc_type_name = ioc.ioc_id

                for ioc_value in ioc.values or []:

                    search_data = {"entity_filter": {ioc_type_name: [
                        ioc_value]}, "category": search_data_category, "page": 1, "size": 100, "matchtype": 'or', "fullsearch": True, "must": True,"ioc":f"{ioc_type_name}:{ioc_value}" }

                    try:
                        search_param = ParamModel(**search_data)
                        if category == "stealerlogs":
                            es_response = await search_func(search_param)
                        elif category == "social":
                            es_response = await search_func(search_param, base_index, [], [])
                        elif category == "discussion":
                            es_response = await search_func(search_param, base_index, [], [])
                        elif category == "defacement":
                            es_response = await search_func(search_param, base_index, [], [])
                        elif category == "breach":
                            es_response = await search_func(search_param, base_index,  ["news"], ["leaks", "tracking"])
                        elif category == "feed":
                            es_response = await search_func(search_param, base_index, [], ["news"])
                        elif category == "exploit":
                            es_response = await search_func(search_param, base_index, [], [])
                        elif category == "general":
                            es_response = await search_func(search_param, base_index, [], [])
                        else:
                            es_response = await search_func(search_param)

                        if isinstance(es_response, dict):
                            es_response_dict = es_response
                        elif hasattr(es_response, 'model_dump'):
                            es_response_dict = es_response.model_dump()
                        elif hasattr(es_response, 'dict'):
                            es_response_dict = es_response.dict()
                        else:
                            continue

                        results = es_response_dict.get("Result", [])

                        if results:
                            bulk_alerts = []
                            for result in results:
                                hash = result.get("m_hash") or ""
                                _content_types = result.get("m_content_type") or []
                                raw = result.get("raw") or ""
                                m_title = result.get("m_title")
                                m_description = result.get("m_content") or result.get("m_important_content")
                                _description = ""
                                _title = ""
                                if category == "defacement":
                                    m_title = result.get("m_team")

                                if category == "stealerlogs":
                                    hash = helper_controller.extract_stealer_hash(result)

                                    if result.get("username") and result.get("password"):
                                        _title = result.get("username")[0]
                                        _description = result.get("password")
                                    else:
                                        if raw:
                                            cleaned = raw.split("://")[-1]
                                            if ":" in cleaned:
                                                parts = cleaned.split(":", 1)
                                                _title = parts[0]
                                                _description = parts[1]
                                            else:
                                                _title = cleaned
                                                _description = "-"
                                        else:
                                            _title = "-"
                                            _description = "-"
                                else:
                                    _title = m_title
                                    _description = m_description or "-"

                                _url = result.get("m_url") or result.get("m_base_url") or result.get("domain") or "-"
                                _url = _url[0] if isinstance(_url, list) and _url else _url
                                _source = result.get("m_network") or result.get("channel") or "-"
                                additional_keys_and_values = self.get_additional_result_keys(result)
                                all_ioc_list = []
                                triggering_ioc = alert_all_ioc(name=ioc_type_name, values=[ioc_value])
                                all_ioc_list.append(triggering_ioc)
                                for key, val in additional_keys_and_values:
                                    if isinstance(val, list):
                                        ioc_values = [str(v) for v in val]
                                    else:
                                        ioc_values = [str(val)]

                                    new_ioc = alert_all_ioc(
                                        name=key, values=ioc_values)
                                    all_ioc_list.append(new_ioc)

                                bulk_alerts.append({
                                    "category": category,
                                    "ioc_type": ioc_type_name,
                                    "ioc_value": ioc_value,
                                    "title": _title,
                                    "description": _description,
                                    "url": _url,
                                    "source": _source,
                                    "content_types": _content_types,
                                    "all_ioc": all_ioc_list,
                                    "data_hash": hash,
                                })

                                if len(bulk_alerts) >= 200:
                                    await self._alert_manager.upsert_alerts_bulk(
                                        tenantId=tenant_key,
                                        alerts_payload=bulk_alerts,
                                        chunk_size=200)
                                    total_alerts_processed += len(bulk_alerts)
                                    bulk_alerts = []

                            if bulk_alerts:
                                await self._alert_manager.upsert_alerts_bulk(
                                    tenantId=tenant_key,
                                    alerts_payload=bulk_alerts,
                                    chunk_size=200)
                                total_alerts_processed += len(bulk_alerts)
                    except Exception as _:
                        log.g().e(f"Alert processing failed for tenant={tenant_key}, category={category}, ioc={ioc_type_name}:{ioc_value}")
        except Exception as e:
            log.g().e(f"Tenant alert processing failed for tenant={tenant_key}, category={category}: {e}")

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
            except Exception as _:
                log.g().e(f"Alert category run failed for tenant={tenant.id}")
            finally:
                self._cancel_scan_flags.pop(self._tenant_key(tenant.id), None)
                await self._alert_manager.getInstance().set_scan_running(tenant.id, False)

    def get_additional_result_keys(self, result: any) -> list[tuple[str, any]]:
        EXCLUDED_KEYS = {"m_hash", "m_content_type", "m_title", "m_url", "m_content", "m_network", "m_code_snippet",
            "m_section", "m_important_content", "m_base_url"}

        additional_data = []

        for key, val in result.items():
            if key in EXCLUDED_KEYS:
                continue
            if val is None:
                continue

            if isinstance(val, list) and len(val) == 0:
                continue
            if isinstance(val, str) and val.strip() == "":
                continue

            additional_data.append((key, val))
        return additional_data

    async def get_iocs_of_tenant(self, tenant: db_tenant_model) -> List[IocCategory]:
        try:
            if not tenant or not tenant.iocs:
                return []

            dek = await KeyManager.get_instance().get_profile_dek(ObjectId(tenant.id))
            enc = Fernet(dek)

            iocs = []
            for ioc in tenant.iocs or []:
                iocs.append(
                    IocCategory(
                        ioc_id=(enc.decrypt(ioc.ioc_id.encode()).decode() if ioc.ioc_id else ioc.ioc_id),
                        name=(enc.decrypt(ioc.name.encode()).decode() if ioc.name else ioc.name),
                        values=[(enc.decrypt(v.encode()).decode() if v else v) for v in (ioc.values or [])]))
            return iocs
        except Exception as ex:
            log.g().e(f"Failed to decrypt IOCs for tenant={getattr(tenant, 'id', None)}: {ex}")
        return []

    async def run_all_categories_for_api(self, current_user) -> dict:
        tenant_id = current_user.tenant_uuid
        await self._alert_manager.getInstance().set_scan_running(tenant_id, True)
        current_tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(tenant_id))
        start_time = datetime.now(timezone.utc)

        try:
            if not current_tenant:
                return {"status": "error", "message": "Invalid tenant/user object provided.", "duration_seconds": (
                        datetime.now(timezone.utc) - start_time).total_seconds(), "results": []}

            dek = await KeyManager.get_instance().get_profile_dek(ObjectId(current_tenant.id))
            enc = Fernet(dek)

            current_tenant.name = enc.decrypt(current_tenant.name.encode()).decode()
            current_tenant.phone = enc.decrypt(current_tenant.phone.encode()).decode()
            current_tenant.country = enc.decrypt(current_tenant.country.encode()).decode()
            current_tenant.city = enc.decrypt(current_tenant.city.encode()).decode()
            current_tenant.postal_code = enc.decrypt(current_tenant.postal_code.encode()).decode()
            current_tenant.licenses = [enc.decrypt(l.encode()).decode() for l in (current_tenant.licenses or [])]

            current_tenant.iocs = [IocCategory(
                ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode(),
                name=enc.decrypt(ioc.name.encode()).decode(),
                values=[enc.decrypt(v.encode()).decode() for v in (ioc.values or [])]) for ioc in
                (current_tenant.iocs or [])]

            category_statuses = []
            overall_success = True

            for category in ALERT_CATEGORIES:
                category_start_time = datetime.now(timezone.utc)
                try:
                    await self._process_tenant_alerts(current_tenant, category)

                    category_status = {"category": category, "status": "completed_successfully", "tenant_count": 1, "duration_seconds": (
                            datetime.now(timezone.utc) - category_start_time).total_seconds(), "error_count": 0}

                except Exception as e:
                    overall_success = False
                    pass

                category_statuses.append(category_status)

            end_time = datetime.now(timezone.utc)
            return {"status": "success" if overall_success else "completed_with_errors", "message": f"Alert generation job finished for tenant {tenant_id}.", "start_time": start_time.isoformat(), "end_time": end_time.isoformat(), "total_duration_seconds": (
                    end_time - start_time).total_seconds(), "results": category_statuses}
        except Exception as _:
            pass
        finally:
            await self._alert_manager.getInstance().set_scan_running(tenant_id, False)

    async def cancel_tenant_scan(self, tenant_id: str):
        self._cancel_scan_flags[self._tenant_key(tenant_id)] = True
