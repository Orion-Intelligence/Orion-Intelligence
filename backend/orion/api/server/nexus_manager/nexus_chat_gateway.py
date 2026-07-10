from typing import Any

import httpx
from fastapi.responses import JSONResponse

from orion.helper_manager.env_handler import env_handler


class nexus_chat_gateway:
    __instance = None

    @staticmethod
    def getInstance():
        if nexus_chat_gateway.__instance is None:
            nexus_chat_gateway()
        return nexus_chat_gateway.__instance

    def __init__(self):
        if nexus_chat_gateway.__instance is not None:
            return
        nexus_chat_gateway.__instance = self

    def _base_url(self) -> str:
        return (env_handler.get_instance().env("DARKNEXUS_API_BASE") or "http://trusted-nexus-api:8030").strip().rstrip("/")

    @staticmethod
    def _headers(current_user) -> dict[str, str]:
        return {"X-User-Id": str(current_user.id), "X-Tenant-Id": str(current_user.tenant_uuid)}

    async def _call(self, method: str, path: str, current_user, json_body: dict[str, Any] | None = None) -> tuple[int, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.request(method=method, url=f"{self._base_url()}{path}", headers=self._headers(current_user), json=json_body, timeout=120)
        try:
            content = response.json()
        except Exception:
            content = {"detail": response.text or "Empty response from Nexus"}
        return response.status_code, content

    async def _request(self, method: str, path: str, current_user, json_body: dict[str, Any] | None = None):
        try:
            status_code, content = await self._call(method, path, current_user, json_body=json_body)
            return JSONResponse(status_code=status_code, content=content)
        except Exception:
            return JSONResponse(status_code=500, content={"detail": "Something happened while calling Nexus chat service"})

    async def create_chat(self, payload: dict[str, Any], current_user):
        return await self._request("POST", "/v1/chats", current_user, json_body=payload)

    async def list_chats(self, current_user):
        return await self._request("GET", "/v1/chats", current_user)

    async def get_chat(self, chat_id: str, current_user):
        return await self._request("GET", f"/v1/chats/{chat_id}", current_user)

    async def send_message(self, chat_id: str, payload: dict[str, Any], current_user):
        return await self._request("POST", f"/v1/chats/{chat_id}/messages", current_user, json_body=payload)

    async def rename_chat(self, chat_id: str, payload: dict[str, Any], current_user):
        return await self._request("PUT", f"/v1/chats/{chat_id}", current_user, json_body=payload)

    async def delete_chat(self, chat_id: str, current_user):
        return await self._request("DELETE", f"/v1/chats/{chat_id}", current_user)

    async def get_chat_history(self, payload: dict[str, Any], current_user):
        return await self._request("POST", "/v1/chats/history/get", current_user, json_body=payload)

    async def update_chat_history(self, payload: dict[str, Any], current_user):
        return await self._request("POST", "/v1/chats/history/update", current_user, json_body=payload)

    async def clear_chat_history(self, payload: dict[str, Any], current_user):
        return await self._request("POST", "/v1/chats/history/clear", current_user, json_body=payload)
