
from datetime import datetime
import threading
from typing import List
from fastapi import HTTPException

from orion.api.interactive.search_manager.search_model import search_model
from orion.api.interactive.alert_manager.function_map.function_maping import DOC_REQUEST_MAP, MODULE_ALERT_TYPE_MAP, SCANNING_ALERT_TYPES
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_alert_model import alert_all_ioc, alert_status, db_alert_model, AlertModel
from configs.app_dependency import get_user_permissions

class AlertManager:
    __instance = None
    __lock = threading.Lock()

    @staticmethod
    def get_instance():
        if AlertManager.__instance is None:
            with AlertManager.__lock:
                if AlertManager.__instance is None:
                    AlertManager.__instance = AlertManager()
        return AlertManager.__instance

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        if AlertManager.__instance is not None:
            raise Exception("This class is a singleton!")
        AlertManager.__instance = self

    async def get_user_alerts(self, user_id: str) -> db_alert_model | None:
        return await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == user_id)
    

    async def upsert_alert(self, tenantId: str, data_hash: str, category: str, ioc_type: str, ioc_value: str,
                           title:str,url:str,description:str,source:str,all_ioc:List[alert_all_ioc]=[], content_types: List[str] = []):
        existing_doc = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == tenantId)
        alert_updated = False
        if existing_doc and existing_doc.alerts:
            for alert in existing_doc.alerts:
                if (alert.data_hash == data_hash and 
                    alert.ioc_value == ioc_value and 
                    alert.type == category):
                    
                    alert.last_seen = datetime.utcnow()
                    alert_updated = True
                    break
        
        if not alert_updated:
            new_alert = AlertModel(
                alert_id=f"{data_hash}-{ioc_value}",
                type=category,
                ioc_type=ioc_type,
                ioc_value=ioc_value,
                data_hash=data_hash,
                title=title,
                description=description,
                url=url,
                source=source,
                content_types=content_types,
                status=alert_status.ACTIVE,
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow(),
                all_ioc=all_ioc,
            )

            if existing_doc:
                existing_doc.alerts.append(new_alert)
                doc_to_save = existing_doc
            else:
                doc_to_save = db_alert_model(
                    tenant_id=tenantId,
                    alerts=[new_alert]
                )

        else:
            doc_to_save = existing_doc


        save_result = await self._engine.save(doc_to_save)
        
        return "Updated" if alert_updated else "Created"
    

    async def add_custom_alert(self, data: AlertModel, current_user):
        company_uuid = str(current_user.company_uuid)
        doc_id = data.data_hash  


        if data.type not in DOC_REQUEST_MAP:
            return {"error": f"Unsupported alert type '{data.type}'"}

        func_name = DOC_REQUEST_MAP[data.type]
        request_func = getattr(search_model.getInstance(), func_name)

        try:
            if data.type in ["breach", "exploit", "general", "chat", "social", "defacement"]:
                doc_result = await request_func(doc_id, lang=None)
            else:
                doc_result = await request_func(doc_id)
        except Exception as e:
            raise HTTPException(status_code=500,detail=f"Failed to fetch document")

 
        if not doc_result:
            raise HTTPException(status_code=400, detail="No document found for this hash. Not a valid hash or not found.")

        if hasattr(doc_result, "dict"):
            doc_dict = doc_result.dict()
        elif hasattr(doc_result, "model_dump"):
            doc_dict = doc_result.model_dump()
        elif isinstance(doc_result, dict):
            doc_dict = doc_result
        else:
            raise HTTPException(status_code=500,detail=f"Unexpected document response type")

        if doc_dict.get("m_hash") != doc_id:
            raise HTTPException(status_code=400,detail=f"Hash does not match the document")

        alert_id = data.alert_id or f"{data.data_hash}-{data.ioc_value}"
        new_alert = AlertModel(
            alert_id=alert_id,
            custom_alert=True,
            type=data.type or '',
            ioc_type=data.ioc_type or '',
            ioc_value=data.ioc_value or '',
            data_hash=data.data_hash or '',
            title=data.title or '',
            description=data.description or '',
            source=data.source or '',
            url=data.url or '',
            all_ioc=data.all_ioc or [],
            content_types=data.content_types or [],
            status=data.status or alert_status.ACTIVE,
            first_seen=datetime.utcnow(),
            last_seen=datetime.utcnow(),
        )

        existing_doc = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == company_uuid)
        if existing_doc and existing_doc.alerts:
            for alert in existing_doc.alerts:
                if (
                    alert.data_hash == new_alert.data_hash and
                    alert.ioc_value == new_alert.ioc_value and
                    alert.type == new_alert.type
                ):
                    raise HTTPException(status_code=400,detail=f"Alert already exists")

   
        if existing_doc:
            existing_doc.alerts.append(new_alert)
            save_doc = existing_doc
        else:
            save_doc = db_alert_model(
                tenant_id=company_uuid,
                alerts=[new_alert]
            )

        await self._engine.save(save_doc)
        return {"message": "Created"}
    

    async def update_alert(self, alert_to_update: AlertModel, current_user):
        company_uuid = str(current_user.company_uuid)
        existing_doc = await self._engine.find_one(
            db_alert_model,
            db_alert_model.tenant_id == company_uuid)
        if not existing_doc or not existing_doc.alerts:
            raise HTTPException(status_code=404, detail="No alerts found for this user")
        hash_to_find = alert_to_update.data_hash
        _seen = alert_to_update.report_seen
        _type=alert_to_update.type
        _iocType=alert_to_update.ioc_type
        _iocValue=alert_to_update.ioc_value
        updated = False
        for stored_alert in existing_doc.alerts:
            if stored_alert.data_hash == hash_to_find:
                stored_alert.type=_type
                stored_alert.ioc_type=_iocType
                stored_alert.ioc_value=_iocValue
                stored_alert.last_seen = datetime.utcnow()
                updated = True
                break
        if not updated:
            raise HTTPException(status_code=404, detail="No matching alert found to update")
        await self._engine.save(existing_doc)
        return {
            "message": "Alert updated successfully",
            "updated_hash": hash_to_find
        }


    async def set_alert_seen(self, alerts_to_update: list[AlertModel], current_user):
        company_uuid = str(current_user.company_uuid)
        existing_doc = await self._engine.find_one(
            db_alert_model,
            db_alert_model.tenant_id == company_uuid
        )

        if not existing_doc or not existing_doc.alerts:
            raise HTTPException(status_code=404, detail="No alerts found for this user")

        updated_count = 0

        for update_alert in alerts_to_update:
            hash_to_find = update_alert.data_hash
            _seen = update_alert.report_seen

            for stored_alert in existing_doc.alerts:
                if stored_alert.data_hash == hash_to_find:
                    stored_alert.report_seen = _seen

                    updated_count += 1
                    break  

        if updated_count == 0:
            raise HTTPException(status_code=404, detail="No matching alerts found to update")

        await self._engine.save(existing_doc)

        return {
            "message": "Alerts updated successfully",
            "updated": updated_count
        }
    
    async def delete_alert(self, id: str, current_user):
        company_uuid = str(current_user.company_uuid)

        existing_doc = await self._engine.find_one(
            db_alert_model, 
            db_alert_model.tenant_id == company_uuid
        )

        if not existing_doc or not existing_doc.alerts:
            raise HTTPException(status_code=404, detail="No alerts found for this user")

        updated_alerts = [alert for alert in existing_doc.alerts if alert.alert_id != id]

        if len(updated_alerts) == len(existing_doc.alerts):
            raise HTTPException(status_code=404, detail="Alert not found")

        existing_doc.alerts = updated_alerts

        await self._engine.save(existing_doc)

        return {"message": "Alert deleted successfully", "id": id}
    
    async def getAllAlerts(self, current_user):
        alerts_data = await self._engine.find_one(
            db_alert_model,
            db_alert_model.tenant_id == str(current_user.company_uuid)
        )
        
        if not alerts_data:
            return [] 

        return alerts_data.alerts

    async def delete_all_alerts(self, current_user):
        company_uuid = str(current_user.company_uuid)

        existing_doc = await self._engine.find_one(
            db_alert_model,
            db_alert_model.tenant_id == company_uuid
        )

        if not existing_doc:
            raise HTTPException(status_code=400, detail="No alerts to delete")

        if not existing_doc.alerts or len(existing_doc.alerts) == 0:
            raise HTTPException(status_code=400, detail="No alerts to delete")

        existing_doc.alerts = []
        await self._engine.save(existing_doc)

        return {"message": "All alerts deleted successfully"}

    async def delete_alerts_by_type(self, current_user, alert_type: str):
        company_uuid = str(current_user.company_uuid)

        existing_doc = await self._engine.find_one(
            db_alert_model,
            db_alert_model.tenant_id == company_uuid
        )
        if not existing_doc or not existing_doc.alerts:
            raise HTTPException(status_code=400, detail="No alerts to delete")

        initial_count = len(existing_doc.alerts)
        existing_doc.alerts = [
            alert for alert in existing_doc.alerts
            if alert.type != alert_type
        ]
        deleted_count = initial_count - len(existing_doc.alerts)

        if deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No alerts found with type '{alert_type}'"
            )

        await self._engine.save(existing_doc)

        return {
            "message": f"Deleted {deleted_count} alerts of type '{alert_type}'"
        }
    
    async def set_scan_running(self,tenant_id: str, value: bool) -> dict:
        alert_doc = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == tenant_id)

        if alert_doc:
            alert_doc.scan_running = value
            await self._engine.save(alert_doc)

        return {"tenant_id": tenant_id, "scan_running": value}
    
    async def get_scan_status(self, current_user):
        company_uuid = str(current_user.company_uuid)
        alert_doc = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == company_uuid)

        if alert_doc:
            return {
                "scan_running": alert_doc.scan_running
            }
        return {
            "scan_running": False
        }
    
    @staticmethod
    def get_allowed_alert_types(user) -> set[str]:
        permissions = get_user_permissions(user)

        allowed = set()
        if permissions["modules"] == "all":
            allowed.update(MODULE_ALERT_TYPE_MAP.keys())
        else:
            for module in permissions["modules"]:
                if module in MODULE_ALERT_TYPE_MAP:
                    allowed.add(module)

        if permissions.get("scanning", False):
            allowed.update(SCANNING_ALERT_TYPES)

        return allowed
    
    def filter_alerts_by_license(self, alerts: list[AlertModel], user) -> list[AlertModel]:
        permissions = get_user_permissions(user)
        if permissions.get("maintainer", False):
            return alerts


        allowed_types = self.get_allowed_alert_types(user)

        filtered = []
        for alert in alerts:
            alert_type = alert.type.lower().strip()

            if alert_type in allowed_types:
                filtered.append(alert)

        return filtered

