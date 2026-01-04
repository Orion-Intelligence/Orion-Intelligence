from __future__ import annotations
from typing import Any, Dict, Optional, List
from .base import base_converter
from .utils import safe_get, as_list, first_nonempty, add_obj, stix_id, sco_id

class chat_converter(base_converter):
    type_label = "orion:chat"
    report_prefix = "chat"
    created_ts_fields = ["m_creation_date", "m_update_date", "m_message_date"]

    def _get_title(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_caption"), safe_get(raw, "m_content"), "Chat - unknown title"))

    def _get_url(self, raw: Any) -> str:
        return first_nonempty(safe_get(raw, "m_message_sharable_link"), safe_get(raw, "m_media_url"))

    def _get_summary_source(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_content"), safe_get(raw, "m_media_caption"), ""))

    def _create_author_identity_object(self, objects, seen, raw, created, modified, tlp_amber_id) -> Optional[str]:
        sender = first_nonempty(safe_get(raw, "m_sender_username"), safe_get(raw, "m_users"), safe_get(raw, "m_author"))
        if not sender:
            return None
        sender_name = str(sender[0]).strip() if isinstance(sender, list) else str(sender).strip()
        if not sender_name:
            return None
        ident = {
            "type": "identity", "spec_version": "2.1",
            "id": stix_id("identity", f"sender:{sender_name}"),
            "created": created, "modified": modified, "name": sender_name,
            "identity_class": "individual", "object_marking_refs": [tlp_amber_id],
        }
        return add_obj(objects, seen, ident, uniq=("identity", f"sender:{sender_name}"))

    def _get_infra_seed(self, raw, base_url, url, domain_vals) -> Optional[str]:
        channel_url = safe_get(raw, "m_channel_url")
        channel_id = safe_get(raw, "m_channel_id")
        return first_nonempty(channel_url, channel_id)

    def _get_infra_name(self, raw, title) -> str:
        return str(first_nonempty(safe_get(raw, "m_channel_name"), safe_get(raw, "m_channel_id"), safe_get(raw, "m_channel_url"), "Chat channel"))

    def _get_infra_types(self, raw, content_types, network) -> List[str]:
        platform = safe_get(raw, "m_platform")
        channel_url = safe_get(raw, "m_channel_url")
        if str(platform).strip().lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)):
            return ["communications"]
        return ["unknown"]

    def _add_extra_scos(self, objects, seen, sco_refs: List[str], raw: Any) -> None:
        user_agents = [str(x).strip() for x in as_list(safe_get(raw, "m_user_agents")) if str(x).strip()]
        for ua in user_agents:
            sco_refs.append(add_obj(objects, seen, {"type": "user-agent", "id": sco_id("user-agent", ua), "string": ua}, uniq=("user-agent", ua)))

    def _add_extra_note_content(self, content_note: Dict, raw: Any) -> None:
        hashtags = sorted(set(str(x).strip().lstrip("#") for x in as_list(safe_get(raw, "m_hashtag")) if str(x).strip()))
        mentions = sorted(set(str(x).strip() for x in as_list(safe_get(raw, "m_mention")) if str(x).strip()))
        if hashtags:
            content_note["hashtags"] = hashtags
        if mentions:
            content_note["mentions"] = mentions

    def _get_external_references(self, raw, url, base_url) -> Optional[List[Dict]]:
        refs = super()._get_external_references(raw, url, base_url) or []
        channel_url = safe_get(raw, "m_channel_url")
        if channel_url and channel_url != url:
            refs.append({"source_name": "channel_url", "url": str(channel_url)})
        if safe_get(raw, "m_message_id"):
            refs.append({"source_name": "message_id", "external_id": str(safe_get(raw, "m_message_id"))})
        return refs or None

    def _get_report_custom_fields(self, raw: Any) -> Dict[str, Any]:
        return {
            "x_orion_platform": str(safe_get(raw, "m_platform")) if safe_get(raw, "m_platform") else None,
            "x_orion_channel_id": str(safe_get(raw, "m_channel_id")) if safe_get(raw, "m_channel_id") else None,
            "x_orion_channel_name": str(safe_get(raw, "m_channel_name")) if safe_get(raw, "m_channel_name") else None,
            "x_orion_views": str(safe_get(raw, "m_views")) if safe_get(raw, "m_views") else None,
            "x_orion_sender_is_bot": bool(safe_get(raw, "m_sender_is_bot")) if safe_get(raw, "m_sender_is_bot") is not None else None,
            "x_orion_is_forwarded": bool(safe_get(raw, "m_is_forwarded")) if safe_get(raw, "m_is_forwarded") is not None else None,
            "x_orion_is_reply": bool(safe_get(raw, "m_is_reply")) if safe_get(raw, "m_is_reply") is not None else None,
            "x_orion_pinned": bool(safe_get(raw, "m_pinned")) if safe_get(raw, "m_pinned") is not None else None,
        }
