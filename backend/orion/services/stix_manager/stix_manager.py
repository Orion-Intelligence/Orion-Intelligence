from __future__ import annotations
from typing import Any, Dict, Optional
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import result_item as DefacementResultItem
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import result_item as ExploitResultItem
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import result_item as LeakResultItem
from orion.api.interactive.social_manager.social_models.search_social_callback_model import result_item as SocialResultItem
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import result_item as GeneralResultItem
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import result_item as ChatResultItem
from orion.api.interactive.search_manager.search_model import search_model
from orion.services.stix_manager.converters.chat_converter import chat_converter
from orion.services.stix_manager.converters.defacement_converter import defacement_converter
from orion.services.stix_manager.converters.exploit_converter import exploit_converter
from orion.services.stix_manager.converters.general_converter import general_converter
from orion.services.stix_manager.converters.leak_converter import leak_converter
from orion.services.stix_manager.converters.social_converter import social_converter


class stix_manager:
    __instance: stix_manager | None = None

    def __init__(self) -> None:
        if stix_manager.__instance is not None: raise Exception("This class is a singleton!")
        self._search_model = search_model.getInstance()
        stix_manager.__instance = self

    @staticmethod
    def get_instance() -> stix_manager:
        if stix_manager.__instance is None: stix_manager()
        return stix_manager.__instance  # type: ignore[return-value]

    async def get_defacement_stix(self, doc_id: str) -> Dict[str, Any]:
        raw = await self._search_model.request_defacement_doc(doc_id)
        if raw is None: return {"error": "No defacement document found", "doc_id": doc_id}
        return defacement_converter().convert(DefacementResultItem(**raw))

    async def get_exploit_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_exploit_doc(doc_id, lang)
        if raw is None: return {"error": "No exploit document found", "doc_id": doc_id}
        return exploit_converter().convert(ExploitResultItem(**raw))

    async def get_leak_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_leak_doc(doc_id, lang)
        if raw is None: return {"error": "No leak document found", "doc_id": doc_id}
        return leak_converter().convert(LeakResultItem(**raw))

    async def get_social_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_social_doc(doc_id, lang)
        if raw is None: return {"error": "No social document found", "doc_id": doc_id}
        return social_converter().convert(SocialResultItem(**raw))

    async def get_general_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_general_doc(doc_id, lang)
        if raw is None: return {"error": "No general document found", "doc_id": doc_id}
        return general_converter().convert(GeneralResultItem(**raw))

    async def get_chat_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_chat_doc(doc_id, lang)
        if raw is None: return {"error": "No chat document found", "doc_id": doc_id}
        return chat_converter().convert(ChatResultItem(**raw))