# orion/api/interactive/tenant_manager/tenant_manager.py
from datetime import datetime
import threading
from typing import List

from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_alert_model import alert_status, db_alert_model, AlertModel

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
        return await self._engine.find_one(db_alert_model, db_alert_model.userId == user_id)

    async def save_alerts(self, userId: str, new_alerts: List[AlertModel]):
        if not new_alerts:
            return
        existing_doc = await self._engine.find_one(db_alert_model, db_alert_model.userId == userId)

        if existing_doc:
            update_result = await self._engine.update(
                db_alert_model,
                db_alert_model.userId == userId,
                {"$push": {"alerts": {"$each": [alert.dict(by_alias=True) for alert in new_alerts]}}}
            )
            return update_result
        else:
            new_doc = db_alert_model(
                userId=userId,
                alerts=new_alerts
            )
            return await self._engine.save(new_doc)
    

    async def upsert_alert(self, userId: str, data_hash: str, category: str, ioc_type: str, ioc_value: str):
        existing_doc = await self._engine.find_one(db_alert_model, db_alert_model.userId == userId)
        
        alert_updated = False
        
        if existing_doc and existing_doc.alerts:
            for alert in existing_doc.alerts:
                if (alert.data_hash == data_hash and 
                    alert.ioc_value == ioc_value and 
                    alert.type == category):
                    
                    alert.last_seen = datetime.utcnow()
                    alert_updated = True
                    print(f"DEBUG: Alert updated (last_seen set) for Hash: {data_hash}")
                    break
        
        if not alert_updated:
            new_alert = AlertModel(
                alert_id=f"{data_hash}-{ioc_value}", 
                type=category,
                ioc_type=ioc_type,
                ioc_value=ioc_value,
                data_hash=data_hash,
                status=alert_status.ACTIVE,
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow(),
            )
            print(f"DEBUG: New alert created for Hash: {data_hash}")

            if existing_doc:
                existing_doc.alerts.append(new_alert)
                doc_to_save = existing_doc
            else:
                doc_to_save = db_alert_model(
                    userId=userId,
                    alerts=[new_alert]
                )

        else:
            doc_to_save = existing_doc


        save_result = await self._engine.save(doc_to_save)
        
        return "Updated" if alert_updated else "Created"