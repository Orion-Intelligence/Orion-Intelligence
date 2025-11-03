import asyncio
from typing import List, Dict, Any
from datetime import datetime
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.services.mongo_manager.shared_model.db_alert_model import AlertModel, alert_status
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model, IocCategory

ALERT_CATEGORIES = [
    "defacement",
    "breach",
    "exploit",
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
            
            if category == "defacement":
                ParamModel = search_defacement_param_model
                search_func = self._search_model.search_defacement_result
            elif category in ["breach", "exploit"]:
                ParamModel = search_leak_param_model
                search_func = {
                    "breach": self._search_model.search_leak_result,
                    "exploit": self._search_model.search_exploit_result,
                }.get(category)
            else:
                return

            total_alerts_processed = 0
            for ioc in decrypted_iocs:
                ioc_type_name = ioc.ioc_id
                
                for ioc_value in ioc.values or []:
                    

                    search_data = {
                        "entity_filter": {ioc_type_name: [ioc_value]},
                        "category": 'all',
                        "page": 1,
                        "size": 100, 
                    }
                    
                    try:
                        search_param = ParamModel(**search_data)
                        es_response = await search_func(search_param)
                        
                        es_response_dict = es_response.model_dump() if hasattr(es_response, 'model_dump') else es_response.dict()
                        results = es_response_dict.get("Result", [])
                    
                        if results:
                            for result in results:
                                data_hash = result.get("m_hash", "NO_HASH")
                                status = await self._alert_manager.upsert_alert(
                                    userId=tenant.userId,
                                    data_hash=data_hash,
                                    category=category,
                                    ioc_type=ioc_type_name,
                                    ioc_value=ioc_value
                                )
                                total_alerts_processed += 1
                    except Exception as sub_e:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] -> CRITICAL SEARCH ERROR for {ioc_type_name}:{ioc_value}. Error: {sub_e}")
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] -> CRONJOB FATAL ERROR for tenant {tenant.userId} in category {category}. Error: {e}")


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
