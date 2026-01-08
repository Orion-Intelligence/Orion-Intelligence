from __future__ import annotations
from typing import Any, Dict, List
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import result_item as ChatResultItem
from orion.services.stix_manager.converters.stix_converter_base import stix_converter_base
from orion.services.stix_manager.stix_helper import stix_helper

class chat_converter(stix_converter_base):

    def convert(self, raw: ChatResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self.get_timestamps(c, raw, ["m_creation_date", "m_update_date", "m_message_date"])
        caption = str(c.first_nonempty(c.safe_get(raw, "m_caption"), c.safe_get(raw, "m_content"), "Chat - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_message_sharable_link"), c.safe_get(raw, "m_media_url"))
        channel_url = c.safe_get(raw, "m_channel_url")
        channel_id = c.safe_get(raw, "m_channel_id")
        platform = c.safe_get(raw, "m_platform")
        network = c.safe_get(raw, "m_network") or (str(platform).strip().lower() if platform else None)
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), c.safe_get(raw, "m_message_id"), url, channel_id, caption)
        summary = self.process_summary(c, raw, ["m_content", "m_media_caption"])
        tlp_amber_id, content_types = self.setup_marking_and_types(c, created, raw)
        labels_set: set[str] = set(content_types)
        if platform:
            labels_set.add(f"platform:{str(platform).strip().lower()}")
        if network:
            labels_set.add(str(network).strip().lower())
        labels_set.add("orion:chat")
        labels = list(labels_set)
        lang = self.get_lang(c, raw)
        created_by_ref = self.add_created_by(c, raw, created, modified, tlp_amber_id, ["m_sender_username", "m_users", "m_author"], "sender")
        channel_name = c.first_nonempty(c.safe_get(raw, "m_channel_name"), channel_id, channel_url, "Chat channel")
        infra_seed = c.first_nonempty(channel_url, channel_id)
        extra_urls = c.as_list(c.safe_get(raw, "m_weblink"))
        if channel_url:
            extra_urls.append(channel_url)
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self.process_iocs(c, raw, main_url=url, extra_urls=extra_urls)
        extra_scos: List[dict] = []
        for ua in c.dedupe_keep(c.as_list(c.safe_get(raw, "m_user_agents"))):
            extra_scos.append({"type": "user-agent", "id": c.sco_id("user-agent", ua), "string": ua})
        cves_raw = [str(x).strip().upper() for x in c.as_list(c.safe_get(raw, "m_cve")) if str(x).strip()]
        custom_cves = [x for x in cves_raw if x.startswith("CVE-")]
        observed_ref, indicator_refs, vuln_refs, attack_refs = self.add_common_objects(c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
                                                                                        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths,
                                                                                        extra_scos=extra_scos, custom_cves=custom_cves)
        hashtags = c.dedupe_keep([str(x).strip().lstrip("#") for x in c.as_list(c.safe_get(raw, "m_hashtag")) if str(x).strip()])
        mentions = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_mention")) if str(x).strip()])
        extra_content = {k: v for k, v in {"hashtags": hashtags, "mentions": mentions}.items() if v}
        note_ref = self.add_sensitive_note(c, created, modified, tlp_amber_id, c.add_tlp(created)[1], doc_id, raw, extra_content=extra_content or None, base_abstract="Chat metadata")
        infra_types = ["unknown"]
        if str(platform or "").lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)):
            infra_types = ["communications"]
        name = self.get_infra_name(c, raw, caption, "Chat channel", priority_value=channel_name)
        extra_fields = {"x_orion_channel_id": str(channel_id)} if channel_id else {}
        infra_ref = self.add_infrastructure(c, created, modified, tlp_amber_id, labels, summary, network, infra_seed, name, infra_types, extra_fields=extra_fields)
        extra_ext = [{"source_name": "message_id", "external_id": str(c.safe_get(raw, "m_message_id"))}] if c.safe_get(raw, "m_message_id") else []
        external_refs = self.build_external_refs(c, raw, main_url=url, base_url=channel_url, extra=extra_ext)
        object_refs = self.collect_object_refs(infra_ref=infra_ref, observed_ref=observed_ref, note_ref=note_ref, created_by_ref=created_by_ref,
                                               indicator_refs=indicator_refs, vuln_refs=vuln_refs, attack_refs=attack_refs)
        custom = {
            "x_orion_network": str(network) if network else None,
            "x_orion_platform": str(platform) if platform else None,
            "x_orion_channel_id": str(channel_id) if channel_id else None,
            "x_orion_channel_name": str(c.safe_get(raw, "m_channel_name")) if c.safe_get(raw, "m_channel_name") else None,
            "x_orion_views": str(c.safe_get(raw, "m_views")) if c.safe_get(raw, "m_views") is not None else None,
            "x_orion_sender_is_bot": bool(c.safe_get(raw, "m_sender_is_bot")) if c.safe_get(raw, "m_sender_is_bot") is not None else None,
            "x_orion_is_forwarded": bool(c.safe_get(raw, "m_is_forwarded")) if c.safe_get(raw, "m_is_forwarded") is not None else None,
            "x_orion_is_reply": bool(c.safe_get(raw, "m_is_reply")) if c.safe_get(raw, "m_is_reply") is not None else None,
            "x_orion_pinned": bool(c.safe_get(raw, "m_pinned")) if c.safe_get(raw, "m_pinned") is not None else None
        }
        return self.finalize_bundle(c, created, modified, caption, summary, labels, lang, external_refs, object_refs, doc_id, "chat", tlp_amber_id, created_by_ref=created_by_ref, **custom)
