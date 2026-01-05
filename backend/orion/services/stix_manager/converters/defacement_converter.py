from __future__ import annotations
from typing import Any, Dict
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import result_item as DefacementResultItem
from orion.services.stix_manager.converters.stix_converter_base import stix_converter_base
from orion.services.stix_manager.stix_helper import stix_helper

class defacement_converter(stix_converter_base):

    def convert(self, raw: DefacementResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self.get_timestamps(c, raw, ["m_leak_date", "m_creation_date", "m_update_date"])
        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"),
                                    c.as_list(c.safe_get(raw, "m_mirror_links"))[0] if c.as_list(c.safe_get(raw, "m_mirror_links")) else None,
                                    str(c.safe_get(raw, "m_content")).splitlines()[0] if c.safe_get(raw, "m_content") else None, "Defacement - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"), c.as_list(c.safe_get(raw, "m_source_url"))[0] if c.as_list(c.safe_get(raw, "m_source_url")) else None,
                               c.as_list(c.safe_get(raw, "m_mirror_links"))[0] if c.as_list(c.safe_get(raw, "m_mirror_links")) else None)
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        summary = self.process_summary(c, raw, ["m_content", "m_important_content"])
        tlp_amber_id, content_types = self.setup_marking_and_types(c, created, raw, "defacement")
        labels = self.standard_labels(c, raw, content_types, "orion:defacement")
        lang = self.get_lang(c, raw)
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        extra_urls = c.as_list(c.safe_get(raw, "m_mirror_links")) + c.as_list(c.safe_get(raw, "m_source_url"))
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self.process_iocs(c, raw, main_url=url, extra_urls=extra_urls)
        observed_ref, indicator_refs, vuln_refs, attack_refs = self.add_common_objects(c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
                                                                                        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths)
        infra_seed = c.first_nonempty(base_url, url, domain_vals[0] if domain_vals else None)
        name = title
        infra_types = self.determine_infra_types(content_types, network)
        infra_ref = self.add_infrastructure(c, created, modified, tlp_amber_id, labels, summary, network, infra_seed, name, infra_types)
        attack_vector = c.first_nonempty(c.as_list(c.safe_get(raw, "m_ioc_type"))[0] if c.as_list(c.safe_get(raw, "m_ioc_type")) else None,
                                         c.as_list(c.safe_get(raw, "m_web_server"))[0] if c.as_list(c.safe_get(raw, "m_web_server")) else None, "Unknown")
        external_refs = self.build_external_refs(c, raw, main_url=url, base_url=base_url)
        object_refs = self.collect_object_refs(infra_ref=infra_ref, observed_ref=observed_ref, location_refs=location_refs,
                                               indicator_refs=indicator_refs, vuln_refs=vuln_refs, attack_refs=attack_refs)
        custom = {
            "x_orion_network": str(network) if network else None,
            "x_orion_attack_vector": str(attack_vector),
            "x_orion_mirror_links_count": str(len(c.as_list(c.safe_get(raw, "m_mirror_links")))) if c.as_list(c.safe_get(raw, "m_mirror_links")) else None
        }
        return self.finalize_bundle(c, created, modified, title, summary, labels, lang, external_refs, object_refs, doc_id, "defacement", tlp_amber_id, **custom)
