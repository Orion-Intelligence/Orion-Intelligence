from __future__ import annotations
from typing import Any, Dict, Optional, Callable, Awaitable

from orion.services.stix_manager.converters.base import base_converter
from orion.services.stix_manager.converters.chat import chat_converter
from orion.services.stix_manager.converters.defacement import defacement_converter
from orion.services.stix_manager.converters.exploit import exploit_converter
from orion.services.stix_manager.converters.general import general_converter
from orion.services.stix_manager.converters.leak import leak_converter
from orion.services.stix_manager.converters.social import social_converter
from orion.services.stix_manager.converters.utils import _to_attr_obj

try:
    from orion.api.interactive.search_manager.search_model import search_model
except Exception:
    search_model = None


class StixManager:
    __instance: Optional["StixManager"] = None

    def __init__(self):
        if StixManager.__instance is not None:
            raise Exception("This class is a singleton!")
        if search_model is None:
            self._search_model = None
        else:
            self._search_model = search_model.getInstance()
        self._defacement = defacement_converter()
        self._exploit = exploit_converter()
        self._leak = leak_converter()
        self._social = social_converter()
        self._general = general_converter()
        self._chat = chat_converter()
        StixManager.__instance = self

    @staticmethod
    def get_instance() -> "StixManager":
        if StixManager.__instance is None:
            StixManager()
        return StixManager.__instance

    async def _fetch_and_convert(self, fetch: Callable[[], Awaitable[Any]], converter: base_converter) -> Dict[str, Any]:
        raw = await fetch()
        raw = _to_attr_obj(raw)
        return converter.convert(raw)

    async def get_defacement_stix(self, doc_id: str) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_defacement_doc(doc_id), self._defacement)

    async def get_exploit_stix(self, doc_id: str, lang) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_exploit_doc(doc_id, lang), self._exploit)

    async def get_leak_stix(self, doc_id: str, lang) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_leak_doc(doc_id, lang), self._leak)

    async def get_social_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_social_doc(doc_id, lang), self._social)

    async def get_general_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_general_doc(doc_id, lang), self._general)

    async def get_chat_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_chat_doc(doc_id, lang), self._chat)

    def _convert_defacement(self, raw: Any) -> Dict[str, Any]:
        return self._defacement.convert(raw)

    def _convert_exploit(self, raw: Any) -> Dict[str, Any]:
        return self._exploit.convert(raw)

    def _convert_leak(self, raw: Any) -> Dict[str, Any]:
        return self._leak.convert(raw)

    def _convert_social(self, raw: Any) -> Dict[str, Any]:
        return self._social.convert(raw)

    def _convert_general(self, raw: Any) -> Dict[str, Any]:
        return self._general.convert(raw)

    def _convert_chat(self, raw: Any) -> Dict[str, Any]:
        return self._chat.convert(raw)
