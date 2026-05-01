import asyncio
import json

import httpx
from fastapi.responses import StreamingResponse
from starlette.responses import JSONResponse

from orion.api.server.crawl_manager.class_model.report_chat_data_model import NexusTextAnalysisRequest, ReportChatRequest
from orion.helper_manager.env_handler import env_handler


class nexus_manager:
    __instance = None

    @staticmethod
    def getInstance():
        if nexus_manager.__instance is None:
            nexus_manager()
        return nexus_manager.__instance

    def __init__(self):
        if nexus_manager.__instance is None:
            nexus_manager.__instance = self

    @staticmethod
    def _base_url() -> str:
        return (env_handler.get_instance().env("DARKNEXUS_API_BASE") or "http://trusted-nexus-api:8030").strip().rstrip("/")

    @staticmethod
    async def parse_chat(model: ReportChatRequest, user_id: str = "system", stream: bool = False):
        try:
            base_url = nexus_manager._base_url()
            has_report = bool((model.report or "").strip())

            if stream:
                endpoint = f"{base_url}/mcp"
                nexus_payload = {
                    "jsonrpc": "2.0",
                    "id": "nexus-chat",
                    "method": "tools/call",
                    "params": {
                        "name": "ai_chat",
                        "arguments": {"prompt": model.message, "user_id": user_id, "stream": True},
                    },
                }

                async def stream_response():
                    client = httpx.AsyncClient(timeout=None)
                    response = None
                    try:
                        request = client.build_request("POST", endpoint, json=nexus_payload)
                        response = await client.send(request, stream=True)
                        if response.status_code != 200:
                            raw = (await response.aread()).decode("utf-8", errors="ignore")
                            message = "Nexus is busy finishing the previous chat. Try again in a moment."
                            if response.status_code != 429 and raw.strip():
                                message = raw.strip()
                            yield json.dumps({"output": {"response": message}, "done": True, "error": True}, ensure_ascii=True) + "\n"
                            return
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    parsed_line = json.loads(line)
                                    error_message = (parsed_line.get("error") or {}).get("message")
                                    if error_message:
                                        if "stream is already active" in error_message.lower():
                                            error_message = "Nexus is still finishing the previous chat. Try again in a moment."
                                        yield json.dumps({"output": {"response": error_message}, "done": True, "error": True}, ensure_ascii=True) + "\n"
                                        return
                                except Exception:
                                    pass
                                yield f"{line}\n"
                    except asyncio.CancelledError:
                        raise
                    except (httpx.RemoteProtocolError, httpx.ReadError):
                        yield json.dumps({"output": {"response": "Nexus closed the stream before finishing. Try again in a moment."}, "done": True, "error": True}, ensure_ascii=True) + "\n"
                    finally:
                        if response is not None:
                            await response.aclose()
                        await client.aclose()

                return StreamingResponse(
                    stream_response(),
                    media_type="application/x-ndjson",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
                )

            endpoint = f"{base_url}/nlp/chat/report/{user_id}" if has_report else f"{base_url}/api/chat/{user_id}"
            nexus_payload = model.model_dump() if has_report else {"prompt": model.message}
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    endpoint, json=nexus_payload, timeout=120)
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling api/chat"})
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500, content={"detail": "Something happened while calling api/chat"})

    @staticmethod
    async def cancel_chat(user_id: str = "system"):
        try:
            base_url = nexus_manager._base_url()
            payload = {
                "jsonrpc": "2.0",
                "id": "nexus-chat-cancel",
                "method": "tools/cancel",
                "params": {"user_id": user_id},
            }
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(f"{base_url}/mcp", json=payload)
                if response.status_code != 200:
                    return {"cancelled": False, "status_code": response.status_code}
                result = response.json()
                return result.get("result") or result
        except Exception:
            return {"cancelled": False}

    @staticmethod
    async def clear_chat_session(user_id: str = "system"):
        try:
            base_url = nexus_manager._base_url()
            payload = {
                "jsonrpc": "2.0",
                "id": "nexus-chat-clear-session",
                "method": "tools/call",
                "params": {
                    "name": "clear_session",
                    "arguments": {"user_id": user_id},
                },
            }
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(f"{base_url}/mcp", json=payload)
                if response.status_code != 200:
                    return {"cleared": False, "status_code": response.status_code}
                result = response.json()
                return result.get("result") or result
        except Exception:
            return {"cleared": False}

    @staticmethod
    async def analyze_text(model: NexusTextAnalysisRequest, user_id: str = "system"):
        try:
            base_url = nexus_manager._base_url()
            payload = model.model_dump()
            payload["job_id"] = payload.get("job_id") or user_id

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{base_url}/ocr_classifier/analyze_text", json=payload, timeout=120)
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling ocr_classifier/analyze_text"})
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500, content={"detail": "Something happened while calling ocr_classifier/analyze_text"})
