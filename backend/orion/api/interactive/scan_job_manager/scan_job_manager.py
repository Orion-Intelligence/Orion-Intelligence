from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import httpx
from bson import ObjectId
from fastapi import HTTPException, status
from odmantic.query import desc

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.scan_job_manager.scan_routes_enum import SCAN_ROUTES
from orion.helper_manager.env_handler import env_handler
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_scan_job_model import ScanJobStatus, db_scan_job_model


class ScanJobManager:
    __instance = None

    @staticmethod
    def get_instance():
        if ScanJobManager.__instance is None:
            ScanJobManager()
        return ScanJobManager.__instance

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        ScanJobManager.__instance = self

    @classmethod
    def is_terminal_status(self, scan_status: str | ScanJobStatus | None) -> bool:
        return str(scan_status or "").strip().lower() in {ScanJobStatus.DONE.value, ScanJobStatus.ERROR.value, ScanJobStatus.CANCELLED.value, ScanJobStatus.EXPIRED.value}

    @staticmethod
    def _normalize_api_reference(api_reference: str) -> str:
        return (api_reference or "").strip().lstrip("/").removeprefix("api/")

    def _route_config(self, api_reference: str) -> Dict[str, str]:
        config = SCAN_ROUTES.get(self._normalize_api_reference(api_reference))
        if not config:
            raise HTTPException(status_code=400, detail=f"Unsupported scan API reference: {api_reference}")
        return config

    @staticmethod
    def _get_target(payload: Dict[str, Any], target_key: str) -> str:
        value = payload.get(target_key)
        if isinstance(value, dict):
            for nested in value.values():
                if nested:
                    return str(nested)
            return ""
        if isinstance(value, list):
            return ", ".join(str(item) for item in value[:3])
        return str(value or "")

    @classmethod
    def _job_status_from_response(self, response: Dict[str, Any]) -> ScanJobStatus:
        result = response.get("result")
        if isinstance(result, dict) and result.get("status"):
            response_status = str(result.get("status")).strip().lower()
        else:
            response_status = str(response.get("status") or "").strip().lower()

        if response_status in {"error", "failed", "failure"}:
            return ScanJobStatus.ERROR
        if response_status in {"done", "success", "completed", "complete"}:
            return ScanJobStatus.DONE
        if response_status in {"pending", "busy", "queued", "running", "started"}:
            return ScanJobStatus.RUNNING
        if response.get("error") or response.get("detail"):
            return ScanJobStatus.ERROR
        return ScanJobStatus.DONE

    @staticmethod
    def _serialize_poll_response(job: db_scan_job_model) -> Dict[str, Any]:
        return {
            "response": job.response,
            "seen": job.seen,
            "updated_at": job.updated_at,
            "completed_at": job.completed_at,
        }

    def _serialize_scan_job(self, job: db_scan_job_model, status_value: Optional[str] = None, target: Optional[str] = None) -> Dict[str, Any]:
        config = SCAN_ROUTES.get(self._normalize_api_reference(job.api_reference), {})
        response = job.response or {}
        if status_value is None:
            status_value = (self._job_status_from_response(response) if response else ScanJobStatus.QUEUED).value
        return {
            "scan_id": str(job.id),
            "title": job.title,
            "target": target if target is not None else self._get_target(job.payload, config.get("target_key", "")),
            "payload": job.payload,
            "response": job.response,
            "seen": job.seen,
            "status": status_value,
            "created_at": job.created_at,
            "updated_at": job.updated_at,
            "completed_at": job.completed_at,
        }

    async def create_job(self, current_user, api_reference: str, payload: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None, force_new: bool = False) -> Dict[str, Any]:
        config = self._route_config(api_reference)
        metadata = metadata or {}
        now = datetime.utcnow()
        target = str(metadata.get("target") or self._get_target(payload, config.get("target_key", "")))
        normalized_api_reference = f"/api/{self._normalize_api_reference(api_reference)}" #self._complete_api_reference(api_reference)

        existing_records = await self._engine.find(db_scan_job_model, (db_scan_job_model.user_uuid == str(current_user.id)) & (db_scan_job_model.api_reference == normalized_api_reference), sort=desc(db_scan_job_model.created_at))
        latest_done_scan = None
        for record in existing_records:
            if record.payload != payload:
                continue
            response = record.response or {}
            scan_status = self._job_status_from_response(response) if response else ScanJobStatus.QUEUED
            if not self.is_terminal_status(scan_status.value):
                return {**self._serialize_scan_job(record, scan_status.value), "source": "existing_running"}
            if scan_status == ScanJobStatus.DONE and latest_done_scan is None:
                latest_done_scan = record

        if latest_done_scan and not force_new:
            completed_at = latest_done_scan.completed_at or latest_done_scan.updated_at or latest_done_scan.created_at
            previous_scan = {**self._serialize_scan_job(latest_done_scan, ScanJobStatus.DONE.value), "source": "previous_completed"}
            if completed_at >= now - timedelta(days=3):
                return previous_scan
            return {
                "requires_confirmation": True,
                "message": "You already scanned this before. Do you want to use the previous result or run a new scan?",
                "previous_scan": previous_scan,
            }

        job = db_scan_job_model(
            user_uuid=str(current_user.id),
            api_reference=normalized_api_reference,
            title=str(metadata.get("title") or api_reference),
            payload=payload,
            created_at=now,
            updated_at=now,
        )
        await self._engine.save(job)
        try:
            await AuditLogManager.get_instance().search_audit(current_user, api_reference.replace("/", "_"), target)
        except Exception:
            pass
        return {**self._serialize_scan_job(job, ScanJobStatus.QUEUED.value, target), "source": "new"}

    async def list_scan_notifications(self, current_user, page: int = 1, limit: int = 8) -> Dict[str, Any]:
        safe_limit = max(1, min(int(limit or 8), 100))
        safe_page = max(1, int(page or 1))
        skip = (safe_page - 1) * safe_limit

        records = await self._engine.find(db_scan_job_model, db_scan_job_model.user_uuid == str(current_user.id), sort=desc(db_scan_job_model.created_at), skip=skip, limit=safe_limit)
        total = await self._engine.count(db_scan_job_model, db_scan_job_model.user_uuid == str(current_user.id))
        items = []
        for record in records:
            config = SCAN_ROUTES.get(self._normalize_api_reference(record.api_reference), {})
            items.append({
                "scan_id": str(record.id),
                "title": record.title,
                "target": self._get_target(record.payload, config.get("target_key", "")),
                "response": record.response,
                "seen": record.seen,
                "created_at": record.created_at,
                "updated_at": record.updated_at,
                "completed_at": record.completed_at,
            })
        return {
            "items": items,
            "page": safe_page,
            "limit": safe_limit,
            "total": total,
            "has_more": skip + len(items) < total
        }

    async def list_incomplete_scans(self, current_user, limit: int = 1) -> Dict[str, Any]:
        safe_limit = max(1, min(int(limit or 1), 100))
        records = await self._engine.find(db_scan_job_model, db_scan_job_model.user_uuid == str(current_user.id), sort=desc(db_scan_job_model.created_at))
        incomplete_records = []
        for record in records:
            response = record.response or {}
            scan_status = self._job_status_from_response(response) if response else ScanJobStatus.QUEUED
            if not self.is_terminal_status(scan_status.value):
                incomplete_records.append(record)

        items = [{"scan_id": str(record.id), "payload": record.payload} for record in incomplete_records[:safe_limit]]
        return { "items": items, "page": 1, "limit": safe_limit, "total": len(incomplete_records), "has_more": 0 + len(items) < len(incomplete_records) }


    async def count_jobs(self, current_user) -> Dict[str, int]:
        query: Dict[str, Any] = {"user_uuid": str(current_user.id)}
        records = await self._engine.find(db_scan_job_model, query, sort=desc(db_scan_job_model.created_at))

        return { "total": len(records) }

    async def poll_job(self, scan_id: str, current_user) -> Dict[str, Any]:
        job = await self._engine.find_one(db_scan_job_model, (db_scan_job_model.id == ObjectId(scan_id)) & (db_scan_job_model.user_uuid == str(current_user.id)))
        if not job:
            raise HTTPException(status_code=404, detail="Scan job not found")

        response = job.response or {}
        scan_status = self._job_status_from_response(response) if response else ScanJobStatus.QUEUED
        if self.is_terminal_status(scan_status.value):
            return self._serialize_poll_response(job)

        config = self._route_config(job.api_reference)
        base_url = env_handler.get_instance().env("NETWORK_API_BASE")
        upstream_url = f"{base_url}/{config['path'].strip('/')}/{job.user_uuid}"

        now = datetime.utcnow()
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(upstream_url, json=job.payload)
        except Exception as exc:
            job.response = {"status": ScanJobStatus.ERROR.value, "detail": "Unable to reach trusted scan service", "step": "failed"}
            job.updated_at = now
            job.completed_at = now
            await self._engine.save(job)
            raise HTTPException(status_code=502, detail=job.response["detail"]) from exc

        try:
            response_json = response.json()
        except ValueError:
            response_json = {"detail": response.text}

        job.response = response_json if isinstance(response_json, dict) else {"result": response_json}
        job.updated_at = now

        if response.status_code != status.HTTP_200_OK:
            job.response = {"status": ScanJobStatus.ERROR.value, "detail": response.text, "step": "failed", "response": job.response}
            job.completed_at = now
            await self._engine.save(job)
            raise HTTPException(status_code=response.status_code, detail=f"Error from trusted-micros-api: {response.text}")

        computed_status = self._job_status_from_response(job.response)
        if computed_status in {ScanJobStatus.DONE, ScanJobStatus.ERROR}:
            job.completed_at = now

        await self._engine.save(job)
        return self._serialize_poll_response(job)

    async def mark_seen(self, scan_id: str, current_user) -> Dict[str, Any]:
        job = await self._engine.find_one(db_scan_job_model, (db_scan_job_model.id == ObjectId(scan_id)) & (db_scan_job_model.user_uuid == str(current_user.id)))
        if not job:
            raise HTTPException(status_code=404, detail="Scan job not found")
        job.seen = True
        job.updated_at = datetime.utcnow()
        await self._engine.save(job)
        return {"message": "Scan marked as seen"}

    async def delete_job(self, scan_id: str, current_user) -> Dict[str, Any]:
        job = await self._engine.find_one(db_scan_job_model, (db_scan_job_model.id == ObjectId(scan_id)) & (db_scan_job_model.user_uuid == str(current_user.id)))
        if not job:
            raise HTTPException(status_code=404, detail="Scan job not found")

        await self._engine.delete(job)
        return {"message": "Scan deleted"}

    async def delete_completed_jobs(self, current_user) -> Dict[str, Any]:
        records = await self._engine.find(db_scan_job_model, db_scan_job_model.user_uuid == str(current_user.id))
        deleted_count = 0
        skipped_count = 0

        for record in records:
            response = record.response or {}
            scan_status = self._job_status_from_response(response) if response else ScanJobStatus.QUEUED
            if not self.is_terminal_status(scan_status.value):
                skipped_count += 1
                continue
            await self._engine.delete(record)
            deleted_count += 1

        return {"message": "Scans deleted", "deleted": deleted_count, "skipped": skipped_count}
