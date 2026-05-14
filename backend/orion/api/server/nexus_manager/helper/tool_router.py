import asyncio
from typing import Any

from fastapi import HTTPException, status

from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import (
    search_dynamic_crack_model,
    search_dynamic_crypto_model,
    search_dynamic_param_model,
    search_dynamic_social_model,
)
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.crawl_manager.class_model.report_chat_data_model import (
    NexusTextAnalysisRequest,
)


class ToolRouter:
    POLL_INTERVAL_SECONDS = 2
    PENDING_STATUSES = {"pending", "processing", "running", "busy"}

    DYNAMIC_ROUTES = {
        "/api/dynamic/user": (search_dynamic_param_model, "user"),
        "/api/dynamic/social": (search_dynamic_social_model, "social"),
        "/api/dynamic/national-identity": (search_dynamic_crack_model, "pak_database"),
        "/api/dynamic/cracked": (search_dynamic_crack_model, "cracked"),
        "/api/dynamic/software": (search_dynamic_crack_model, "software"),
        "/api/crypto/scan": (search_dynamic_crypto_model, "crypto"),
    }

    @classmethod
    def _is_pending_response(cls, response: Any) -> bool:
        if not isinstance(response, dict):
            return False
        top_status = str(response.get("status") or "").lower()
        nested_result = response.get("result") if isinstance(response.get("result"), dict) else {}
        nested_status = str(nested_result.get("status") or "").lower()
        return top_status in cls.PENDING_STATUSES or nested_status in cls.PENDING_STATUSES

    @staticmethod
    def _is_failed_pending_response(response: Any) -> bool:
        if not isinstance(response, dict):
            return False
        nested_result = response.get("result") if isinstance(response.get("result"), dict) else {}
        status_value = response.get("status") or nested_result.get("status")
        progress_value = nested_result.get("progress", response.get("progress"))
        step_value = nested_result.get("step", response.get("step"))
        return status_value == "pending" and progress_value == 0 and step_value == "failed"

    async def _dynamic_search_until_complete(self, model: Any, route_name: str, user_id: str):
        result = await search_model.getInstance().dynamic_search(model, route_name, user_id=user_id)
        while self._is_pending_response(result) and not self._is_failed_pending_response(result):
            await asyncio.sleep(self.POLL_INTERVAL_SECONDS)
            result = await search_model.getInstance().dynamic_search(model, route_name, user_id=user_id)
        return result

    async def request(self, api_name: str, payload: dict[str, Any], user_id: str = "system"):
        if api_name in self.DYNAMIC_ROUTES:
            model_class, route_name = self.DYNAMIC_ROUTES[api_name]
            model = model_class.model_validate(payload or {})
            return await self._dynamic_search_until_complete(model, route_name, user_id)

        if api_name == "/api/dynamic/wanted":
            model = search_dynamic_social_model.model_validate(payload or {})
            return await search_model.getInstance().search_wanted_list(model)

        if api_name == "/api/nexus/analyze-text":
            from orion.api.server.nexus_manager.nexus_manager import nexus_manager

            model = NexusTextAnalysisRequest.model_validate(payload or {})
            return await nexus_manager.getInstance().analyze_text(model, user_id=user_id)

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool route not found")
