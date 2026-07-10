import httpx
from fastapi.responses import StreamingResponse
from starlette.responses import JSONResponse

from orion.api.server.nexus_manager.model.nexus_chat_model import NexusTextAnalysisRequest, ReportChatRequest
from orion.api.server.nexus_manager.nexus_chat_gateway import nexus_chat_gateway
from orion.api.server.nexus_manager.stream_manager import NexusStreamManager
from orion.helper_manager.env_handler import env_handler


class nexus_manager:
    __instance = None

    @classmethod
    def getInstance(cls):
        if cls.__instance is None:
            cls()
        return cls.__instance

    def __init__(self):
        self.base_url = (env_handler.get_instance().env("DARKNEXUS_API_BASE") or "http://trusted-nexus-api:8030").strip().rstrip("/")
        self.stream_manager = NexusStreamManager(self.base_url)
        if type(self).__instance is None:
            type(self).__instance = self

    async def parse_chat(self, model: ReportChatRequest, user_id: str = "system", current_user=None, recoverable: bool = False, auth_token: str = ""):
        try:
            session_id = str(model.session_id or "").strip()
            session_type = str(model.session_type or "persistent").strip() or "persistent"
            history: list[dict[str, str]] = []
            if current_user is not None:
                context = await nexus_chat_gateway.getInstance().select_chat_context({"prompt": model.message, "session_id": session_id, "session_type": session_type}, current_user)
                history = context.get("history") or []
                session_id = str(context.get("session_id") or session_id or "").strip()
                session_type = str(context.get("session_type") or session_type or "persistent").strip()
            stream = self._stream_chat_and_save_session_result(
                model,
                user_id=user_id,
                current_user=current_user,
                history=history,
                session_id=session_id,
                session_type=session_type,
                recoverable=recoverable,
                auth_token=auth_token,
            )
            return StreamingResponse(stream, media_type="application/x-ndjson", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
        except Exception:
            return JSONResponse(status_code=500, content={"detail": "Something happened while calling api/chat"})

    async def cancel_chat(self, user_id: str = "system"):
        return await self.stream_manager.chat_manager.cancel_chat(user_id=user_id)

    async def resume_chat(self, user_id: str = "system"):
        stream = self.stream_manager.chat_manager.resume_chat(user_id=user_id)
        return StreamingResponse(stream, media_type="application/x-ndjson", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    async def clear_chat_session(self, current_user, session_id: str | None = None):
        return await self.stream_manager.chat_manager.clear_chat_session(current_user, session_id=session_id)

    async def _stream_chat_and_save_session_result(self, model: ReportChatRequest, user_id: str, current_user, history: list[dict[str, str]], session_id: str, session_type: str, recoverable: bool = False, auth_token: str = ""):
        final_answer = ""
        async for chunk in self.stream_manager.stream_response(
            model.message,
            user_id,
            tool=model.tool or "open_chat",
            type_name=model.type or "default",
            history=history,
            recoverable=recoverable,
            auth_token=auth_token,
        ):
            parsed_chunk = self.stream_manager._parse_stream_line(chunk)
            output = self.stream_manager._stream_output(parsed_chunk or {})
            if parsed_chunk and parsed_chunk.get("done") is True and not parsed_chunk.get("error") and output.get("response") is not None:
                final_answer = str(output.get("response") or "").strip()
            yield chunk

        if not final_answer or current_user is None:
            return

        if session_type == "temporary":
            await nexus_chat_gateway.getInstance().append_chat_turn({"message": model.message, "response": final_answer, "session_id": session_id, "session_type": session_type}, current_user)

    async def analyze_text(self, model: NexusTextAnalysisRequest, user_id: str = "system"):
        try:
            payload = model.model_dump()
            payload["job_id"] = payload.get("job_id") or user_id

            async with httpx.AsyncClient() as client:
                response = await client.post(f"{self.base_url}/ocr_classifier/analyze_text", json=payload, timeout=120)
                if response.status_code != 200:
                    return JSONResponse(status_code=response.status_code, content={"detail": "Something happened while calling ocr_classifier/analyze_text"})
                return response.json()
        except Exception:
            return JSONResponse(status_code=500, content={"detail": "Something happened while calling ocr_classifier/analyze_text"})
