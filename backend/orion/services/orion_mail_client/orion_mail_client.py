from __future__ import annotations

import threading
from typing import Any, Dict
import httpx
from fastapi import HTTPException

from orion.api.server.sso_manager.constants.sso_constants import SSO_CONSTANTS
from orion.helper_manager.env_handler import env_handler
from orion.services.log_manager.log_controller import log


class orion_mail_client:
    __instance = None
    __lock = threading.Lock()

    @staticmethod
    def get_instance():
        if orion_mail_client.__instance is None:
            with orion_mail_client.__lock:
                if orion_mail_client.__instance is None:
                    orion_mail_client.__instance = orion_mail_client()
        return orion_mail_client.__instance

    def __init__(self):
        self._internal_url = str(
            env_handler.get_instance().env("ORION_MAIL_INTERNAL_URL", "http://orion-mail-web:8000") or ""
        ).strip().rstrip("/")
        self._secret = SSO_CONSTANTS.S_CLIENT_CREDENTIAL
        self._timeout = float(env_handler.get_instance().env("ORION_MAIL_CLIENT_TIMEOUT", "15.0"))

    def _headers(self) -> Dict[str, str]:
        return {
            "x-orion-mail-client-secret": self._secret,
            "Host": "localhost",
            "Content-Type": "application/json",
        }

    async def create_tenant_mailbox(self, tenant_id: str, tenant_slug: str, tenant_name: str) -> Dict[str, Any]:
        url = f"{self._internal_url}/api/internal/tenants/mailbox"
        payload = {
            "tenant_id": str(tenant_id),
            "tenant_slug": str(tenant_slug),
            "tenant_name": str(tenant_name),
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                res = await client.post(url, json=payload, headers=self._headers())
                if res.status_code >= 400:
                    log.g().e(f"Failed to create tenant mailbox in Orion Mail: {res.status_code} {res.text}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"Orion Mail mailbox creation failed: {res.text}",
                    )
                return res.json()
        except HTTPException:
            raise
        except Exception as exc:
            log.g().e(f"Error communicating with Orion Mail for mailbox creation: {exc}")
            raise HTTPException(
                status_code=502,
                detail=f"Unable to connect to Orion Mail service: {str(exc)}",
            ) from exc

    async def send_takedown_mail(self, tenant_id: str, to_email: str, subject: str, target_domain: str, custom_message: str = "", html_content: str = "", screenshot_base64: str = "", screenshot_filename: str = "", html_filename: str = "", takedown_id: str = "", body_html: str = "", body_text: str = "") -> Dict[str, Any]:
        url = f"{self._internal_url}/api/internal/takedown/send"
        payload = {
            "tenant_id": str(tenant_id),
            "to_email": str(to_email),
            "subject": str(subject),
            "target_domain": str(target_domain),
            "custom_message": custom_message or "",
            "html_content": html_content or "",
            "screenshot_base64": screenshot_base64 or "",
            "screenshot_filename": screenshot_filename or "",
            "html_filename": html_filename or "",
            "takedown_id": str(takedown_id or ""),
            "body_html": str(body_html or ""),
            "body_text": str(body_text or ""),
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                res = await client.post(url, json=payload, headers=self._headers())
                if res.status_code >= 400:
                    log.g().e(f"Failed to send takedown email via Orion Mail: {res.status_code} {res.text}")
                    raise HTTPException(status_code=502, detail=f"Orion Mail takedown dispatch failed: {res.text}")
                return res.json()
        except HTTPException:
            raise
        except Exception as exc:
            log.g().e(f"Error dispatching takedown email via Orion Mail: {exc}")
            raise HTTPException(status_code=502, detail=f"Unable to connect to Orion Mail service: {str(exc)}") from exc

    async def get_unread_takedown_count(self, tenant_id: str) -> int:
        url = f"{self._internal_url}/api/internal/takedown/unread-count"
        params = {"tenant_id": str(tenant_id)}
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                res = await client.get(url, params=params, headers=self._headers())
                if res.status_code == 200:
                    data = res.json()
                    return int(data.get("unread_count", 0))
                log.g().w(f"Orion Mail unread count returned {res.status_code}: {res.text}")
                return 0
        except Exception as exc:
            log.g().w(f"Could not retrieve unread takedown count from Orion Mail: {exc}")
            return 0

    async def get_tenant_mailbox_status(self, tenant_id: str) -> Dict[str, Any]:
        url = f"{self._internal_url}/api/internal/tenants/{str(tenant_id).strip()}/mailbox-status"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                res = await client.get(url, headers=self._headers())
                if res.status_code == 200:
                    return res.json()
                log.g().w(f"Orion Mail mailbox status returned {res.status_code}: {res.text}")
                return {
                    "mailbox_exists": False,
                    "keys_configured": False,
                    "mailbox_address": None,
                    "is_active": False,
                }
        except Exception as exc:
            log.g().w(f"Could not retrieve tenant mailbox status from Orion Mail: {exc}")
            return {
                "mailbox_exists": False,
                "keys_configured": False,
                "mailbox_address": None,
                "is_active": False,
            }

