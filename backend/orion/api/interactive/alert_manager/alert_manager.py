
from datetime import datetime
import threading
from typing import List

from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_alert_model import alert_all_ioc, alert_status, db_alert_model, AlertModel

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
    

    async def upsert_alert(self, userId: str, data_hash: str, category: str, ioc_type: str, ioc_value: str,
                           title:str,url:str,description:str,source:str,all_ioc:List[alert_all_ioc]=[], content_types: List[str] = []):
        existing_doc = await self._engine.find_one(db_alert_model, db_alert_model.userId == userId)
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
                all_ioc=all_ioc
            )

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
    
    
    async def add_custom_alert(self, data: AlertModel, current_user):
        userId = str(current_user.id)
        alert_id = data.alert_id or f"{data.data_hash}-{data.ioc_value}"
        new_alert = AlertModel(
            alert_id=alert_id,
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

        existing_doc = await self._engine.find_one(db_alert_model, db_alert_model.userId == userId)

        exists = False
        if existing_doc and existing_doc.alerts:
            for alert in existing_doc.alerts:
                if (alert.data_hash == new_alert.data_hash and
                    alert.ioc_value == new_alert.ioc_value and
                    alert.type == new_alert.type):
                    exists = True
                    break
        
        if exists:
            return "Already Exists"

        if existing_doc:
            existing_doc.alerts.append(new_alert)
            save_doc = existing_doc
        else:
            save_doc = db_alert_model(
                userId=userId,
                alerts=[new_alert]
            )

        await self._engine.save(save_doc)
        return "Created"

