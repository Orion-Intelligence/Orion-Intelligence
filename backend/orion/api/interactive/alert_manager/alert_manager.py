from datetime import datetime, timezone
import hashlib
import threading
from typing import List

from fastapi import HTTPException

from orion.api.interactive.alert_manager.function_map.function_maping import MODULE_ALERT_TYPE_MAP, SCANNING_ALERT_TYPES
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_alert_model import alert_all_ioc, alert_status, db_alert_model, AlertModel
from configs.app_dependency import get_user_permissions


class AlertManager:
    __instance = None
    __lock = threading.Lock()

    @staticmethod
    def getInstance():
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

    def get_alert_job(self):
        from orion.management.jobs.alert_job import alert_job
        return alert_job


    async def get_user_alerts(self, user_id: str) -> db_alert_model | None:
        return await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == user_id)

    def _smart_hash(*parts) -> str:
        base = "|".join(str(p).strip().lower() for p in parts if p is not None)
        return hashlib.sha256(base.encode("utf-8")).hexdigest()

    async def upsert_alert(self,
            tenantId: str,
            category: str,
            ioc_type: str,
            ioc_value: str,
            title: str,
            url: str,
            description: str,
            source: str,
            all_ioc: List[alert_all_ioc],
            content_types: List[str],
            data_hash=''):

        if (data_hash == ''):
            data_hash = self._smart_hash(category, ioc_type, ioc_value, source, url)

        existing_doc = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == tenantId)
        alert_updated = False

        if existing_doc and existing_doc.alerts:
            for alert in existing_doc.alerts:
                if (alert.data_hash or "") == data_hash:
                    alert.last_seen = datetime.now(timezone.utc)

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
                first_seen=datetime.now(timezone.utc),
                last_seen=datetime.now(timezone.utc),
                all_ioc=all_ioc, )

            if existing_doc:
                existing_doc.alerts.append(new_alert)
                doc_to_save = existing_doc
            else:
                doc_to_save = db_alert_model(tenant_id=tenantId, alerts=[new_alert])
        else:
            doc_to_save = existing_doc

        await self._engine.save(doc_to_save)
        return "Updated" if alert_updated else "Created"

    async def add_custom_alert(self, data: AlertModel, current_user):
        tenant_uuid = str(current_user.tenant_uuid)

        all_ioc = data.all_ioc or []
        if not all_ioc and (data.ioc_type and data.ioc_value):
            all_ioc = [alert_all_ioc(name=data.ioc_type, values=[data.ioc_value])]

        data.data_hash = self._smart_hash(data.type, data.ioc_type, data.ioc_value, data.source, data.url)

        alert_id = data.alert_id or f"{data.data_hash}-{data.ioc_value}"

        new_alert = AlertModel(
            alert_id=alert_id,
            custom_alert=True,
            type=data.type or '',
            ioc_type=data.ioc_type or '',
            ioc_value=data.ioc_value or '',
            data_hash=data.data_hash,
            title=data.title or '',
            description=data.description or '',
            source=data.source or '',
            url=data.url or '',
            all_ioc=all_ioc,
            content_types=data.content_types or [],
            status=data.status or alert_status.ACTIVE,
            first_seen=datetime.now(timezone.utc),
            last_seen=datetime.now(timezone.utc), )

        existing_doc = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == tenant_uuid)

        if existing_doc and existing_doc.alerts:
            for alert in existing_doc.alerts:
                if (alert.data_hash or "") == new_alert.data_hash:
                    alert.title = new_alert.title
                    alert.description = new_alert.description
                    alert.source = new_alert.source
                    alert.url = new_alert.url
                    alert.all_ioc = new_alert.all_ioc
                    alert.content_types = new_alert.content_types
                    alert.status = new_alert.status
                    alert.last_seen = datetime.now(timezone.utc)
                    await self._engine.save(existing_doc)
                    return {"message": "Updated"}

        if existing_doc:
            existing_doc.alerts.append(new_alert)
            save_doc = existing_doc
        else:
            save_doc = db_alert_model(tenant_id=tenant_uuid, alerts=[new_alert])

        await self._engine.save(save_doc)
        return {"message": "Created"}

    async def update_alert(self, alert_to_update: AlertModel, current_user):
        tenant_uuid = str(current_user.tenant_uuid)
        existing_doc = await self._engine.find_one(
            db_alert_model, db_alert_model.tenant_id == tenant_uuid)
        if not existing_doc or not existing_doc.alerts:
            raise HTTPException(status_code=404, detail="No alerts found for this user")
        hash_to_find = alert_to_update.data_hash
        _seen = alert_to_update.report_seen
        _type = alert_to_update.type
        _iocType = alert_to_update.ioc_type
        _iocValue = alert_to_update.ioc_value
        updated = False
        for stored_alert in existing_doc.alerts:
            if stored_alert.data_hash == hash_to_find:
                stored_alert.type = _type
                stored_alert.ioc_type = _iocType
                stored_alert.ioc_value = _iocValue
                stored_alert.last_seen = datetime.now(timezone.utc)
                updated = True
                break
        if not updated:
            raise HTTPException(status_code=404, detail="No matching alert found to update")
        await self._engine.save(existing_doc)
        return {"message": "Alert updated successfully", "updated_hash": hash_to_find}

    async def set_alert_seen(self, alerts_to_update: list[AlertModel], current_user):
        tenant_uuid = str(current_user.tenant_uuid)
        existing_doc = await self._engine.find_one(
            db_alert_model, db_alert_model.tenant_id == tenant_uuid)

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

        return {"message": "Alerts updated successfully", "updated": updated_count}

    async def delete_alert(self, id: str, current_user):
        tenant_uuid = str(current_user.tenant_uuid)

        existing_doc = await self._engine.find_one(
            db_alert_model, db_alert_model.tenant_id == tenant_uuid)

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
            db_alert_model, db_alert_model.tenant_id == str(current_user.tenant_uuid))

        scan_status = await self.get_scan_status(current_user)
        if scan_status.get("scan_running", False):
            raise HTTPException(
                status_code=202, detail="Scan is still processing")

        if not alerts_data:
            return []

        return alerts_data.alerts

    async def delete_all_alerts(self, current_user):
        tenant_uuid = str(current_user.tenant_uuid)

        existing_doc = await self._engine.find_one(
            db_alert_model, db_alert_model.tenant_id == tenant_uuid)

        if not existing_doc:
            raise HTTPException(status_code=400, detail="No alerts to delete")

        if not existing_doc.alerts or len(existing_doc.alerts) == 0:
            raise HTTPException(status_code=400, detail="No alerts to delete")

        existing_doc.alerts = []
        await self._engine.save(existing_doc)

        return {"message": "All alerts deleted successfully"}

    async def delete_alerts_by_type(self, current_user, alert_type: str):
        tenant_uuid = str(current_user.tenant_uuid)

        existing_doc = await self._engine.find_one(
            db_alert_model, db_alert_model.tenant_id == tenant_uuid)
        if not existing_doc or not existing_doc.alerts:
            raise HTTPException(status_code=400, detail="No alerts to delete")

        initial_count = len(existing_doc.alerts)
        existing_doc.alerts = [alert for alert in existing_doc.alerts if alert.type != alert_type]
        deleted_count = initial_count - len(existing_doc.alerts)

        if deleted_count == 0:
            raise HTTPException(
                status_code=404, detail=f"No alerts found with type '{alert_type}'")

        await self._engine.save(existing_doc)

        return {"message": f"Deleted {deleted_count} alerts of type '{alert_type}'"}

    async def set_scan_running(self, tenant_id: str, value: bool, cancle_scan:bool=False) -> dict:
        alert_doc = await self._engine.find_one(
            db_alert_model, db_alert_model.tenant_id == str(tenant_id))

        if alert_doc:
            alert_doc.scan_running = value
            await self._engine.save(alert_doc)
        else:
            alert_doc = db_alert_model(
                tenant_id=str(tenant_id), scan_running=value, alerts=[])
            await self._engine.save(alert_doc)
        
        if(cancle_scan==True):
            alert_job = self.get_alert_job()
            await alert_job.get_instance().cancel_tenant_scan(tenant_id)

        return {"tenant_id": tenant_id, "scan_running": value}

    async def get_scan_status(self, current_user):
        alerts_data = await self._engine.find_one(
            db_alert_model,
            db_alert_model.tenant_id == str(current_user.tenant_uuid))

        if alerts_data:
            return {"scan_running": alerts_data.scan_running}
        return {"scan_running": False}

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
