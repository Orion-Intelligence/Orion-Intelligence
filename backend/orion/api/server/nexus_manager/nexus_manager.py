import httpx
from fastapi.responses import StreamingResponse
from starlette.responses import JSONResponse

from orion.api.server.crawl_manager.class_model.report_chat_data_model import (
    NexusTextAnalysisRequest,
    ReportChatRequest,
)
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

    async def parse_chat(self, model: ReportChatRequest, user_id: str = "system"):
        try:
            return StreamingResponse(self.stream_manager.stream_response(model.message, user_id, tool=model.tool or "default", type_name=model.type or "default"), media_type="application/x-ndjson", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
        except Exception:
            return JSONResponse(status_code=500, content={"detail": "Something happened while calling api/chat"})

    async def cancel_chat(self, user_id: str = "system"):
        return await self.stream_manager.cancel_chat(user_id=user_id)

    async def clear_chat_session(self, current_user):
        return await self.stream_manager.clear_chat_session(current_user)

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
