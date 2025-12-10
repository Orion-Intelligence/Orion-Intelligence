from typing import Any, Dict, Optional
from pathlib import Path

from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import (
    result_item as DefacementResultItem,
)
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import (
    result_item as ExploitResultItem,
)
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import (
    result_item as LeakResultItem,
)
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import (
    result_item as SocialResultItem,
)
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import (
    result_item as GeneralResultItem,
)
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import (
    result_item as ChatResultItem,
)

from orion.api.interactive.search_manager.search_model import search_model


STICK_TEMPLATE = {
    "Title": "",
    "Date": "",
    "Network": "",
    "Country": "",
    "SUMMARY": "",
    "TRENDS": {
        "Dates": None,
        "Scale": None,
        "Impacted Region": None,
        "Sector": None,
        "Volume": None,
    },
    "INSIGHTS": {
        "Breach Type": None,
        "Attack Vector": None,
        "Data Exposed": None,
        "MITRE ATT&CK TTPs": None,
    },
    "CONCLUSION": ""
}


class StickManager:
    __instance = None

    def __init__(self):
        if StickManager.__instance is not None:
            raise Exception("This class is a singleton!")
        self._search_model = search_model.getInstance()
        StickManager.__instance = self

    @staticmethod
    def get_instance():
        if StickManager.__instance is None:
            StickManager()
        return StickManager.__instance


    async def get_defacement_stick(self, doc_id: str) -> Dict[str, Any]:
        raw: DefacementResultItem = await self._search_model.request_defacement_doc(doc_id)
        raw = LeakResultItem(**raw)
        return self._convert_defacement(raw)

    async def get_exploit_stick(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw: ExploitResultItem = await self._search_model.request_exploit_doc(doc_id, lang)
        raw = LeakResultItem(**raw)
        return self._convert_exploit(raw)

    async def get_leak_stick(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw: LeakResultItem = await self._search_model.request_leak_doc(doc_id, lang)
        raw = LeakResultItem(**raw)
        if raw is None:
            return {"error": "No leak document found", "doc_id": doc_id}
        return self._convert_leak(raw)

    async def get_social_stick(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw: SocialResultItem = await self._search_model.request_social_doc(doc_id, lang)
        raw = LeakResultItem(**raw)
        return self._convert_social(raw)

    async def get_general_stick(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw: GeneralResultItem = await self._search_model.request_general_doc(doc_id, lang)
        raw = LeakResultItem(**raw)
        return self._convert_general(raw)

    async def get_chat_stick(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw: ChatResultItem = await self._search_model.request_chat_doc(doc_id, lang)
        raw = LeakResultItem(**raw)
        return self._convert_chat(raw)

    def _convert_defacement(self, raw: DefacementResultItem) -> Dict[str, Any]:
        stick = STICK_TEMPLATE.copy()
        title = raw.m_url or raw.m_base_url or (raw.m_mirror_links[0] if raw.m_mirror_links else None) \
                or (raw.m_content.splitlines()[0] if raw.m_content else None)
        stick["Title"] = title or "Defacement - unknown title"
        stick["Date"] = raw.m_leak_date or ""
        stick["Network"] = raw.m_base_url or (raw.m_source_url[0] if raw.m_source_url else "") or ""
        stick["Country"] = (raw.m_location[0] if raw.m_location else "") or ""
        stick["SUMMARY"] = (raw.m_content[:400] if raw.m_content else "No summary available")
        stick["TRENDS"] = {
            "Dates": raw.m_leak_date or "",
            "Scale": "Unknown",
            "Impacted Region": (raw.m_location[0] if raw.m_location else "") or "",
            "Sector": "Website Defacement",
            "Volume": f"{len(raw.m_mirror_links)} mirror links" if raw.m_mirror_links else "Unknown"
        }
        stick["INSIGHTS"] = {
            "Breach Type": "Defacement",
            "Attack Vector": (raw.m_ioc_type[0] if raw.m_ioc_type else "") or
                             (raw.m_web_server[0] if raw.m_web_server else "") or "Unknown",
            "Data Exposed": "Website content / HTML" if raw.m_content else "Unknown",
            "MITRE ATT&CK TTPs": ["T1490 (Inhibit System Recovery)"] if raw.m_content else []
        }
        stick["CONCLUSION"] = ""
        return stick

    def _convert_exploit(self, raw: ExploitResultItem) -> Dict[str, Any]:
        stick = STICK_TEMPLATE.copy()
        stick["Title"] = raw.m_title or raw.m_url or "Exploit - unknown title"
        stick["Date"] = raw.m_leak_date or raw.m_update_date or raw.m_creation_date or ""
        stick["Network"] = raw.m_network or (raw.m_weblink[0] if raw.m_weblink else "") or ""
        stick["Country"] = ""
        summary = raw.m_important_content or raw.m_content or ""
        stick["SUMMARY"] = (summary[:400] + "...") if summary and len(summary) > 400 else (summary or "No summary available")
        stick["TRENDS"] = {
            "Dates": stick["Date"],
            "Scale": "Unknown",
            "Impacted Region": "Unknown",
            "Sector": "Exploit",
            "Volume": ""
        }
        breach_type = "Exploit"
        attack_vector = "Exploit / Public-facing application"
        data_exposed = []
        if raw.m_content:
            lc = raw.m_content.lower()
            if "rce" in lc or "remote code" in lc:
                breach_type += " (RCE)"
            if "sql" in lc:
                attack_vector = "SQL Injection"
            if "credentials" in lc or "password" in lc:
                data_exposed.append("credentials")
        stick["INSIGHTS"] = {
            "Breach Type": breach_type,
            "Attack Vector": attack_vector,
            "Data Exposed": data_exposed or ["Unknown"],
            "MITRE ATT&CK TTPs": ["T1190 (Exploit Public-Facing Application)"]
        }
        stick["CONCLUSION"] = ""
        return stick

    def _convert_leak(self, raw: LeakResultItem) -> Dict[str, Any]:
        stick = STICK_TEMPLATE.copy()
        stick["Title"] = raw.m_title or raw.m_url or "Leak - unknown title"
        stick["Date"] = raw.m_update_date or raw.m_creation_date or ""
        stick["Network"] = raw.m_network or (raw.m_weblink[0] if raw.m_weblink else "") or ""
        stick["Country"] = ""
        summary = raw.m_important_content or raw.m_content or ""
        stick["SUMMARY"] = (summary[:400] + "...") if summary and len(summary) > 400 else (summary or "No summary available")
        volume = "Unknown"
        if raw.m_dumplink:
            volume = f"{len(raw.m_dumplink)} dump links"
        stick["TRENDS"] = {
            "Dates": stick["Date"],
            "Scale": "Unknown",
            "Impacted Region": "Unknown",
            "Sector": "Leak",
            "Volume": volume
        }
        data_exposed = []
        if raw.m_content:
            lc = raw.m_content.lower()
            if "email" in lc:
                data_exposed.append("email")
            if "password" in lc:
                data_exposed.append("password")
            if "credit card" in lc or "cvv" in lc:
                data_exposed.append("credit_card")
        stick["INSIGHTS"] = {
            "Breach Type": "Data Leak / Dump",
            "Attack Vector": "Public dump / data exposure",
            "Data Exposed": data_exposed or ["Unknown"],
            "MITRE ATT&CK TTPs": ["T1041 (Exfiltration)"]
        }
        stick["CONCLUSION"] = ""
        return stick

    def _convert_social(self, raw: SocialResultItem) -> Dict[str, Any]:
        stick = STICK_TEMPLATE.copy()
        stick["Title"] = raw.m_title or raw.m_url or "Social - unknown title"
        stick["Date"] = raw.m_message_date or raw.m_update_date or raw.m_creation_date or ""
        stick["Network"] = raw.m_network or ""
        stick["Country"] = ""
        stick["SUMMARY"] = (raw.m_content or "")[:400] or "No summary available"
        stick["TRENDS"] = {
            "Dates": stick["Date"],
            "Scale": "Unknown",
            "Impacted Region": "Unknown",
            "Sector": "Social Media",
            "Volume": ""
        }
        stick["INSIGHTS"] = {
            "Breach Type": "Social content / activity",
            "Attack Vector": "Social platform",
            "Data Exposed": ["posts", "media"] if (raw.m_content or raw.m_images) else ["Unknown"],
            "MITRE ATT&CK TTPs": []
        }
        stick["CONCLUSION"] = ""
        return stick

    def _convert_general(self, raw: GeneralResultItem) -> Dict[str, Any]:
        stick = STICK_TEMPLATE.copy()
        stick["Title"] = raw.m_title or raw.m_url or "General - unknown title"
        stick["Date"] = raw.m_update_date or raw.m_creation_date or ""
        stick["Network"] = raw.m_network or (raw.m_base_url or "")
        stick["Country"] = ""
        summary = raw.m_important_content or raw.m_content or raw.m_meta_description or ""
        stick["SUMMARY"] = (summary[:400] + "...") if summary and len(summary) > 400 else (summary or "No summary available")
        stick["TRENDS"] = {
            "Dates": stick["Date"],
            "Scale": "Unknown",
            "Impacted Region": "Unknown",
            "Sector": "General/Other",
            "Volume": f"{len(raw.m_document) if raw.m_document else 0} documents"
        }
        data_exposed = []
        if raw.m_content:
            lc = raw.m_content.lower()
            if "password" in lc or "credential" in lc:
                data_exposed.append("credentials")
        stick["INSIGHTS"] = {
            "Breach Type": "General/Other",
            "Attack Vector": "Unknown",
            "Data Exposed": data_exposed or ["Unknown"],
            "MITRE ATT&CK TTPs": []
        }
        stick["CONCLUSION"] = ""
        return stick

    def _convert_chat(self, raw: ChatResultItem) -> Dict[str, Any]:
        stick = STICK_TEMPLATE.copy()
        stick["Title"] = raw.m_caption or "Chat - unknown title"
        stick["Date"] = raw.m_message_date or raw.m_update_date or raw.m_creation_date or ""
        stick["Network"] = raw.m_channel_id or ""
        stick["Country"] = ""
        stick["SUMMARY"] = (raw.m_content or "")[:400] or "No summary available"
        stick["TRENDS"] = {
            "Dates": stick["Date"],
            "Scale": "Unknown",
            "Impacted Region": "Unknown",
            "Sector": "Chat / Messaging",
            "Volume": raw.m_message_sharable_link
        }
        stick["INSIGHTS"] = {
            "Breach Type": "Chat content / activity",
            "Attack Vector": "Messaging platform",
            "Data Exposed": ["messages"] if (raw.m_content or raw.m_message_id) else ["Unknown"],
            "MITRE ATT&CK TTPs": []
        }
        stick["CONCLUSION"] = ""
        return stick

