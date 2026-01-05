from __future__ import annotations

from typing import Any, Dict, Optional

from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import \
    result_item as DefacementResultItem
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import \
    result_item as ExploitResultItem
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import \
    result_item as LeakResultItem
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import \
    result_item as SocialResultItem
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import \
    result_item as GeneralResultItem
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import \
    result_item as ChatResultItem
from orion.api.interactive.search_manager.search_model import search_model
from orion.services.stix_manager.stix_helper import stix_helper


class StixManager:
    __instance: StixManager | None = None

    def __init__(self) -> None:
        if StixManager.__instance is not None: raise Exception("This class is a singleton!")
        self._search_model = search_model.getInstance()
        StixManager.__instance = self

    @staticmethod
    def get_instance() -> StixManager:
        if StixManager.__instance is None: StixManager()
        return StixManager.__instance

    async def get_defacement_stix(self, doc_id: str) -> Dict[str, Any]:
        raw = await self._search_model.request_defacement_doc(doc_id)
        if raw is None: return {"error": "No defacement document found", "doc_id": doc_id}
        return self._convert_defacement(DefacementResultItem(**raw))

    async def get_exploit_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_exploit_doc(doc_id, lang)
        if raw is None: return {"error": "No exploit document found", "doc_id": doc_id}
        return self._convert_exploit(ExploitResultItem(**raw))

    async def get_leak_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_leak_doc(doc_id, lang)
        if raw is None: return {"error": "No leak document found", "doc_id": doc_id}
        return self._convert_leak(LeakResultItem(**raw))

    async def get_social_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_social_doc(doc_id, lang)
        if raw is None: return {"error": "No social document found", "doc_id": doc_id}
        return self._convert_social(SocialResultItem(**raw))

    async def get_general_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_general_doc(doc_id, lang)
        if raw is None: return {"error": "No general document found", "doc_id": doc_id}
        return self._convert_general(GeneralResultItem(**raw))

    async def get_chat_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_chat_doc(doc_id, lang)
        if raw is None: return {"error": "No chat document found", "doc_id": doc_id}
        return self._convert_chat(ChatResultItem(**raw))

    def _convert_defacement(self, raw: DefacementResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._parse_dates(c, raw, ["m_leak_date", "m_creation_date", "m_update_date"])
        title, url, base_url, network, platform, doc_id, summary = self._get_common_fields(
            c, raw, "Defacement - unknown title",
            ["m_title", "m_url", "m_base_url", "m_mirror_links", "m_content"]
        )
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types, labels = self._process_content_types_and_labels(
            c, raw, network, platform, "orion:defacement"
        )
        lang = self._get_language(c, raw)
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                        keys=["m_country", "m_location"])

        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._extract_network_data(
            c, raw, url, base_url, ["m_mirror_links", "m_source_url"]
        )

        infra_seed = c.first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_ref = self._create_infrastructure(
            c, infra_seed, created, modified, title, summary, labels,
            tlp_amber_id, network, ["unknown"]
        )

        sco_refs = c.add_scos(tlp_amber_id=tlp_amber_id, url_vals=url_vals, domain_vals=domain_vals,
                              ip_vals=ip_vals, email_vals=email_vals, asn_vals=asn_vals, dir_vals=file_paths)
        observed_ref = c.add_observed(doc_id=str(doc_id), created=created, modified=modified,
                                      tlp_amber_id=tlp_amber_id, sco_refs=sco_refs)

        indicator_refs = c.add_indicators(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                          labels=labels, summary=summary, domain_vals=domain_vals,
                                          url_vals=url_vals, ip_vals=ip_vals, email_vals=email_vals,
                                          indicator_types_default="malicious-activity")
        indicator_refs.extend(c.add_yara_indicators(created=created, modified=modified,
                                                    tlp_amber_id=tlp_amber_id, labels=labels,
                                                    yara_rules=c.as_list(c.safe_get(raw, "m_yara_rule"))))
        vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                cves=c.as_list(c.safe_get(raw, "m_cve")))
        attack_refs = c.add_attack_patterns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                            tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")),
                                            techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques")))

        external_refs = self._create_external_refs(c, raw, url, base_url)
        attack_vector = c.first_nonempty(
            (c.as_list(c.safe_get(raw, "m_ioc_type"))[0] if c.as_list(c.safe_get(raw, "m_ioc_type")) else None),
            (c.as_list(c.safe_get(raw, "m_web_server"))[0] if c.as_list(c.safe_get(raw, "m_web_server")) else None),
            "Unknown"
        )

        report_object_refs = self._collect_report_refs(
            [infra_ref, observed_ref], location_refs, indicator_refs, vuln_refs, attack_refs
        )

        mirror_links = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_mirror_links")) if str(x).strip()]
        report = self._create_report(
            c, "defacement", doc_id, created, modified, title, summary, labels, lang,
            external_refs, report_object_refs, tlp_amber_id, network=network,
            attack_vector=attack_vector, mirror_links_count=len(mirror_links) if mirror_links else None
        )

        return {"type": "bundle", "id": c.stix_id("bundle", report["id"]),
                "spec_version": "2.1", "objects": c.objects}

    def _convert_exploit(self, raw: ExploitResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._parse_dates(c, raw, ["m_creation_date", "m_update_date", "m_leak_date"])
        title, url, base_url, network, platform, doc_id, summary = self._get_common_fields(
            c, raw, "Exploit - unknown title",
            ["m_title", "m_url", "m_weblink"]
        )

        code_snips = [str(x) for x in c.as_list(c.safe_get(raw, "m_code_snippet")) if str(x).strip()]
        if code_snips and len(summary) < 600:
            extra = c.clean_text(code_snips[0])
            if extra:
                summary = (summary + "\n\n" + extra) if summary else extra
                if len(summary) > 4000: summary = summary[:4000] + "…"

        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types, labels = self._process_content_types_and_labels(
            c, raw, network, platform, "orion:exploit"
        )
        lang = self._get_language(c, raw)
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                        keys=["m_country", "m_location"])

        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"), c.safe_get(raw, "m_name"))
        actor_ref = self._create_actor(c, team, created, modified, summary, tlp_amber_id) if team and str(
            team).strip() else None

        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._extract_network_data(
            c, raw, url, base_url, ["m_weblink"]
        )

        infra_seed = c.first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_types = ["unknown"]
        if "c2" in content_types:
            infra_types = ["command-and-control"]
        elif str(network).lower() == "onion":
            infra_types = ["anonymization"]

        infra_name = str(c.first_nonempty(title, c.safe_get(raw, "m_name"), "Exploit infrastructure"))
        infra_ref = self._create_infrastructure(
            c, infra_seed, created, modified, infra_name, summary, labels,
            tlp_amber_id, network, infra_types
        )

        sco_refs = c.add_scos(tlp_amber_id=tlp_amber_id, url_vals=url_vals, domain_vals=domain_vals,
                              ip_vals=ip_vals, email_vals=email_vals, asn_vals=asn_vals, dir_vals=file_paths)
        observed_ref = c.add_observed(doc_id=str(doc_id), created=created, modified=modified,
                                      tlp_amber_id=tlp_amber_id, sco_refs=sco_refs)

        indicator_refs = c.add_indicators(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                          labels=labels, summary=summary, domain_vals=domain_vals,
                                          url_vals=url_vals, ip_vals=ip_vals, email_vals=email_vals,
                                          indicator_types_default="malicious-activity")
        indicator_refs.extend(c.add_yara_indicators(created=created, modified=modified,
                                                    tlp_amber_id=tlp_amber_id, labels=labels,
                                                    yara_rules=c.as_list(c.safe_get(raw, "m_yara_rule"))))
        vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                cves=c.as_list(c.safe_get(raw, "m_cve")))
        attack_refs = c.add_attack_patterns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                            tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")),
                                            techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques")))

        note_ref = self._create_sensitive_note(c, raw, doc_id, created, tlp_red_id)
        external_refs = self._create_external_refs(c, raw, url, base_url)

        report_object_refs = self._collect_report_refs(
            [actor_ref, infra_ref, observed_ref, note_ref], location_refs, indicator_refs, vuln_refs, attack_refs
        )

        report = self._create_report(
            c, "exploit", doc_id, created, modified, title, summary, labels, lang,
            external_refs, report_object_refs, tlp_amber_id, network=network, platform=platform
        )

        return {"type": "bundle", "id": c.stix_id("bundle", report["id"]),
                "spec_version": "2.1", "objects": c.objects}

    def _convert_leak(self, raw: LeakResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._parse_dates(c, raw, ["m_creation_date", "m_update_date"])
        title, url, base_url, network, platform, doc_id, summary = self._get_common_fields(
            c, raw, "Leak - unknown title",
            ["m_title", "m_url", "m_base_url"]
        )
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types, labels = self._process_content_types_and_labels(
            c, raw, network, platform, "orion:leak"
        )
        lang = self._get_language(c, raw)
        industries = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else None
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                        keys=["m_country", "m_location"])

        victim_refs = self._create_victims(c, raw, created, modified, sector, tlp_amber_id, location_refs)

        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"))
        actor_ref = self._create_actor(c, team, created, modified, summary, tlp_amber_id) if team and str(
            team).strip() else None

        infra_seed = c.first_nonempty(base_url, url, (
            c.as_list(c.safe_get(raw, "m_domain"))[0] if c.as_list(c.safe_get(raw, "m_domain")) else None))
        infra_types = ["unknown"]
        if str(network).lower() == "onion": infra_types = ["anonymization"]
        if "ransomware" in content_types: infra_types = ["command-and-control"]

        infra_name = str(c.first_nonempty(c.safe_get(raw, "m_team"), title, "Leak infrastructure"))
        infra_ref = self._create_infrastructure(
            c, infra_seed, created, modified, infra_name, summary, labels,
            tlp_amber_id, network, infra_types
        )

        if actor_ref and infra_ref:
            rel = {"type": "relationship", "spec_version": "2.1",
                   "id": c.stix_id("relationship", f"{actor_ref}|uses|{infra_ref}"),
                   "created": created, "modified": modified, "relationship_type": "uses",
                   "source_ref": actor_ref, "target_ref": infra_ref, "object_marking_refs": [tlp_amber_id]}
            c.add_obj(rel, ("relationship", f"{actor_ref}|uses|{infra_ref}"))

        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._extract_network_data(
            c, raw, url, base_url, ["m_dumplink", "m_websites"]
        )

        sco_refs = c.add_scos(tlp_amber_id=tlp_amber_id, url_vals=url_vals, domain_vals=domain_vals,
                              ip_vals=ip_vals, email_vals=email_vals, asn_vals=asn_vals, dir_vals=file_paths)
        observed_ref = c.add_observed(doc_id=str(doc_id), created=created, modified=modified,
                                      tlp_amber_id=tlp_amber_id, sco_refs=sco_refs)

        indicator_refs = c.add_indicators(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                          labels=labels, summary=summary, domain_vals=domain_vals,
                                          url_vals=url_vals, ip_vals=ip_vals, email_vals=email_vals,
                                          indicator_types_default="malicious-activity")
        indicator_refs.extend(c.add_yara_indicators(created=created, modified=modified,
                                                    tlp_amber_id=tlp_amber_id, labels=labels,
                                                    yara_rules=c.as_list(c.safe_get(raw, "m_yara_rule"))))
        vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                cves=c.as_list(c.safe_get(raw, "m_cve")))
        attack_refs = c.add_attack_patterns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                            tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")),
                                            techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques")))

        note_ref = self._create_sensitive_note(c, raw, doc_id, created, tlp_red_id)
        external_refs = self._create_external_refs(c, raw, url, base_url)
        if c.safe_get(raw, "m_screenshot"):
            external_refs.append({"source_name": "screenshot", "external_id": str(c.safe_get(raw, "m_screenshot"))})

        dump_links = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_dumplink")) if str(x).strip()]
        report_object_refs = self._collect_report_refs(
            [actor_ref, infra_ref, observed_ref, note_ref], victim_refs + location_refs,
            indicator_refs, vuln_refs, attack_refs
        )

        report = self._create_report(
            c, "leak", doc_id, created, modified, title, summary, labels, lang,
            external_refs, report_object_refs, tlp_amber_id, network=network,
            platform=platform, dumplink_count=len(dump_links) if dump_links else None
        )

        return {"type": "bundle", "id": c.stix_id("bundle", report["id"]),
                "spec_version": "2.1", "objects": c.objects}

    def _convert_social(self, raw: SocialResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._parse_dates(c, raw, ["m_creation_date", "m_update_date", "m_message_date"])
        title, url, base_url, network, platform, doc_id, summary = self._get_common_fields(
            c, raw, "Social - unknown title",
            ["m_title", "m_url", "m_channel_url"]
        )
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types, labels = self._process_content_types_and_labels(
            c, raw, network, platform, "orion:social"
        )
        lang = self._get_language(c, raw)
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                        keys=["m_country", "m_location"])

        author = c.first_nonempty(c.safe_get(raw, "m_author"), c.safe_get(raw, "m_username"))
        created_by_ref = self._create_identity(c, author, created, modified, tlp_amber_id, "author",
                                               "individual") if author else None

        domain_vals, url_vals, ip_vals, email_vals, asn_vals, path_vals = self._extract_social_network_data(c, raw, url,
                                                                                                            base_url)

        xmpp_vals = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_xmpp_addresses")) if str(x).strip()]
        crypto_vals = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_crypto_address")) if str(x).strip()]
        user_agents = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_user_agents")) if str(x).strip()]
        hashtags = [str(x).strip().lstrip("#") for x in c.as_list(c.safe_get(raw, "m_hashtag")) if str(x).strip()]
        mentions = [str(x).strip().lstrip("@") for x in c.as_list(c.safe_get(raw, "m_mention")) if str(x).strip()]

        extra_scos = []
        for x in xmpp_vals: extra_scos.append({"type": "x-mpp-addr", "id": c.sco_id("x-mpp-addr", x), "value": x})
        for w in crypto_vals: extra_scos.append(
            {"type": "cryptocurrency-wallet", "id": c.sco_id("cryptocurrency-wallet", w), "address": w})
        for ua in user_agents: extra_scos.append({"type": "user-agent", "id": c.sco_id("user-agent", ua), "string": ua})

        infra_seed = c.first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_types = ["unknown"]
        if str(network).lower() == "onion": infra_types = ["anonymization"]

        infra_name = str(c.first_nonempty(platform, title, "Social infrastructure"))
        infra_ref = self._create_infrastructure(
            c, infra_seed, created, modified, infra_name, summary, labels,
            tlp_amber_id, network, infra_types, platform=platform
        )

        sco_refs = c.add_scos(tlp_amber_id=tlp_amber_id, url_vals=url_vals, domain_vals=domain_vals,
                              ip_vals=ip_vals, email_vals=email_vals, asn_vals=asn_vals,
                              dir_vals=path_vals, extra_scos=extra_scos)
        observed_ref = c.add_observed(doc_id=str(doc_id), created=created, modified=modified,
                                      tlp_amber_id=tlp_amber_id, sco_refs=sco_refs)

        indicator_refs = c.add_indicators(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                          labels=labels, summary=summary, domain_vals=domain_vals,
                                          url_vals=url_vals, ip_vals=ip_vals, email_vals=email_vals,
                                          indicator_types_default="malicious-activity")
        indicator_refs.extend(c.add_yara_indicators(created=created, modified=modified,
                                                    tlp_amber_id=tlp_amber_id, labels=labels,
                                                    yara_rules=c.as_list(c.safe_get(raw, "m_yara_rule"))))
        vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                cves=c.as_list(c.safe_get(raw, "m_cve")))
        attack_refs = c.add_attack_patterns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                            tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")),
                                            techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques")))

        note_ref = self._create_social_note(c, raw, doc_id, created, tlp_red_id, tlp_amber_id, hashtags, mentions)
        external_refs = self._create_social_external_refs(c, raw, url, base_url)

        report_object_refs = self._collect_report_refs(
            [infra_ref, observed_ref, note_ref, created_by_ref], location_refs,
            indicator_refs, vuln_refs, attack_refs
        )

        report = self._create_report(
            c, "social", doc_id, created, modified, title, summary, labels, lang,
            external_refs, report_object_refs, tlp_amber_id, created_by_ref=created_by_ref,
            network=network, platform=platform,
            post_comments_count=c.safe_get(raw, "m_post_comments_count")
        )

        return {"type": "bundle", "id": c.stix_id("bundle", report["id"]),
                "spec_version": "2.1", "objects": c.objects}

    def _convert_general(self, raw: GeneralResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._parse_dates(c, raw, ["m_creation_date", "m_update_date"])
        title, url, base_url, network, platform, doc_id, summary = self._get_common_fields(
            c, raw, "General - unknown title",
            ["m_title", "m_url", "m_base_url"]
        )
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types, labels = self._process_content_types_and_labels_extended(c, raw, network, "orion:general")
        lang = self._get_language(c, raw)
        industries = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else None
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                        keys=["m_country", "m_location"])

        victim_refs = self._create_victims(c, raw, created, modified, sector, tlp_amber_id, location_refs)

        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"))
        actor_ref = self._create_actor(c, team, created, modified, summary, tlp_amber_id) if team and str(
            team).strip() else None

        domain_vals, url_vals, ip_vals, email_vals, asn_vals, path_vals = self._extract_network_data(
            c, raw, url, base_url, []
        )

        infra_seed = c.first_nonempty(url, base_url, (domain_vals[0] if domain_vals else None))
        infra_types = ["unknown"]
        if str(network).lower() == "onion":
            infra_types = ["anonymization"]
        elif "darkweb" in content_types:
            infra_types = ["hosting-malware"]

        infra_name = str(c.first_nonempty(c.safe_get(raw, "m_team"), title, "Observed infrastructure"))
        infra_ref = self._create_infrastructure(
            c, infra_seed, created, modified, infra_name, summary, labels,
            tlp_amber_id, network, infra_types
        )

        if actor_ref and infra_ref:
            rel = {"type": "relationship", "spec_version": "2.1",
                   "id": c.stix_id("relationship", f"{actor_ref}|uses|{infra_ref}"),
                   "created": created, "modified": modified, "relationship_type": "uses",
                   "source_ref": actor_ref, "target_ref": infra_ref, "object_marking_refs": [tlp_amber_id]}
            c.add_obj(rel, ("relationship", f"{actor_ref}|uses|{infra_ref}"))

        sco_refs = c.add_scos(tlp_amber_id=tlp_amber_id, url_vals=url_vals, domain_vals=domain_vals,
                              ip_vals=ip_vals, email_vals=email_vals, asn_vals=asn_vals, dir_vals=path_vals)
        observed_ref = c.add_observed(doc_id=str(doc_id), created=created, modified=modified,
                                      tlp_amber_id=tlp_amber_id, sco_refs=sco_refs)

        indicator_refs = c.add_indicators(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                          labels=labels, summary=summary, domain_vals=domain_vals,
                                          url_vals=url_vals, ip_vals=ip_vals, email_vals=email_vals,
                                          indicator_types_default="malicious-activity")
        indicator_refs.extend(c.add_yara_indicators(created=created, modified=modified,
                                                    tlp_amber_id=tlp_amber_id, labels=labels,
                                                    yara_rules=c.as_list(c.safe_get(raw, "m_yara_rule"))))
        vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                cves=c.as_list(c.safe_get(raw, "m_cve")))
        attack_refs = c.add_attack_patterns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                            tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")),
                                            techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques")))

        note_ref = self._create_sensitive_note(c, raw, doc_id, created, tlp_red_id)
        external_refs = self._create_external_refs(c, raw, url, base_url)
        if c.safe_get(raw, "m_screenshot"):
            external_refs.append({"source_name": "screenshot", "external_id": str(c.safe_get(raw, "m_screenshot"))})

        report_object_refs = self._collect_report_refs(
            [actor_ref, infra_ref, observed_ref, note_ref], victim_refs + location_refs,
            indicator_refs, vuln_refs, attack_refs
        )

        report = self._create_report(
            c, "report", doc_id, created, modified, title, summary, labels, lang,
            external_refs, report_object_refs, tlp_amber_id, network=network
        )

        return {"type": "bundle", "id": c.stix_id("bundle", report["id"]),
                "spec_version": "2.1", "objects": c.objects}

    def _convert_chat(self, raw: ChatResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._parse_dates(c, raw, ["m_creation_date", "m_update_date", "m_message_date"])
        caption = str(
            c.first_nonempty(c.safe_get(raw, "m_caption"), c.safe_get(raw, "m_content"), "Chat - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_message_sharable_link"), c.safe_get(raw, "m_media_url"))
        channel_url = c.safe_get(raw, "m_channel_url")
        channel_id = c.safe_get(raw, "m_channel_id")
        platform = c.safe_get(raw, "m_platform")
        network = c.safe_get(raw, "m_network") or (str(platform).strip().lower() if platform else None)
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"),
                                  c.safe_get(raw, "m_message_id"), url, channel_id, caption)
        content_src = c.first_nonempty(c.safe_get(raw, "m_content"), c.safe_get(raw, "m_media_caption"), "")
        summary = c.clean_text(str(content_src or ""))
        if len(summary) > 4000: summary = summary[:4000] + "…"

        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types, labels = self._process_content_types_and_labels(
            c, raw, network, platform, "orion:chat"
        )
        lang = self._get_language(c, raw)

        sender = c.first_nonempty(c.safe_get(raw, "m_sender_username"), c.safe_get(raw, "m_users"),
                                  c.safe_get(raw, "m_author"))
        created_by_ref = self._create_identity(c, sender, created, modified, tlp_amber_id, "sender",
                                               "individual") if sender else None

        channel_name = c.first_nonempty(c.safe_get(raw, "m_channel_name"), channel_id, channel_url, "Chat channel")
        infra_seed = c.first_nonempty(channel_url, channel_id)
        infra_types = ["unknown"]
        if str(platform).strip().lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)):
            infra_types = ["communications"]

        infra_ref = self._create_infrastructure(
            c, infra_seed, created, modified, str(channel_name), summary, labels,
            tlp_amber_id, network, infra_types, channel_id=channel_id
        )

        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._extract_chat_network_data(c, raw, url,
                                                                                                           channel_url)

        mentions = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_mention")) if str(x).strip()]
        hashtags = [str(x).strip().lstrip("#") for x in c.as_list(c.safe_get(raw, "m_hashtag")) if str(x).strip()]
        user_agents = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_user_agents")) if str(x).strip()]
        cves = [str(x).strip().upper() for x in c.as_list(c.safe_get(raw, "m_cve")) if str(x).strip()]

        extra_scos = []
        for ua in user_agents: extra_scos.append({"type": "user-agent", "id": c.sco_id("user-agent", ua), "string": ua})

        sco_refs = c.add_scos(tlp_amber_id=tlp_amber_id, url_vals=url_vals, domain_vals=domain_vals,
                              ip_vals=ip_vals, email_vals=email_vals, asn_vals=asn_vals,
                              dir_vals=file_paths, extra_scos=extra_scos)
        observed_ref = c.add_observed(doc_id=str(doc_id), created=created, modified=modified,
                                      tlp_amber_id=tlp_amber_id, sco_refs=sco_refs)

        indicator_refs = c.add_indicators(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                          labels=labels, summary=summary, domain_vals=domain_vals,
                                          url_vals=url_vals, ip_vals=ip_vals, email_vals=email_vals,
                                          indicator_types_default="malicious-activity")
        indicator_refs.extend(c.add_yara_indicators(created=created, modified=modified,
                                                    tlp_amber_id=tlp_amber_id, labels=labels,
                                                    yara_rules=c.as_list(c.safe_get(raw, "m_yara_rule"))))

        vuln_only = [x for x in cves if x.startswith("CVE-")]
        vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                cves=c.dedupe_keep(vuln_only))
        attack_refs = c.add_attack_patterns(created=created, modified=modified, tlp_amber_id=tlp_amber_id,
                                            tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")),
                                            techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques")))

        note_ref = self._create_chat_note(c, raw, doc_id, created, tlp_red_id, tlp_amber_id, hashtags, mentions)
        external_refs = self._create_chat_external_refs(c, raw, url, channel_url)

        report_object_refs = self._collect_report_refs(
            [infra_ref, observed_ref, note_ref, created_by_ref],
            vuln_refs, indicator_refs, attack_refs
        )

        report = self._create_chat_report(
            c, doc_id, created, modified, caption, summary, labels, lang,
            external_refs, report_object_refs, tlp_amber_id, created_by_ref,
            network, platform, channel_id, raw
        )

        return {"type": "bundle", "id": c.stix_id("bundle", report["id"]),
                "spec_version": "2.1", "objects": c.objects}

    # Helper methods to remove duplication

    def _parse_dates(self, c, raw, date_fields):
        created = None
        for field in date_fields:
            created = c.parse_ts(c.safe_get(raw, field))
            if created: break
        if not created: created = c.now_ts()

        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created: modified = created
        return created, modified

    def _get_common_fields(self, c, raw, default_title, title_fields):
        title_options = [c.safe_get(raw, field) for field in title_fields]
        title = str(c.first_nonempty(*title_options, default_title))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"))
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"),
                                  url, base_url, title)
        content_src = c.first_nonempty(c.safe_get(raw, "m_important_content"),
                                       c.safe_get(raw, "m_content"), "")
        summary = c.clean_text(str(content_src or ""))
        if len(summary) > 4000: summary = summary[:4000] + "…"
        return title, url, base_url, network, platform, doc_id, summary

    def _process_content_types_and_labels(self, c, raw, network, platform, default_label):
        content_types = set()
        for x in (c.as_list(c.safe_get(raw, "m_content_type")) + c.as_list(c.safe_get(raw, "content_type"))):
            s = str(x).strip().lower()
            if s: content_types.add(s)
        labels_set = set()
        for ct in content_types:
            if ct: labels_set.add(ct)
        if network: labels_set.add(str(network).strip().lower())
        if platform: labels_set.add(f"platform:{str(platform).strip().lower()}")
        labels_set.add(default_label)
        labels = list(labels_set)
        return content_types, labels

    def _process_content_types_and_labels_extended(self, c, raw, network, default_label):
        content_types = set()
        for x in (c.as_list(c.safe_get(raw, "m_content_type")) + c.as_list(c.safe_get(raw, "content_type"))):
            s = str(x).strip().lower()
            if s: content_types.add(s)
        labels_set = set()
        for ct in content_types:
            if ct: labels_set.add(ct)
        if network: labels_set.add(str(network).strip().lower())
        for p in c.as_list(c.safe_get(raw, "m_platform")):
            sp = str(p).strip().lower()
            if sp: labels_set.add(f"platform:{sp}")
        for h in c.as_list(c.safe_get(raw, "m_hashtag")):
            sh = str(h).strip().lstrip("#").lower()
            if sh: labels_set.add(f"tag:{sh}")
        labels_set.add(default_label)
        labels = list(labels_set)
        return content_types, labels

    def _get_language(self, c, raw):
        langs = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_language")) if str(x).strip()]
        return langs[0] if len(langs) == 1 else None

    def _extract_network_data(self, c, raw, url, base_url, extra_url_fields):
        domain_vals = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_domain")) if str(x).strip()]
        url_vals = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_url")) if str(x).strip()]
        ip_vals = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_ip")) if str(x).strip()]
        email_vals = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_email")) if str(x).strip()]
        asn_vals = [str(x).strip().upper().lstrip("AS") for x in c.as_list(c.safe_get(raw, "m_asns")) if str(x).strip()]
        file_paths = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_file_paths")) if str(x).strip()]
        encoded_urls = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_encoded_urls")) if str(x).strip()]

        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")): url_vals.append(eu)

        for field in extra_url_fields:
            for val in c.as_list(c.safe_get(raw, field)):
                if val and str(val).strip().startswith(("http://", "https://")):
                    url_vals.append(str(val).strip())

        if url: url_vals.append(str(url))

        domain_vals = c.dedupe_keep(domain_vals)
        url_vals = c.dedupe_keep(url_vals)
        ip_vals = c.dedupe_keep(ip_vals)
        email_vals = c.dedupe_keep(email_vals)
        asn_vals = c.dedupe_keep([a for a in asn_vals if a.isdigit()])
        file_paths = c.dedupe_keep(file_paths)

        return domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths

    def _extract_social_network_data(self, c, raw, url, base_url):
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, path_vals = self._extract_network_data(
            c, raw, url, base_url, ["m_social_media_profiles"]
        )
        return domain_vals, url_vals, ip_vals, email_vals, asn_vals, path_vals

    def _extract_chat_network_data(self, c, raw, url, channel_url):
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._extract_network_data(
            c, raw, url, channel_url, ["m_weblink"]
        )
        return domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths

    def _create_infrastructure(self, c, infra_seed, created, modified, name, summary,
            labels, tlp_amber_id, network, infra_types, **kwargs):
        if not infra_seed: return None
        infra = {
            "type": "infrastructure", "spec_version": "2.1",
            "id": c.stix_id("infrastructure", f"infra:{infra_seed}"),
            "created": created, "modified": modified, "name": name,
            "description": summary if summary else None,
            "infrastructure_types": infra_types, "first_seen": created,
            "last_seen": modified, "labels": labels,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_network": str(network) if network else None
        }
        infra.update({k: v for k, v in kwargs.items() if v is not None})
        infra = {k: v for k, v in infra.items() if v is not None}
        return c.add_obj(infra, ("infrastructure", f"infra:{infra_seed}"))

    def _create_actor(self, c, team, created, modified, summary, tlp_amber_id):
        if not team or not str(team).strip(): return None
        tname = str(team).strip()
        actor = {
            "type": "intrusion-set", "spec_version": "2.1",
            "id": c.stix_id("intrusion-set", f"team:{tname}"),
            "created": created, "modified": modified, "name": tname,
            "description": summary if summary else None,
            "object_marking_refs": [tlp_amber_id]
        }
        actor = {k: v for k, v in actor.items() if v is not None}
        return c.add_obj(actor, ("intrusion-set", f"team:{tname}"))

    def _create_identity(self, c, entity, created, modified, tlp_amber_id, prefix, identity_class):
        if not entity: return None
        entity_name = str(entity[0]).strip() if type(entity) is list and entity else str(entity).strip()
        if not entity_name: return None
        ident = {
            "type": "identity", "spec_version": "2.1",
            "id": c.stix_id("identity", f"{prefix}:{entity_name}"),
            "created": created, "modified": modified, "name": entity_name,
            "identity_class": identity_class, "object_marking_refs": [tlp_amber_id]
        }
        return c.add_obj(ident, ("identity", f"{prefix}:{entity_name}"))

    def _create_victims(self, c, raw, created, modified, sector, tlp_amber_id, location_refs):
        victim_refs = []
        for org in (c.as_list(c.safe_get(raw, "m_org")) + c.as_list(c.safe_get(raw, "m_company_name"))):
            name = str(org).strip()
            if not name: continue
            ident = {
                "type": "identity", "spec_version": "2.1",
                "id": c.stix_id("identity", f"victim:{name}"),
                "created": created, "modified": modified, "name": name,
                "identity_class": "organization",
                "sectors": [sector] if sector else None,
                "object_marking_refs": [tlp_amber_id]
            }
            ident = {k: v for k, v in ident.items() if v is not None}
            victim_refs.append(c.add_obj(ident, ("identity", f"victim:{name}")))

        for vref in victim_refs:
            for lref in location_refs:
                rel = {
                    "type": "relationship", "spec_version": "2.1",
                    "id": c.stix_id("relationship", f"{vref}|located-at|{lref}"),
                    "created": created, "modified": modified, "relationship_type": "located-at",
                    "source_ref": vref, "target_ref": lref, "object_marking_refs": [tlp_amber_id]
                }
                c.add_obj(rel, ("relationship", f"{vref}|located-at|{lref}"))
        return victim_refs

    def _collect_report_refs(self, primary_refs, *secondary_ref_lists):
        report_object_refs = []
        for ref in primary_refs:
            if ref: report_object_refs.append(ref)
        for ref_list in secondary_ref_lists:
            report_object_refs.extend(ref_list)
        return c.dedupe_keep(report_object_refs)

    def _create_external_refs(self, c, raw, url, base_url):
        external_refs = []
        if url: external_refs.append({"source_name": "source", "url": str(url)})
        if base_url and base_url != url: external_refs.append({"source_name": "base_url", "url": str(base_url)})
        if c.safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(c.safe_get(raw, "m_hash"))})
        if c.safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(c.safe_get(raw, "m_scrap_file"))})
        return external_refs

    def _create_social_external_refs(self, c, raw, url, base_url):
        external_refs = self._create_external_refs(c, raw, url, base_url)
        if c.safe_get(raw, "m_message_sharable_link"):
            external_refs.append({"source_name": "share_link", "url": str(c.safe_get(raw, "m_message_sharable_link"))})
        return external_refs

    def _create_chat_external_refs(self, c, raw, url, channel_url):
        external_refs = []
        if url: external_refs.append({"source_name": "source", "url": str(url)})
        if channel_url and channel_url != url:
            external_refs.append({"source_name": "channel_url", "url": str(channel_url)})
        if c.safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(c.safe_get(raw, "m_hash"))})
        if c.safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(c.safe_get(raw, "m_scrap_file"))})
        if c.safe_get(raw, "m_message_id"):
            external_refs.append({"source_name": "message_id", "external_id": str(c.safe_get(raw, "m_message_id"))})
        return external_refs

    def _create_sensitive_note(self, c, raw, doc_id, created, tlp_red_id):
        sensitive = {}
        c.sensitive_add(sensitive=sensitive, cat="credit_cards", values=c.as_list(c.safe_get(raw, "m_credit_card")))
        c.sensitive_add(sensitive=sensitive, cat="us_passport", values=c.as_list(c.safe_get(raw, "m_us_passport")))
        c.sensitive_add(sensitive=sensitive, cat="au_abn", values=c.as_list(c.safe_get(raw, "m_au_abn")))
        c.sensitive_add(sensitive=sensitive, cat="us_bank_number",
                        values=c.as_list(c.safe_get(raw, "m_us_bank_number")))
        if not sensitive: return None
        note = {
            "type": "note", "spec_version": "2.1",
            "id": c.stix_id("note", f"sensitive|{doc_id}|{created}"),
            "created": created, "modified": created,
            "abstract": "Sensitive artifacts (hashed)",
            "content": str(sensitive), "object_marking_refs": [tlp_red_id]
        }
        return c.add_obj(note, ("note", note["id"]))

    def _create_social_note(self, c, raw, doc_id, created, tlp_red_id, tlp_amber_id, hashtags, mentions):
        sensitive = {}
        c.sensitive_add(sensitive=sensitive, cat="credit_cards", values=c.as_list(c.safe_get(raw, "m_credit_card")))
        c.sensitive_add(sensitive=sensitive, cat="us_passport", values=c.as_list(c.safe_get(raw, "m_us_passport")))
        c.sensitive_add(sensitive=sensitive, cat="au_abn", values=c.as_list(c.safe_get(raw, "m_au_abn")))
        c.sensitive_add(sensitive=sensitive, cat="us_bank_number",
                        values=c.as_list(c.safe_get(raw, "m_us_bank_number")))

        if not (sensitive or hashtags or mentions): return None

        content_note = {}
        if sensitive: content_note["sensitive_hashed"] = sensitive
        if hashtags: content_note["hashtags"] = hashtags
        if mentions: content_note["mentions"] = mentions

        note = {
            "type": "note", "spec_version": "2.1",
            "id": c.stix_id("note", f"social-meta|{doc_id}|{created}"),
            "created": created, "modified": created,
            "abstract": "Social metadata (and sensitive hashed)",
            "content": str(content_note),
            "object_marking_refs": [tlp_red_id] if sensitive else [tlp_amber_id]
        }
        return c.add_obj(note, ("note", note["id"]))

    def _create_chat_note(self, c, raw, doc_id, created, tlp_red_id, tlp_amber_id, hashtags, mentions):
        sensitive = {}
        c.sensitive_add(sensitive=sensitive, cat="credit_cards", values=c.as_list(c.safe_get(raw, "m_credit_card")))
        c.sensitive_add(sensitive=sensitive, cat="us_passport", values=c.as_list(c.safe_get(raw, "m_us_passport")))
        c.sensitive_add(sensitive=sensitive, cat="au_abn", values=c.as_list(c.safe_get(raw, "m_au_abn")))
        c.sensitive_add(sensitive=sensitive, cat="us_bank_number",
                        values=c.as_list(c.safe_get(raw, "m_us_bank_number")))

        if not (sensitive or hashtags or mentions): return None

        content_note = {}
        if sensitive: content_note["sensitive_hashed"] = sensitive
        if hashtags: content_note["hashtags"] = hashtags
        if mentions: content_note["mentions"] = mentions

        note = {
            "type": "note", "spec_version": "2.1",
            "id": c.stix_id("note", f"chat-meta|{doc_id}|{created}"),
            "created": created, "modified": created,
            "abstract": "Chat metadata (and sensitive hashed)",
            "content": str(content_note),
            "object_marking_refs": [tlp_red_id] if sensitive else [tlp_amber_id]
        }
        return c.add_obj(note, ("note", note["id"]))

    def _create_report(self, c, report_type, doc_id, created, modified, title, summary,
            labels, lang, external_refs, report_object_refs, tlp_amber_id, **kwargs):
        report = {
            "type": "report", "spec_version": "2.1",
            "id": c.stix_id("report", f"{report_type}:{doc_id}"),
            "created": created, "modified": modified, "name": title,
            "description": summary if summary else None,
            "report_types": ["threat-report"], "published": created,
            "labels": labels, "lang": lang,
            "external_references": external_refs or None,
            "object_refs": report_object_refs,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_doc_id": str(doc_id)
        }
        report.update({k: v for k, v in kwargs.items() if v is not None})
        report = {k: v for k, v in report.items() if v is not None}
        c.add_obj(report, ("report", report["id"]))
        return report

    def _create_chat_report(self, c, doc_id, created, modified, caption, summary,
            labels, lang, external_refs, report_object_refs,
            tlp_amber_id, created_by_ref, network, platform,
            channel_id, raw):
        report = {
            "type": "report", "spec_version": "2.1",
            "id": c.stix_id("report", f"chat:{doc_id}"),
            "created": created, "modified": modified, "name": caption,
            "description": summary if summary else None,
            "report_types": ["threat-report"], "published": created,
            "labels": labels, "lang": lang, "created_by_ref": created_by_ref,
            "external_references": external_refs or None,
            "object_refs": report_object_refs,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_doc_id": str(doc_id),
            "x_orion_network": str(network) if network else None,
            "x_orion_platform": str(platform) if platform else None,
            "x_orion_channel_id": str(channel_id) if channel_id else None,
            "x_orion_channel_name": str(c.safe_get(raw, "m_channel_name")) if c.safe_get(raw,
                                                                                         "m_channel_name") else None,
            "x_orion_views": str(c.safe_get(raw, "m_views")) if c.safe_get(raw, "m_views") else None,
            "x_orion_sender_is_bot": bool(c.safe_get(raw, "m_sender_is_bot")) if c.safe_get(raw,
                                                                                            "m_sender_is_bot") is not None else None,
            "x_orion_is_forwarded": bool(c.safe_get(raw, "m_is_forwarded")) if c.safe_get(raw,
                                                                                          "m_is_forwarded") is not None else None,
            "x_orion_is_reply": bool(c.safe_get(raw, "m_is_reply")) if c.safe_get(raw,
                                                                                  "m_is_reply") is not None else None,
            "x_orion_pinned": bool(c.safe_get(raw, "m_pinned")) if c.safe_get(raw, "m_pinned") is not None else None
        }
        report = {k: v for k, v in report.items() if v is not None}
        c.add_obj(report, ("report", report["id"]))
        return report