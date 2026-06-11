from datetime import datetime, timezone
import hashlib
import threading
from typing import Any, List

from fastapi import HTTPException

from orion.api.interactive.alert_manager.alert_mail_helper import AlertMailHelper
from orion.api.interactive.alert_manager.alert_summary_helper import AlertSummaryHelper
from orion.api.interactive.alert_manager.function_map.function_maping import MODULE_ALERT_TYPE_MAP, SCANNING_ALERT_TYPES

from orion.constants import constant
from orion.constants.constant import allowed_key_titles
from orion.helper_manager.env_handler import env_handler
from orion.services.mail_manager.mail_enums import AlertMailLabel, AlertMailMessage, AlertMailSubject, AlertMailTitle
from orion.services.mail_manager.mail_manager import mail_manager
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, db_user_account
from orion.services.mongo_manager.shared_model.db_alert_model import alert_all_ioc, alert_status, db_alert_model, AlertModel
from orion.services.redis_manager.redis_controller import redis_controller
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
        from orion.services.mongo_manager.mongo_controller import mongo_controller
        self._engine = mongo_controller.get_instance().get_engine()
        self._redis = redis_controller.getInstance()
        self._alert_summary_ttl_seconds = 300
        self._summary_helper = AlertSummaryHelper(self._engine, self._redis, self._alert_summary_ttl_seconds)
        self._mail_helper = AlertMailHelper(self._engine)
        if AlertManager.__instance is not None:
            raise Exception("This class is a singleton!")
        AlertManager.__instance = self

    def get_alert_job(self):
        from orion.management.jobs.alert.alert_job import alert_job
        return alert_job


    async def get_user_alerts(self, user_id: str) -> db_alert_model | None:
        return await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == user_id)

    def _smart_hash(*parts) -> str:
        base = "|".join(str(p).strip().lower() for p in parts if p is not None)
        return hashlib.sha256(base.encode("utf-8")).hexdigest()

    async def get_alert_summary(self, tenant_id: str):
        return await self._summary_helper.get_alert_summary(tenant_id)

    @staticmethod
    def _display_alert_label(value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized == "seo scanning":
            return "SEO scanning"
        if normalized == "exploit":
            return "Exploits"
        if normalized == "stealerlogs":
            return "Stealer logs"
        if normalized == "email-breach":
            return "Email breach"
        if normalized == "social-scanner":
            return "Social scanner"
        if not normalized:
            return AlertMailLabel.UNCATEGORIZED.value
        return normalized.replace("-", " ").replace("_", " ").title()

    @staticmethod
    def _pluralize_alert(count: int) -> str:
        return "alert" if count == 1 else "alerts"

    @staticmethod
    def _alert_action_url(category: str = "") -> str:
        app_url = (env_handler.get_instance().env("APP_URL", "") or "").rstrip("/")
        if not app_url:
            return ""
        normalized_category = (category or "").strip().lower()
        if normalized_category:
            return f"{app_url}/dashboard/profile/alerts/{normalized_category}"
        return f"{app_url}/dashboard/profile/alerts"

    async def _get_alert_mail_recipient(self, tenant_id: str, current_user=None) -> tuple[str, str]:
        if current_user is not None:
            return (current_user.email,current_user.username)
        maintainer_user = None
        
        if tenant_id:
            maintainer_user = await self._engine.find_one(db_user_account,(db_user_account.tenant_uuid == str(tenant_id)) & (db_user_account.licenses == LicenseName.MAINTAINER))
        return (maintainer_user.email,maintainer_user.username)

    @staticmethod
    def _alert_ioc_rows(alert: AlertModel) -> list[dict[str, str]]:
        rows = []
        if alert.ioc_value:
            rows.append({
                "type": allowed_key_titles.get(alert.ioc_type, alert.ioc_type or AlertMailLabel.IOC_FALLBACK.value),
                "value": alert.ioc_value,
            })
        for ioc in alert.all_ioc or []:
            for value in ioc.values or []:
                row = {"type": allowed_key_titles.get(ioc.type, ioc.type or AlertMailLabel.IOC_FALLBACK.value), "value": value}
                if row not in rows:
                    rows.append(row)
        return rows[:10]

    async def _send_alert_mail(self, *, tenant_id: str, subject: str, email_title: str, preheader: str, friendly_message: str,
            scan_status: str, total_alerts: int, module_rows: list[dict[str, Any]], ioc_rows: list[dict[str, str]], current_user=None,
            action_url: str = "", closing_message: str = AlertMailMessage.DEFAULT_CLOSING.value):
        try:
            if constant.alert_mail_template is None:
                return False

            to_email, recipient_name = await self._get_alert_mail_recipient(tenant_id, current_user)
            if not to_email:
                return False


            html_content = constant.alert_mail_template.render(email_title=email_title, preheader=preheader, recipient_name=recipient_name,
                friendly_message=friendly_message, scan_status=scan_status, total_alerts=total_alerts, event_date=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
                module_rows=module_rows, ioc_rows=ioc_rows, action_url=action_url, action_label=AlertMailLabel.ACTION_LABEL.value,closing_message=closing_message)

            await mail_manager.get_instance().send_verification_mail(to=to_email, subject=subject, body=html_content)
            return True
        except Exception as ex:
            return False

    async def send_scan_completed_mail(self, tenant_id: str, scan_status: str, summary: dict[str, Any], current_user=None, tenant=None):
        counts_by_category = summary.get("counts_by_category", {}) if summary else {}
        ioc_values = summary.get("ioc_values", []) if summary else []
        total_alerts = int(summary.get("total", 0) if summary else 0)
        if total_alerts <= 0:
            return

        module_rows = []
        for category, count in sorted(counts_by_category.items(), key=lambda item: item[0]):
            display_name = self._display_alert_label(category)
            count = int(count or 0)
            module_rows.append({
                "label": AlertMailMessage.MODULE_COUNT.value.format(category=display_name, count=count, alert_word=self._pluralize_alert(count)), "count": count,
            })

        ioc_rows = []
        for item in ioc_values[:10]:
            if isinstance(item, dict):
                ioc_type = item.get("type") or ""
                ioc_type = ioc_type.strip()
                ioc_rows.append({"type":  allowed_key_titles.get(ioc_type,"ioc_type" or AlertMailLabel.IOC_FALLBACK.value), "value": item.get("value") or "",
                })

        alert_word = self._pluralize_alert(total_alerts)
        friendly_message = AlertMailMessage.SCAN_COMPLETED.value.format(count=total_alerts,alert_word=alert_word)
        subject = AlertMailSubject.SCAN_COMPLETED.value.format(count=total_alerts,alert_word=alert_word)

        await self._send_alert_mail(tenant_id=tenant_id, current_user=current_user, subject=subject, email_title=AlertMailTitle.SCAN_COMPLETED.value, preheader=friendly_message,
            friendly_message=friendly_message, scan_status=self._display_alert_label(scan_status), total_alerts=total_alerts, module_rows=module_rows, ioc_rows=ioc_rows,
            action_url=self._alert_action_url())

    async def send_alert_change_mail(self, action: str, alert: AlertModel, current_user):
        tenant_id = str(current_user.tenant_uuid)
        is_created = action == "created"
        display_category = self._display_alert_label(alert.type)
        title = AlertMailTitle.CUSTOM_CREATED.value if is_created else AlertMailTitle.ALERT_UPDATED.value
        message = (
            AlertMailMessage.CUSTOM_CREATED.value
            if is_created else
            AlertMailMessage.ALERT_UPDATED.value
        )
        subject = title
        module_rows = [{
            "label": AlertMailMessage.SINGLE_ALERT_COUNT.value.format(category=display_category),
            "count": 1,
        }]

        await self._send_alert_mail(tenant_id=tenant_id, current_user=current_user, subject=subject, email_title=title, preheader=message, friendly_message=message,
            scan_status=AlertMailLabel.CREATED_STATUS.value if is_created else AlertMailLabel.UPDATED_STATUS.value, total_alerts=1, module_rows=module_rows, ioc_rows=self._alert_ioc_rows(alert),
            action_url=self._alert_action_url(alert.type), closing_message=AlertMailMessage.ALERT_CHANGE_CLOSING.value)

    async def upsert_alerts_bulk(self, tenantId: str, alerts_payload: list[dict], chunk_size: int = 200):
        if not alerts_payload:
            return {"created": 0, "updated": 0}

        existing_doc = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == tenantId)
        if not existing_doc:
            existing_doc = db_alert_model(tenant_id=tenantId, alerts=[])

        existing_index = {
            ((a.data_hash or ""), (a.type or ""), (a.ioc_value or "")): a
            for a in (existing_doc.alerts or [])
        }

        created_count = 0
        updated_count = 0

        for start in range(0, len(alerts_payload), chunk_size):
            chunk = alerts_payload[start:start + chunk_size]
            now = datetime.now(timezone.utc)

            for payload in chunk:
                category = payload.get("category", "")
                ioc_type = payload.get("ioc_type", "")
                ioc_value = payload.get("ioc_value", "")
                data_hash = payload.get("data_hash") or self._smart_hash(
                    category, ioc_type, ioc_value, payload.get("source", ""), payload.get("url", ""))
                key = (data_hash, category, ioc_value)

                existing_alert = existing_index.get(key)
                if existing_alert:
                    existing_alert.last_seen = now
                    updated_count += 1
                    continue

                new_alert = AlertModel(
                    alert_id=f"{data_hash}-{ioc_value}",
                    type=category,
                    ioc_type=ioc_type,
                    ioc_value=ioc_value,
                    data_hash=data_hash,
                    title=payload.get("title", ""),
                    description=payload.get("description", ""),
                    url=payload.get("url", ""),
                    source=payload.get("source", ""),
                    content_types=payload.get("content_types", []),
                    status=alert_status.ACTIVE,
                    first_seen=now,
                    last_seen=now,
                    all_ioc=payload.get("all_ioc", []), )
                existing_doc.alerts.append(new_alert)
                existing_index[key] = new_alert
                created_count += 1

            await self._engine.save(existing_doc)

        await self._summary_helper.invalidate_alert_summary_cache(tenantId)
        return {"created": created_count, "updated": updated_count}

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
                if (
                    (alert.data_hash or "") == data_hash
                    and (alert.type or "") == category
                    and (alert.ioc_value or "") == ioc_value
                ):
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
        await self._summary_helper.invalidate_alert_summary_cache(tenantId)
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
                    await self._summary_helper.invalidate_alert_summary_cache(tenant_uuid)
                    await self.send_alert_change_mail("updated", alert, current_user)
                    return {"message": "Updated"}

        if existing_doc:
            existing_doc.alerts.append(new_alert)
            save_doc = existing_doc
        else:
            save_doc = db_alert_model(tenant_id=tenant_uuid, alerts=[new_alert])

        await self._engine.save(save_doc)
        await self._summary_helper.invalidate_alert_summary_cache(tenant_uuid)
        await self.send_alert_change_mail("created", new_alert, current_user)
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
        updated_alert = None
        for stored_alert in existing_doc.alerts:
            if stored_alert.data_hash == hash_to_find:
                stored_alert.type = _type
                stored_alert.ioc_type = _iocType
                stored_alert.ioc_value = _iocValue
                stored_alert.last_seen = datetime.now(timezone.utc)
                updated = True
                updated_alert = stored_alert
                break
        if not updated:
            raise HTTPException(status_code=404, detail="No matching alert found to update")
        await self._engine.save(existing_doc)
        await self._summary_helper.invalidate_alert_summary_cache(tenant_uuid)
        if updated_alert:
            await self.send_alert_change_mail("updated", updated_alert, current_user)
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
        await self._summary_helper.invalidate_alert_summary_cache(tenant_uuid)

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
        await self._summary_helper.invalidate_alert_summary_cache(tenant_uuid)

        return {"message": "Alert deleted successfully", "id": id}

    def _to_notification_item(self, alert: AlertModel) -> dict[str, Any]:
        normalized = (alert.type or "").lower()
        if normalized in {"general", "seo scanning"}:
            risk = "Low"
        elif normalized in {"breach", "exploit", "malware", "feed", "playstore-scanning", "social-scanner",
            "email-breach", "stealerlogs", "software-scanning"}:
            risk = "Critical"
        elif normalized in {"defacement", "advanced scanning", "repo scanning"}:
            risk = "High"
        elif normalized in {"social", "discussion"}:
            risk = "Medium"
        else:
            risk = "Unknown"

        return {
            "categoryName": alert.type or "",
            "risk": risk,
            "iocNames": [alert.ioc_type] if alert.ioc_type else [],
            "subCategory": (alert.content_types[0] if alert.content_types else ""),
            "lastSeen": alert.last_seen,
            "hash": alert.data_hash,
            "iocValue": alert.ioc_value or "",
            "type": alert.type or "",
            "reportSeen": bool(alert.report_seen),
        }

    async def getAllAlerts(
            self,
            current_user,
            page: int = 1,
            limit: int = 20,
            alert_type: str | None = None,
            paginate: bool = False,
            compact: bool = False,
            unseen_only: bool = False,
            include_counts: bool = False):
        alerts_data = await self._engine.find_one(
            db_alert_model, db_alert_model.tenant_id == str(current_user.tenant_uuid))

        scan_status = await self.get_scan_status(current_user)
        if scan_status.get("scan_running", False):
            raise HTTPException(
                status_code=202, detail="Scan is still processing")

        if not alerts_data:
            if paginate:
                response: dict[str, Any] = {
                    "items": [],
                    "total": 0,
                    "page": page,
                    "limit": limit,
                    "has_more": False
                }
                if include_counts:
                    response["counts_by_type"] = {}
                return response
            return []

        alerts = alerts_data.alerts or []

        if alert_type:
            _type = alert_type.strip().lower()
            alerts = [alert for alert in alerts if (alert.type or "").strip().lower() == _type]

        if unseen_only:
            alerts = [alert for alert in alerts if not bool(alert.report_seen)]

        if not paginate:
            return alerts

        counts_by_type: dict[str, int] = {}
        if include_counts:
            for alert in alerts:
                key = (alert.type or "").strip().lower()
                if not key:
                    continue
                counts_by_type[key] = counts_by_type.get(key, 0) + 1

        sorted_alerts = sorted(
            alerts,
            key=lambda a: a.last_seen or a.first_seen or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True)
        total = len(sorted_alerts)
        start = (page - 1) * limit
        end = start + limit
        paged_alerts = sorted_alerts[start:end]

        items = [self._to_notification_item(alert) for alert in paged_alerts] if compact else paged_alerts

        response: dict[str, Any] = {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "has_more": end < total,
        }
        if include_counts:
            response["counts_by_type"] = counts_by_type
        return response

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
        await self._summary_helper.invalidate_alert_summary_cache(tenant_uuid)

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
        await self._summary_helper.invalidate_alert_summary_cache(tenant_uuid)

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

    async def get_scan_status_by_tenant_id(self, tenant_id):
        alerts_data = await self._engine.find_one(
            db_alert_model, db_alert_model.tenant_id == str(tenant_id))

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
