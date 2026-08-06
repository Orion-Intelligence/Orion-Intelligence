from typing import Any, Optional
from urllib.parse import quote

import httpx
from fastapi.responses import JSONResponse, Response

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
        return (
            env_handler.get_instance().env("DARKNEXUS_API_BASE")
            or "http://trusted-nexus-api:8030"
        ).strip().rstrip("/")

    def _headers(self, current_user) -> dict[str, str]:
        return {
            "X-User-Id": str(current_user.id),
        }

    async def _request(self, method: str, path: str, current_user, json_body: Optional[dict[str, Any]] = None):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,
                    url=f"{self._base_url()}{path}",
                    headers=self._headers(current_user),
                    json=json_body,
                    timeout=120,
                )

            try:
                content = response.json()
            except Exception:
                content = {"detail": response.text or "Empty response from Nexus"}

            if response.status_code < 200 or response.status_code >= 300:
                return JSONResponse(
                    status_code=response.status_code,
                    content=content,
                )

            return JSONResponse(
                status_code=response.status_code,
                content=content,
            )

        except Exception:
            return JSONResponse(
                status_code=500,
                content={"detail": "Something happened while calling Nexus chat service"},
            )

    async def create_chat(self, payload: dict[str, Any], current_user):
        return await self._request(
            method="POST",
            path="/v1/chats",
            current_user=current_user,
            json_body=payload,
        )

    async def list_chats(self, current_user):
        return await self._request(
            method="GET",
            path="/v1/chats",
            current_user=current_user,
        )

    async def delete_all_chats(self, current_user):
        return await self._request(
            method="DELETE",
            path="/v1/chats",
            current_user=current_user,
        )

    async def get_chat(self, session_id: str, current_user):
        return await self._request(
            method="GET",
            path=f"/v1/chats/{session_id}",
            current_user=current_user,
        )

    async def get_chat_history(self, payload: dict[str, Any], current_user):
        return await self._request(method="POST", path="/v1/chats/history/get", current_user=current_user, json_body=payload)

    async def update_chat_history(self, payload: dict[str, Any], current_user):
        return await self._request(method="POST", path="/v1/chats/history/update", current_user=current_user, json_body=payload)

    async def clear_chat_history(self, payload: dict[str, Any], current_user):
        return await self._request(method="POST", path="/v1/chats/history/clear", current_user=current_user, json_body=payload)

    async def send_message(self, session_id: str, payload: dict[str, Any], current_user):
        return await self._request(
            method="POST",
            path=f"/v1/chats/{session_id}/messages",
            current_user=current_user,
            json_body=payload,
        )

    async def rename_chat(self, session_id: str, payload: dict[str, Any], current_user):
        return await self._request(
            method="PUT",
            path=f"/v1/chats/{session_id}",
            current_user=current_user,
            json_body=payload,
        )

    async def delete_chat(self, session_id: str, current_user):
        return await self._request(
            method="DELETE",
            path=f"/v1/chats/{session_id}",
            current_user=current_user,
        )

    async def download_user_file(self, file_name: str, current_user):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"http://172.18.0.1:8300/downloads/{quote(file_name, safe='')}",
                    headers=self._headers(current_user),
                    timeout=1500,
                )
            if response.status_code != 200:
                return JSONResponse(status_code=response.status_code, content={"detail": response.text or "File not found."})
            headers = {}
            if response.headers.get("content-disposition"):
                headers["content-disposition"] = response.headers["content-disposition"]
            return Response(content=response.content, media_type=response.headers.get("content-type") or "application/octet-stream", headers=headers)
        except Exception:
            return JSONResponse(status_code=500, content={"detail": "Something happened while downloading Nexus file"})

    async def import_github_repo(self, session_id: str, payload: dict[str, Any], current_user):
        return await self._request(
            method="POST",
            path=f"/v1/chats/{session_id}/workspace/github/import",
            current_user=current_user,
            json_body=payload,
        )

    async def get_workspace_status(self, session_id: str, current_user):
        return await self._request(
            method="GET",
            path=f"/v1/chats/{session_id}/workspace/status",
            current_user=current_user,
        )

    async def get_workspace_tree(self, session_id: str, current_user, folder_path: str = ""):
        encoded_path = quote(folder_path, safe="")

        return await self._request(
            method="GET",
            path=f"/v1/chats/{session_id}/workspace/tree?path={encoded_path}",
            current_user=current_user,
        )

    async def read_workspace_file(self, session_id: str, current_user, file_path: str, start_line: int = 1, line_count: int = 1000):
        encoded_path = quote(file_path, safe="")

        return await self._request(
            method="GET",
            path=(
                f"/v1/chats/{session_id}/workspace/file"
                f"?path={encoded_path}"
                f"&start_line={start_line}"
                f"&line_count={line_count}"
            ),
            current_user=current_user,
        )
