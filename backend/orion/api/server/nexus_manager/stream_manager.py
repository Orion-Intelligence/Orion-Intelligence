import asyncio
import ast
import json
import re

import httpx

from orion.api.interactive.account_manager.account_manager import AccountManager
from orion.api.server.nexus_manager.helper.tool_router import ToolRouter
from orion.api.server.nexus_manager.model.rpc_payload_model import NexusRpcPayloadModel


class NexusStreamManager:
    NOT_FOUND_RESPONSE = "The data you are looking for was not found."

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.tool_router = ToolRouter()
        self.active_chat_tasks: dict[str, asyncio.Task] = {}

    @staticmethod
    def _has_results(tool_response) -> bool:
        if isinstance(tool_response, str):
            try:
                tool_response = ast.literal_eval(tool_response)
            except (ValueError, SyntaxError):
                return bool(tool_response)
        if isinstance(tool_response, list):
            return bool(tool_response)
        if isinstance(tool_response, dict):
            if "total" in tool_response:
                try:
                    return int(tool_response.get("total") or 0) > 0
                except (TypeError, ValueError):
                    return bool(tool_response.get("total"))
            if "Result" in tool_response:
                return bool(tool_response.get("Result"))
            return bool(tool_response)
        result = getattr(tool_response, "Result", None)
        if result is not None:
            return bool(result)
        return bool(tool_response)

    @staticmethod
    def _clean_summary_answer(answer: str) -> str:
        answer = answer.strip()
        answer = re.sub(
            r"^(?:based on|from|according to)\s+(?:the\s+)?(?:provided\s+)?(?:api\s+)?(?:response|data|results),?\s*",
            "",
            answer,
            flags=re.IGNORECASE,
        )
        answer = re.sub(r"^(?:it appears that|the result matches(?: the original user query)?[:,]?)\s*", "", answer, flags=re.IGNORECASE)
        return answer.strip()

    async def _stream(self, client: httpx.AsyncClient, endpoint: str, prompt: str, user_id: str, tool: str = "default", type_name: str = "default"):
        response = None
        answer = ""
        try:
            request = client.build_request(
                "POST",
                endpoint,
                json=NexusRpcPayloadModel.tool_call(
                    request_id="nexus-chat",
                    name="ai_chat",
                    arguments={"prompt": prompt, "user_id": user_id, "tool": tool or "default", "type": type_name or "default"},
                ).model_dump(),
            )
            response = await client.send(request, stream=True)
            if response.status_code != 200:
                yield json.dumps({"output": {"response": (await response.aread()).decode("utf-8", errors="ignore")}, "done": True, "error": True}, ensure_ascii=True) + "\n", "", True, None
                return

            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    parsed_line = json.loads(line)
                    error_message = (parsed_line.get("error") or {}).get("message")
                    if error_message:
                        yield json.dumps({"output": {"response": error_message}, "done": True, "error": True}, ensure_ascii=True) + "\n", "", True, None
                        return

                    output = parsed_line.get("output") or {}
                    response_type = output.get("response_type") or parsed_line.get("response_type")
                    if response_type == "api_pipeline":
                        tool_request = output["response"]
                        await response.aclose()
                        response = None
                        yield "", answer, False, tool_request
                        return

                    if output.get("response") is not None:
                        response_value = output["response"]
                        if response_type == "finished":
                            yield "", str(response_value), False, None
                            return
                        answer = str(response_value)
                except Exception:
                    yield f"{line}\n", "", False, None
            yield "", answer, False, None
        finally:
            if response is not None:
                await response.aclose()

    async def stream_response(self, prompt: str, user_id: str, tool: str = "default", type_name: str = "default"):
        endpoint = f"{self.base_url}/mcp"
        client = httpx.AsyncClient(timeout=None)
        current_task = asyncio.current_task()
        if current_task is not None:
            self.active_chat_tasks[user_id] = current_task
        try:
            async for line, answer, failed, tool_request in self._stream(client, endpoint, prompt, user_id, tool=tool, type_name=type_name):
                if line:
                    yield line
                if failed:
                    return
                if tool_request:
                    tool_request = json.loads(tool_request)
                    tool_response = await self.tool_router.request(tool_request["api_name"], tool_request.get("payload") or {}, user_id=user_id)

                    if not self._has_results(tool_response):
                        yield json.dumps({"output": {"response": self.NOT_FOUND_RESPONSE}, "done": True, "error": False}, ensure_ascii=True) + "\n"
                        return

                    summary_prompt = (
                        f"Original user query:\n{prompt}\n\n"
                        f"Generated request details:\n{json.dumps(tool_request.get('payload') or {}, ensure_ascii=True, default=str)}\n\n"
                        f"Relevant data:\n{json.dumps(tool_response, ensure_ascii=True, default=str)}\n\n"
                    )

                    async for summary_line, summary_answer, summary_failed, _ in self._stream(client, endpoint, summary_prompt, user_id, tool="final_summary"):
                        if summary_failed:
                            return
                        if summary_answer:
                            yield json.dumps({"output": {"response": self._clean_summary_answer(summary_answer)}, "done": True, "error": False}, ensure_ascii=True) + "\n"
                            return
                    return
                if answer:
                    yield json.dumps({"output": {"response": answer.strip()}, "done": True, "error": False}, ensure_ascii=True) + "\n"
                    return
        except Exception as _:
            yield json.dumps({"output": {"response": "Something happened while calling api/chat"}, "done": True, "error": True}, ensure_ascii=True) + "\n"
        finally:
            if self.active_chat_tasks.get(user_id) is current_task:
                self.active_chat_tasks.pop(user_id, None)
            await client.aclose()

    async def cancel_chat(self, user_id: str = "system"):
        local_task = self.active_chat_tasks.pop(user_id, None)
        if local_task is not None and not local_task.done():
            local_task.cancel()
        return {"cancelled": local_task is not None}

    async def clear_chat_session(self, current_user):
        return await AccountManager.get_instance().clear_current_user_chat_history(current_user)
