import asyncio
import json
from typing import Any, AsyncGenerator

import httpx

from orion.api.interactive.account_manager.account_manager import AccountManager
from orion.api.server.nexus_manager.model.rpc_payload_model import NexusRpcPayloadModel


class ChatManager:
    def __init__(self, base_url: str, active_chat_tasks: dict[str, asyncio.Task], stream_callable: Any):
        self.base_url = base_url
        self.active_chat_tasks = active_chat_tasks
        self._stream = stream_callable

    async def resume_chat(self, user_id: str = "system") -> AsyncGenerator[str, None]:
        endpoint = f"{self.base_url}/mcp"
        client = httpx.AsyncClient(timeout=30 * 60)
        try:
            payload = NexusRpcPayloadModel.tool_resume(request_id=user_id, user_id=user_id)
            async for line, answer, failed, _ in self._stream(client, endpoint, "", user_id, payload=payload):
                if line:
                    yield line
                if failed:
                    return
                if answer:
                    yield json.dumps({"output": {"response": answer.strip()}, "done": True, "error": False}, ensure_ascii=True) + "\n"
                    return
        except Exception as _:
            yield json.dumps({"output": {"response": "Something happened while calling api/chat"}, "done": True, "error": True}, ensure_ascii=True) + "\n"
        finally:
            await client.aclose()

    async def cancel_chat(self, user_id: str = "system") -> dict[str, bool]:
        local_task = self.active_chat_tasks.pop(user_id, None)
        if local_task is not None and not local_task.done():
            local_task.cancel()
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{self.base_url}/mcp",
                    json=NexusRpcPayloadModel.tool_cancel(request_id=user_id, user_id=user_id).model_dump(),
                )
                payload = response.json() if response.status_code == 200 else {}
                result = payload.get("result") if isinstance(payload, dict) else {}
                nexus_cancelled = bool(result.get("cancelled")) if isinstance(result, dict) else False
        except Exception:
            nexus_cancelled = False
        return {"cancelled": local_task is not None or nexus_cancelled}

    async def clear_chat_session(self, current_user):
        return await AccountManager.get_instance().clear_current_user_chat_history(current_user)
