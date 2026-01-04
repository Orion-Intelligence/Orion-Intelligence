from typing import Any, Dict, Optional

from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import (result_item as DefacementResultItem, )
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import (result_item as ExploitResultItem, )
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import (result_item as LeakResultItem, )
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import (result_item as SocialResultItem, )
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import (result_item as GeneralResultItem, )
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import (result_item as ChatResultItem, )
from orion.api.interactive.search_manager.search_model import search_model

from orion.services.stix_manager.converters.defacement_converter import _DefacementConverter
from orion.services.stix_manager.converters.exploit_converter import _ExploitConverter
from orion.services.stix_manager.converters.leak_converter import _LeakConverter
from orion.services.stix_manager.converters.social_converter import _SocialConverter
from orion.services.stix_manager.converters.general_converter import _GeneralConverter
from orion.services.stix_manager.converters.chat_converter import _ChatConverter

STIX_TEMPLATE = {"Title": "", "Date": "", "Network": "", "Country": "", "SUMMARY": "", "TRENDS": {"Dates": None, "Scale": None, "Impacted Region": None, "Sector": None, "Volume": None, }, "INSIGHTS": {"Breach Type": None, "Attack Vector": None, "Data Exposed": None, "MITRE ATT&CK TTPs": None, }, "CONCLUSION": ""}


class StixManager:
    __instance = None

    def __init__(self):
        if StixManager.__instance is not None:
            raise Exception("This class is a singleton!")
        self._search_model = search_model.getInstance()
        self._defacement_converter = _DefacementConverter()
        self._exploit_converter = _ExploitConverter()
        self._leak_converter = _LeakConverter()
        self._social_converter = _SocialConverter()
        self._general_converter = _GeneralConverter()
        self._chat_converter = _ChatConverter()
        StixManager.__instance = self

    @staticmethod
    def get_instance():
        if StixManager.__instance is None:
            StixManager()
        return StixManager.__instance

    async def get_defacement_stix(self, doc_id: str) -> Dict[str, Any]:
        raw: DefacementResultItem = await self._search_model.request_defacement_doc(doc_id)
        raw = LeakResultItem(**raw)
        return self._convert_defacement(raw)

    async def get_exploit_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw: ExploitResultItem = await self._search_model.request_exploit_doc(doc_id, lang)
        raw = LeakResultItem(**raw)
        return self._convert_exploit(raw)

    async def get_leak_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw: LeakResultItem = await self._search_model.request_leak_doc(doc_id, lang)
        raw = LeakResultItem(**raw)
        if raw is None:
            return {"error": "No leak document found", "doc_id": doc_id}
        return self._convert_leak(raw)

    async def get_social_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw: SocialResultItem = await self._search_model.request_social_doc(doc_id, lang)
        raw = LeakResultItem(**raw)
        return self._convert_social(raw)

    async def get_general_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw: GeneralResultItem = await self._search_model.request_general_doc(doc_id, lang)
        raw = LeakResultItem(**raw)
        return self._convert_general(raw)

    async def get_chat_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw: ChatResultItem = await self._search_model.request_chat_doc(doc_id, lang)
        raw = LeakResultItem(**raw)
        return self._convert_chat(raw)

    def _convert_defacement(self, raw: DefacementResultItem) -> Dict[str, Any]:
        return self._defacement_converter.convert(raw)
    def _convert_exploit(self, raw: ExploitResultItem) -> Dict[str, Any]:
        return self._exploit_converter.convert(raw)
    def _convert_leak(self, raw: LeakResultItem) -> Dict[str, Any]:
        return self._leak_converter.convert(raw)
    def _convert_social(self, raw: SocialResultItem) -> Dict[str, Any]:
        return self._social_converter.convert(raw)
    def _convert_general(self, raw: GeneralResultItem) -> Dict[str, Any]:
        return self._general_converter.convert(raw)
    def _convert_chat(self, raw: ChatResultItem) -> Dict[str, Any]:
        return self._chat_converter.convert(raw)
