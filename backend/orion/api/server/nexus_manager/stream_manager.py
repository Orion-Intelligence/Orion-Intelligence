import asyncio
import ast
import json
import re
from typing import Any, AsyncGenerator

import httpx

from orion.api.interactive.account_manager.account_manager import AccountManager
from orion.api.server.nexus_manager.history_embeddings.history_embedding_manager import HistoryEmbeddingManager
from orion.api.server.nexus_manager.helper.chat_manager import ChatManager
from orion.api.server.nexus_manager.helper.tool_router import ToolRouter
from orion.api.server.nexus_manager.model.rpc_payload_model import NexusRpcPayloadModel


class NexusStreamManager:
    NOT_FOUND_RESPONSE = "The data you are looking for was not found."

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.tool_router = ToolRouter()
        self.active_chat_tasks: dict[str, asyncio.Task] = {}
        self.chat_manager = ChatManager(self.base_url, self.active_chat_tasks, self._stream)

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

    @staticmethod
    def _parse_stream_line(line: str) -> dict[str, Any] | None:
        line = line.strip()
        if not line or line.startswith(":"):
            return None
        if line.startswith("data:"):
            line = line[5:].strip()
        if not line:
            return None
        try:
            return json.loads(line)
        except json.JSONDecodeError:
            return None

    @staticmethod
    def _stream_output(parsed_line: dict[str, Any]) -> dict[str, Any]:
        output = parsed_line.get("output")
        if isinstance(output, dict):
            return output
        result = parsed_line.get("result")
        if isinstance(result, dict):
            structured_content = result.get("structuredContent")
            if isinstance(structured_content, dict):
                return structured_content
        return parsed_line

    async def get_recent_history(
        self,
        current_user,
        prompt: str = "",
        session_id: str | None = None,
    ) -> list[dict[str, str]]:
        try:
            stored_history = await AccountManager.get_instance().get_current_user_chat_history(
                current_user,
                include_embeddings=True,
                session_id=session_id,
            )
            return await HistoryEmbeddingManager.select_turns(prompt, stored_history.get("history") or [])
        except Exception:
            return []

    async def _stream(self,client: httpx.AsyncClient,endpoint: str,prompt: str,user_id: str,tool: str = "open_chat",type_name: str = "default",history: list[dict[str, str]] | None = None,payload: NexusRpcPayloadModel | None = None,recoverable: bool = False) -> AsyncGenerator[tuple[str, str, bool, Any], None]:
        response = None
        answer = ""
        try:
            if payload is None:
                selected_tool = tool or "open_chat"
                if selected_tool == "default":
                    selected_tool = "open_chat"
                arguments: dict[str, Any] = {
                    "prompt": prompt,
                    "user_id": user_id,
                    "tool": selected_tool,
                    "type": type_name or "default",
                }
                if recoverable:
                    arguments["recoverable"] = True
                if selected_tool == "api_payload":
                    arguments["api_name"] = type_name or "default"
                if history:
                    arguments["history"] = history
                payload = NexusRpcPayloadModel.tool_call(
                    request_id=user_id if recoverable else "nexus-chat",
                    name=selected_tool,
                    arguments=arguments,
                )
            request = client.build_request(
                "POST",
                endpoint,
                json=payload.model_dump(),
            )
            response = await client.send(request, stream=True)
            if response.status_code != 200:
                yield json.dumps({"output": {"response": (await response.aread()).decode("utf-8", errors="ignore")}, "done": True, "error": True}, ensure_ascii=True) + "\n", "", True, None
                return

            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    parsed_line = self._parse_stream_line(line)
                    if parsed_line is None:
                        continue
                    error_payload = parsed_line.get("error") or {}
                    error_message = error_payload.get("message") if isinstance(error_payload, dict) else ""
                    if error_message:
                        yield json.dumps({"output": {"response": error_message}, "done": True, "error": True}, ensure_ascii=True) + "\n", "", True, None
                        return

                    status_value = parsed_line.get("status")
                    if status_value:
                        yield json.dumps({"status": status_value, "done": False, "error": False}, ensure_ascii=True) + "\n", "", False, None

                    output = self._stream_output(parsed_line)
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

    async def stream_response(self, prompt: str, user_id: str, tool: str = "open_chat", type_name: str = "default", history: list[dict[str, str]] | None = None, recoverable: bool = False) -> AsyncGenerator[str, None]:
        endpoint = f"{self.base_url}/mcp"
        client = httpx.AsyncClient(timeout=30 * 60)
        current_task = asyncio.current_task()
        if current_task is not None:
            self.active_chat_tasks[user_id] = current_task
        try:
            async for line, answer, failed, tool_request in self._stream(client, endpoint, prompt, user_id, tool=tool, type_name=type_name, history=history, recoverable=recoverable):
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

                    async for summary_line, summary_answer, summary_failed, _ in self._stream(
                        client,
                        endpoint,
                        summary_prompt,
                        user_id,
                        tool="summarizer",
                        history=history,
                        recoverable=recoverable,
                    ):
                        if summary_line:
                            yield summary_line
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
