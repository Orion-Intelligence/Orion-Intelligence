from __future__ import annotations
from typing import Any, Dict
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import result_item as LeakResultItem
from orion.services.stix_manager.converters.stix_converter_base import stix_converter_base
from orion.services.stix_manager.stix_helper import stix_helper

class leak_converter(stix_converter_base):

    def convert(self, raw: LeakResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self.get_timestamps(c, raw, ["m_creation_date", "m_update_date"])


        title, url, base_url, network, platform, doc_id = stix_converter_base.extract_common(c, raw, [
            c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url")], [
            c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url")], "m_base_url", "Leak - unknown title", include_platform=True)

        summary = self.process_summary(c, raw, ["m_important_content", "m_content"])
        tlp_amber_id, content_types = self.setup_marking_and_types(c, created, raw)
        labels = self.standard_labels(c, raw, content_types, "orion:leak")
        lang = self.get_lang(c, raw)
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        victim_refs = self.add_victims(c, raw, created, modified, tlp_amber_id, location_refs)
        actor_ref, observed_ref, note_ref, indicator_refs, vuln_refs, attack_refs, domain_vals = self.prepare_common_iocs_refs(c, raw, created, modified, tlp_amber_id, labels, summary, doc_id, url,
                                                                                                                  extra_urls=c.as_list(c.safe_get(raw, "m_dumplink")) + c.as_list(c.safe_get(raw, "m_websites")), actor_keys=["m_team", "m_author"])
        infra_seed = c.first_nonempty(base_url, url, domain_vals[0] if domain_vals else None)
        name = self.get_infra_name(c, raw, title, "Leak infrastructure", ["m_team"])
        infra_types = self.determine_infra_types(content_types, network, "ransomware", "command-and-control")
        infra_ref = self.add_infrastructure(c, created, modified, tlp_amber_id, labels, summary, network, infra_seed, name, infra_types)
        external_refs, object_refs, custom = self.post_infra_processing(c, raw, created, modified, tlp_amber_id, actor_ref, infra_ref, url, base_url, observed_ref, note_ref, location_refs,
                                                                        indicator_refs, vuln_refs, attack_refs, victim_refs=victim_refs, include_screenshot=True, platform=platform, dumplink_key="m_dumplink")
        return self.finalize_bundle(c, created, modified, title, summary, labels, lang, external_refs, object_refs, doc_id, "leak", tlp_amber_id, **custom)
