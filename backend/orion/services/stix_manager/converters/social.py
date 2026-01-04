from __future__ import annotations
from typing import Any, Dict, Optional, List
from .base import base_converter
from .utils import safe_get, as_list, first_nonempty, add_obj, stix_id, sco_id

class social_converter(base_converter):
    type_label = "orion:social"
    report_prefix = "social"

    def _get_title(self, raw: Any) -> str:
        return str(first_nonempty(
            safe_get(raw, "m_title"),
            safe_get(raw, "m_url"),
            safe_get(raw, "m_channel_url"),
            "Social - unknown title",
        ))

    def _get_url(self, raw: Any) -> Optional[str]:
        return first_nonempty(safe_get(raw, "m_message_sharable_link"), safe_get(raw, "m_channel_url"), safe_get(raw, "m_url"))

    def _get_summary_source(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_content"), safe_get(raw, "m_important_content"), safe_get(raw, "m_meta_description"), ""))

    def _create_author_identity_object(self, objects, seen, raw, created, modified, tlp_amber_id) -> Optional[str]:
        author = first_nonempty(safe_get(raw, "m_author"), safe_get(raw, "m_username"))
        if not author:
            return None
        author_name = str(author[0]).strip() if isinstance(author, list) else str(author).strip()
        if not author_name:
            return None
        ident = {
            "type": "identity", "spec_version": "2.1",
            "id": stix_id("identity", f"author:{author_name}"),
            "created": created, "modified": modified, "name": author_name,
            "identity_class": "individual", "object_marking_refs": [tlp_amber_id],
        }
        return add_obj(objects, seen, ident, uniq=("identity", f"author:{author_name}"))

    def _get_infra_name(self, raw, title) -> str:
        return str(first_nonempty(safe_get(raw, "m_platform"), title, "Social infrastructure"))

    def _add_extra_scos(self, objects, seen, sco_refs: List[str], raw: Any) -> None:
        social_profiles = [str(x).strip() for x in as_list(safe_get(raw, "m_social_media_profiles")) if str(x).strip()]
        xmpp_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_xmpp_addresses")) if str(x).strip()]
        crypto_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_crypto_address")) if str(x).strip()]
        user_agents = [str(x).strip() for x in as_list(safe_get(raw, "m_user_agents")) if str(x).strip()]
        for x in xmpp_vals:
            sco_refs.append(add_obj(objects, seen, {"type": "x-mpp-addr", "id": sco_id("x-mpp-addr", x), "value": x}, uniq=("x-mpp-addr", x)))
        for c in crypto_vals:
            sco_refs.append(add_obj(objects, seen, {"type": "cryptocurrency-wallet", "id": sco_id("cryptocurrency-wallet", c), "address": c}, uniq=("cryptocurrency-wallet", c)))
        for ua in user_agents:
            sco_refs.append(add_obj(objects, seen, {"type": "user-agent", "id": sco_id("user-agent", ua), "string": ua}, uniq=("user-agent", ua)))

    def _add_extra_note_content(self, content_note: Dict, raw: Any) -> None:
        hashtags = sorted(set(str(x).strip().lstrip("#") for x in as_list(safe_get(raw, "m_hashtag")) if str(x).strip()))
        mentions = sorted(set(str(x).strip().lstrip("@") for x in as_list(safe_get(raw, "m_mention")) if str(x).strip()))
        if hashtags:
            content_note["hashtags"] = hashtags
        if mentions:
            content_note["mentions"] = mentions

    def _get_external_references(self, raw, url, base_url) -> Optional[List[Dict]]:
        refs = super()._get_external_references(raw, url, base_url) or []
        if safe_get(raw, "m_message_sharable_link"):
            refs.append({"source_name": "share_link", "url": str(safe_get(raw, "m_message_sharable_link"))})
        return refs or None

    def _get_report_custom_fields(self, raw: Any) -> Dict[str, Any]:
        return {
            "x_orion_platform": str(safe_get(raw, "m_platform")) if safe_get(raw, "m_platform") else None,
            "x_orion_post_comments_count": str(safe_get(raw, "m_post_comments_count")) if safe_get(raw, "m_post_comments_count") else None,
        }
