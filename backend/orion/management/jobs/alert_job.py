import asyncio
from typing import List, Dict, Any
from datetime import datetime
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_param_model import search_general_param_model
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_param_model import search_exploit_param_model
from orion.api.interactive.search_manager.search_data_model.social.search_social_param_model import search_social_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.services.mongo_manager.shared_model.db_alert_model import AlertModel, alert_all_ioc, alert_status
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model, IocCategory
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX

ALERT_CATEGORIES = [
    "general",
    "defacement",
    "breach",
    "exploit",
    "social",
    "discussion",
    "stealerlogs",
    "feed",
]

class alert_job:
    __instance = None
    __category_index = 0
    
    @staticmethod
    def get_instance():
        if alert_job.__instance is None:
            alert_job.__instance = alert_job()
        return alert_job.__instance

    def __init__(self):
        self._tenant_manager = TenantManager.get_instance()
        self._alert_manager = AlertManager.get_instance()
        self._search_model = search_model.getInstance() 

    def _get_next_category(self) -> str:
        category = ALERT_CATEGORIES[alert_job.__category_index]
        alert_job.__category_index = (alert_job.__category_index + 1) % len(ALERT_CATEGORIES)
        return category

    def _create_search_data(self, iocs: List[IocCategory], category: str) -> Dict[str, Any]:
        entity_filter = {}
        for ioc in iocs:
            entity_filter[ioc.ioc_id] = ioc.values
    
        return {
            "entity_filter": entity_filter,
            "category": category, 
            "page": 1, 
            "size": 100,
        }

    def _map_es_result_to_alert(self, es_result: Dict[str, Any], ioc_type: str, ioc_value: str) -> AlertModel:
        data_hash = es_result.get("m_hash", es_result.get("m_title")) 
        
        return AlertModel(
            alert_id=f"ALERT-{data_hash}-{datetime.utcnow().timestamp()}", 
            type=es_result.get("rank_index", "general"),
            ioc_type=ioc_type, 
            ioc_value=ioc_value, 
            data_hash=data_hash, 
            status=alert_status.ACTIVE, 
            first_seen=datetime.utcnow(),
            last_seen=datetime.utcnow(),
        )


    async def _process_tenant_alerts(self, tenant: db_tenant_model, category: str):
        
        try:
            decrypted_iocs = await self._tenant_manager.decrypt_iocs_for_tenant(tenant)
            
            if not decrypted_iocs:
                return

            new_alerts: List[AlertModel] = []
            search_data_category='all'
            if category == "defacement":
                ParamModel = search_defacement_param_model
                search_func = self._search_model.search_defacement_result
            elif category =="breach":
                ParamModel = search_leak_param_model
                search_func = self._search_model.search_leak_result
            elif category =="feed":
                search_data_category='news'
                ParamModel = search_leak_param_model
                search_func = self._search_model.search_leak_result
            elif category=="social":
                base_index = [
                    ELASTIC_INDEX.S_CHATS_INDEX,
                    ELASTIC_INDEX.S_SOCIAL_INDEX
                ]
                ParamModel=search_consolidated_param_model
                search_func=self._search_model.search_consolidated_ranked_result
            elif category=="exploit":
                ParamModel=search_exploit_param_model
                search_func=self._search_model.search_exploit_result
            elif category=="general":
                ParamModel=search_general_param_model
                search_func=self._search_model.search_general_result
            elif category=="discussion":
                search_data_category=''
                base_index = [
                    ELASTIC_INDEX.S_CHATS_INDEX,
                    ELASTIC_INDEX.S_SOCIAL_INDEX
                ]
                ParamModel=search_leak_param_model
                search_func=self._search_model.search_consolidated_ranked_result
            elif category=="stealerlogs":
                ParamModel=search_credential_param_model
                search_func=self._search_model.search_stealerlogs_result
            else:
                return

            total_alerts_processed = 0
            for ioc in decrypted_iocs:
                ioc_type_name = ioc.ioc_id
                
                for ioc_value in ioc.values or []:
                    

                    search_data = {
                        "entity_filter": {ioc_type_name: [ioc_value]},
                        "category": search_data_category,
                        "page": 1,
                        "size": 100, 
                        "matchtype": 'or',
                        "fullsearch": True,
                    }
                    
                    try:
                        search_param = ParamModel(**search_data)
                        if category=="social":
                            es_response = await search_func(search_param,base_index,[],[])
                        elif category=="discussion":
                            es_response = await search_func(search_param,base_index,[],[])
                        else:
                            es_response = await search_func(search_param)
                        
                        if isinstance(es_response, dict):
                            es_response_dict = es_response
                        elif hasattr(es_response, 'model_dump'):
                            es_response_dict = es_response.model_dump()
                        elif hasattr(es_response, 'dict'):
                            es_response_dict = es_response.dict()
                        else:
                            print(f"[{datetime.now().strftime('%H:%M:%S')}] -> WARNING: Unexpected response type for {category}:{ioc_type_name}:{ioc_value}. Skipping.")
                            continue 

                        results = es_response_dict.get("Result", [])
                    
                        if results:
                            for result in results:
                                _data_hash = result.get("m_hash", "NO_HASH")
                                _content_types=result.get("m_content_type") or "-"
                                _title=result.get("m_title") or "-"
                                _url=result.get("m_url") or result.get("m_base_url") or "-"
                                _description=result.get("m_content") or result.get("m_important_content") or "-"
                                _source=result.get("m_network") or "-"
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
                                        name=key,
                                        values=ioc_values
                                    )
                                    all_ioc_list.append(new_ioc)

                                status = await self._alert_manager.upsert_alert(
                                    userId=tenant.userId,
                                    data_hash=_data_hash,
                                    category=category,
                                    ioc_type=ioc_type_name,
                                    ioc_value=ioc_value,
                                    title=_title,
                                    description=_description,
                                    url=_url,
                                    source=_source,
                                    content_types=_content_types,
                                    all_ioc=all_ioc_list
                                    )
                                total_alerts_processed += 1
                    except Exception as sub_e:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] -> CRITICAL SEARCH ERROR for {category}:{ioc_type_name}:{ioc_value}. Error: {sub_e}")
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] -> CRONJOB FATAL ERROR for tenant {tenant.userId} in category {category}. Error: {e}")


    async def run_all_categories(self):
        """Run alerts for all categories at once (nightly job)."""
        all_tenants = await self._tenant_manager.get_all_tenant()
        if not all_tenants:
            print("[INFO] No tenants found for daily check.")
            return

        for category in ALERT_CATEGORIES:
            print(f"[INFO] Processing category: {category}")
            tasks = [self._process_tenant_alerts(tenant, category) for tenant in all_tenants]
            await asyncio.gather(*tasks)
            print(f"[INFO] Completed category: {category}")

    async def run_daily_check(self):
        
        current_category = self._get_next_category()

        all_tenants = await self._tenant_manager.get_all_tenant()
        
        if not all_tenants:
            return

        tasks = [
            self._process_tenant_alerts(tenant, current_category)
            for tenant in all_tenants
        ]
        
        await asyncio.gather(*tasks)

    def get_additional_result_keys(self, result: any) -> list[tuple[str, any]]:
        EXCLUDED_KEYS = {
            "m_hash", "m_content_type", "m_title", "m_url", "m_content", "m_network",
            "m_code_snippet", "m_section", "m_important_content","m_base_url"
        }
        
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
