from __future__ import annotations

from typing import Any, Dict, List
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import result_item as SocialResultItem
from orion.services.stix_manager.converters.stix_converter_base import stix_converter_base
from orion.services.stix_manager.stix_helper import stix_helper

class social_converter(stix_converter_base):

    def convert(self, raw: SocialResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self.get_timestamps(c, raw, ["m_creation_date", "m_update_date", "m_message_date"])

        title, url, base_url, network, platform, doc_id = stix_converter_base.extract_common(c, raw, [
            c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_channel_url")], [
            c.safe_get(raw, "m_message_sharable_link"), c.safe_get(raw, "m_channel_url"), c.safe_get(raw, "m_url")], "m_channel_url", "Social - unknown title", include_platform=True)

        summary = self.process_summary(c, raw, ["m_content", "m_important_content", "m_meta_description"])
        tlp_amber_id, content_types = self.setup_marking_and_types(c, created, raw)
        labels = self.standard_labels(c, raw, content_types, "orion:social")
        lang = self.get_lang(c, raw)
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        created_by_ref = self.add_created_by(c, raw, created, modified, tlp_amber_id, ["m_author", "m_username"], "author")
        extra_urls = c.as_list(c.safe_get(raw, "m_social_media_profiles"))
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self.process_iocs(c, raw, main_url=url, extra_urls=extra_urls)
        extra_scos: List[dict] = []
        for x in c.dedupe_keep(c.as_list(c.safe_get(raw, "m_xmpp_addresses"))):
            extra_scos.append({"type": "x-mpp-addr", "id": c.sco_id("x-mpp-addr", x), "value": x})
        for w in c.dedupe_keep(c.as_list(c.safe_get(raw, "m_crypto_address"))):
            extra_scos.append({"type": "cryptocurrency-wallet", "id": c.sco_id("cryptocurrency-wallet", w), "address": w})
        for ua in c.dedupe_keep(c.as_list(c.safe_get(raw, "m_user_agents"))):
            extra_scos.append({"type": "user-agent", "id": c.sco_id("user-agent", ua), "string": ua})
        observed_ref, indicator_refs, vuln_refs, attack_refs = self.add_common_objects(c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
                                                                                        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths, extra_scos=extra_scos)
        hashtags = c.dedupe_keep([str(x).strip().lstrip("#") for x in c.as_list(c.safe_get(raw, "m_hashtag")) if str(x).strip()])
        mentions = c.dedupe_keep([str(x).strip().lstrip("@") for x in c.as_list(c.safe_get(raw, "m_mention")) if str(x).strip()])
        extra_content = {k: v for k, v in {"hashtags": hashtags, "mentions": mentions}.items() if v}
        note_ref = self.add_sensitive_note(c, created, modified, tlp_amber_id, c.add_tlp(created)[1], doc_id, raw, extra_content=extra_content or None, base_abstract="Social metadata")
        infra_seed = c.first_nonempty(base_url, url, domain_vals[0] if domain_vals else None)
        name = self.get_infra_name(c, raw, title, "Social infrastructure", priority_value=platform)
        infra_types = self.determine_infra_types(content_types, network)
        infra_ref = self.add_infrastructure(c, created, modified, tlp_amber_id, labels, summary, network, infra_seed, name, infra_types)
        extra_ext = [{"source_name": "share_link", "url": str(c.safe_get(raw, "m_message_sharable_link"))}] if c.safe_get(raw, "m_message_sharable_link") else []
        external_refs = self.build_external_refs(c, raw, main_url=url, base_url=base_url, extra=extra_ext)
        object_refs = self.collect_object_refs(infra_ref=infra_ref, observed_ref=observed_ref, note_ref=note_ref, created_by_ref=created_by_ref,
                                               location_refs=location_refs, indicator_refs=indicator_refs, vuln_refs=vuln_refs, attack_refs=attack_refs)
        custom = {
            "x_orion_network": str(network) if network else None,
            "x_orion_platform": str(platform) if platform else None,
            "x_orion_post_comments_count": str(c.safe_get(raw, "m_post_comments_count")) if c.safe_get(raw, "m_post_comments_count") is not None else None
        }
        return self.finalize_bundle(c, created, modified, title, summary, labels, lang, external_refs, object_refs, doc_id, "social", tlp_amber_id, created_by_ref=created_by_ref, **custom)
