from __future__ import annotations

from typing import Any, Dict, Optional, List

from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import result_item as DefacementResultItem
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import result_item as ExploitResultItem
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import result_item as LeakResultItem
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import result_item as SocialResultItem
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import result_item as GeneralResultItem
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import result_item as ChatResultItem
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
        return StixManager.__instance # type: ignore[return-value]

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

    def _get_content_types(self, c, raw: Any) -> set[str]:
        content_types: set[str] = set()
        for x in (c.as_list(c.safe_get(raw, "m_content_type")) + c.as_list(c.safe_get(raw, "content_type"))):
            s = str(x).strip().lower()
            if s:
                content_types.add(s)
        return content_types

    def _process_iocs(self, c, raw: Any, main_url: Optional[str] = None, extra_urls: Optional[List[str]] = None) -> tuple[List[str], List[str], List[str], List[str], List[str], List[str]]:
        domain_vals = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_domain")) if str(x).strip()]
        url_vals = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_url")) if str(x).strip()]
        if main_url:
            url_vals.append(str(main_url))
        if extra_urls:
            for u in extra_urls:
                if str(u).startswith(("http://", "https://")):
                    url_vals.append(str(u))
        encoded_urls = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_encoded_urls")) if str(x).strip()]
        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)
        domain_vals = c.dedupe_keep(domain_vals)
        url_vals = c.dedupe_keep(url_vals)
        ip_vals = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_ip")) if str(x).strip()])
        email_vals = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_email")) if str(x).strip()])
        asn_vals = c.dedupe_keep([a for a in [str(x).strip().upper().lstrip("AS") for x in c.as_list(c.safe_get(raw, "m_asns")) if str(x).strip()] if a.isdigit()])
        file_paths = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_file_paths")) if str(x).strip()])
        return domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths

    def _add_common_objects(self, c, created: str, modified: str, tlp_amber_id: str, labels: List[str], summary: Optional[str], doc_id: str, raw: Any,
                            domain_vals: List[str], url_vals: List[str], ip_vals: List[str], email_vals: List[str], asn_vals: List[str], file_paths: List[str],
                            extra_scos: Optional[List[dict]] = None, custom_cves: Optional[List[str]] = None) -> tuple[str, List[str], List[str], List[str]]:
        sco_refs = c.add_scos(tlp_amber_id=tlp_amber_id, url_vals=url_vals, domain_vals=domain_vals, ip_vals=ip_vals, email_vals=email_vals, asn_vals=asn_vals, dir_vals=file_paths, extra_scos=extra_scos)
        observed_ref = c.add_observed(doc_id=str(doc_id), created=created, modified=modified, tlp_amber_id=tlp_amber_id, sco_refs=sco_refs)
        indicator_refs = c.add_indicators(created=created, modified=modified, tlp_amber_id=tlp_amber_id, labels=labels, summary=summary, domain_vals=domain_vals, url_vals=url_vals, ip_vals=ip_vals, email_vals=email_vals, indicator_types_default="malicious-activity")
        indicator_refs.extend(c.add_yara_indicators(created=created, modified=modified, tlp_amber_id=tlp_amber_id, labels=labels, yara_rules=c.as_list(c.safe_get(raw, "m_yara_rule"))))
        cves = custom_cves if custom_cves is not None else c.as_list(c.safe_get(raw, "m_cve"))
        vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id, cves=cves)
        attack_refs = c.add_attack_patterns(created=created, modified=modified, tlp_amber_id=tlp_amber_id, tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")), techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques")))
        return observed_ref, indicator_refs, vuln_refs, attack_refs

    def _build_external_refs(self, c, raw: Any, main_url: Optional[str] = None, base_url: Optional[str] = None, extra: Optional[List[dict]] = None) -> Optional[List[dict]]:
        refs: List[dict] = []
        if main_url:
            refs.append({"source_name": "source", "url": str(main_url)})
        if base_url and base_url != main_url:
            refs.append({"source_name": "base_url", "url": str(base_url)})
        if c.safe_get(raw, "m_hash"):
            refs.append({"source_name": "content-hash", "external_id": str(c.safe_get(raw, "m_hash"))})
        if c.safe_get(raw, "m_scrap_file"):
            refs.append({"source_name": "scraper", "external_id": str(c.safe_get(raw, "m_scrap_file"))})
        if extra:
            refs.extend(extra)
        return refs or None

    def _add_sensitive_note(self, c, created: str, modified: str, tlp_amber_id: str, tlp_red_id: str, doc_id: str, raw: Any,
                            extra_content: Optional[dict] = None, base_abstract: str = "Sensitive artifacts") -> Optional[str]:
        sensitive: Dict[str, List[dict]] = {}
        c.sensitive_add(sensitive=sensitive, cat="credit_cards", values=c.as_list(c.safe_get(raw, "m_credit_card")))
        c.sensitive_add(sensitive=sensitive, cat="us_passport", values=c.as_list(c.safe_get(raw, "m_us_passport")))
        c.sensitive_add(sensitive=sensitive, cat="au_abn", values=c.as_list(c.safe_get(raw, "m_au_abn")))
        c.sensitive_add(sensitive=sensitive, cat="us_bank_number", values=c.as_list(c.safe_get(raw, "m_us_bank_number")))
        has_sensitive = bool(sensitive)
        if not has_sensitive and not extra_content:
            return None
        content: dict = {}
        if has_sensitive:
            content["sensitive_hashed"] = sensitive
        if extra_content:
            content.update(extra_content)
        abstract = base_abstract + (" (and sensitive hashed)" if has_sensitive else "")
        marking_refs = [tlp_red_id] if has_sensitive else [tlp_amber_id]
        note = {
            "type": "note",
            "spec_version": "2.1",
            "id": c.stix_id("note", f"sensitive|{doc_id}|{created}"),
            "created": created,
            "modified": modified,
            "abstract": abstract,
            "content": str(content),
            "object_marking_refs": marking_refs
        }
        return c.add_obj(note, ("note", note["id"]))

    def _finalize_bundle(self, c, created: str, modified: str, title: str, summary: Optional[str], labels: List[str], lang: Optional[str],
                         external_refs: Optional[List[dict]], object_refs: List[str], doc_id: str, type_str: str, tlp_amber_id: str,
                         created_by_ref: Optional[str] = None, **custom) -> Dict[str, Any]:
        object_refs = c.dedupe_keep(object_refs)
        report = {
            "type": "report",
            "spec_version": "2.1",
            "id": c.stix_id("report", f"{type_str}:{doc_id}"),
            "created": created,
            "modified": modified,
            "name": title,
            "description": summary,
            "report_types": ["threat-report"],
            "published": created,
            "labels": labels,
            "lang": lang,
            "created_by_ref": created_by_ref,
            "external_references": external_refs,
            "object_refs": object_refs,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_doc_id": str(doc_id),
            **custom
        }
        report = {k: v for k, v in report.items() if v is not None}
        c.add_obj(report, ("report", report["id"]))
        return {"type": "bundle", "id": c.stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": c.objects}

    def _convert_defacement(self, raw: DefacementResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_leak_date")) or c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created: modified = created
        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"),
                                    c.as_list(c.safe_get(raw, "m_mirror_links"))[0] if c.as_list(c.safe_get(raw, "m_mirror_links")) else None,
                                    str(c.safe_get(raw, "m_content")).splitlines()[0] if c.safe_get(raw, "m_content") else None, "Defacement - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"), c.as_list(c.safe_get(raw, "m_source_url"))[0] if c.as_list(c.safe_get(raw, "m_source_url")) else None,
                               c.as_list(c.safe_get(raw, "m_mirror_links"))[0] if c.as_list(c.safe_get(raw, "m_mirror_links")) else None)
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        summary_src = c.first_nonempty(c.safe_get(raw, "m_content"), c.safe_get(raw, "m_important_content"), "")
        summary = c.clean_text(str(summary_src or ""))
        if len(summary) > 4000: summary = summary[:4000] + "…"
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._get_content_types(c, raw)
        if not content_types:
            content_types.add("defacement")
        labels_set: set[str] = set(content_types)
        if network:
            labels_set.add(str(network).strip().lower())
        if c.safe_get(raw, "m_platform"):
            labels_set.add(f"platform:{str(c.safe_get(raw, "m_platform")).strip().lower()}")
        labels_set.add("orion:defacement")
        labels = list(labels_set)
        langs = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        extra_urls = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_mirror_links")) + c.as_list(c.safe_get(raw, "m_source_url")) if str(x).strip()]
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._process_iocs(c, raw, main_url=url, extra_urls=extra_urls)
        observed_ref, indicator_refs, vuln_refs, attack_refs = self._add_common_objects(c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
                                                                                        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths)
        infra_seed = c.first_nonempty(base_url, url, domain_vals[0] if domain_vals else None)
        infra_ref = None
        if infra_seed:
            infra = {
                "type": "infrastructure", "spec_version": "2.1", "id": c.stix_id("infrastructure", f"infra:{infra_seed}"),
                "created": created, "modified": modified, "name": title, "description": summary if summary else None,
                "infrastructure_types": ["unknown"], "first_seen": created, "last_seen": modified, "labels": labels,
                "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None
            }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = c.add_obj(infra, ("infrastructure", f"infra:{infra_seed}"))
        attack_vector = c.first_nonempty(c.as_list(c.safe_get(raw, "m_ioc_type"))[0] if c.as_list(c.safe_get(raw, "m_ioc_type")) else None,
                                         c.as_list(c.safe_get(raw, "m_web_server"))[0] if c.as_list(c.safe_get(raw, "m_web_server")) else None, "Unknown")
        external_refs = self._build_external_refs(c, raw, main_url=url, base_url=base_url)
        object_refs: List[str] = []
        if infra_ref: object_refs.append(infra_ref)
        if observed_ref: object_refs.append(observed_ref)
        object_refs.extend(location_refs + indicator_refs + vuln_refs + attack_refs)
        custom = {
            "x_orion_network": str(network) if network else None,
            "x_orion_attack_vector": str(attack_vector),
            "x_orion_mirror_links_count": str(len([x for x in c.as_list(c.safe_get(raw, "m_mirror_links")) if str(x).strip()])) or None
        }
        return self._finalize_bundle(c, created, modified, title, summary, labels, lang, external_refs, object_refs, doc_id, "defacement", tlp_amber_id, **custom)

    def _convert_exploit(self, raw: ExploitResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.parse_ts(c.safe_get(raw, "m_leak_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created: modified = created
        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_weblink"), "Exploit - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.as_list(c.safe_get(raw, "m_weblink"))[0] if c.as_list(c.safe_get(raw, "m_weblink")) else None)
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        summary_src = c.first_nonempty(c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_content"), "")
        summary = c.clean_text(str(summary_src or ""))
        if len(summary) > 4000: summary = summary[:4000] + "…"
        code_snips = [str(x) for x in c.as_list(c.safe_get(raw, "m_code_snippet")) if str(x).strip()]
        if code_snips and len(summary) < 600:
            extra = c.clean_text(code_snips[0])
            if extra:
                summary = (summary + "\n\n" + extra) if summary else extra
                if len(summary) > 4000: summary = summary[:4000] + "…"
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._get_content_types(c, raw)
        labels_set: set[str] = set(content_types)
        if network:
            labels_set.add(str(network).strip().lower())
        if platform:
            labels_set.add(f"platform:{str(platform).strip().lower()}")
        labels_set.add("orion:exploit")
        labels = list(labels_set)
        langs = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"), c.safe_get(raw, "m_name"))
        actor_ref = None
        if team and str(team).strip():
            tname = str(team).strip()
            actor = {
                "type": "intrusion-set", "spec_version": "2.1", "id": c.stix_id("intrusion-set", f"team:{tname}"),
                "created": created, "modified": modified, "name": tname, "description": summary if summary else None,
                "object_marking_refs": [tlp_amber_id]
            }
            actor = {k: v for k, v in actor.items() if v is not None}
            actor_ref = c.add_obj(actor, ("intrusion-set", f"team:{tname}"))
        extra_urls = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_weblink")) if str(x).strip()]
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._process_iocs(c, raw, main_url=url, extra_urls=extra_urls)
        observed_ref, indicator_refs, vuln_refs, attack_refs = self._add_common_objects(c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
                                                                                        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths)
        note_ref = self._add_sensitive_note(c, created, modified, tlp_amber_id, tlp_red_id, doc_id, raw, base_abstract="Sensitive artifacts")
        infra_seed = c.first_nonempty(base_url, url, domain_vals[0] if domain_vals else None)
        infra_ref = None
        if infra_seed:
            infra_types = ["command-and-control"] if "c2" in content_types else (["anonymization"] if str(network or "").lower() == "onion" else ["unknown"])
            infra = {
                "type": "infrastructure", "spec_version": "2.1", "id": c.stix_id("infrastructure", f"infra:{infra_seed}"),
                "created": created, "modified": modified, "name": str(c.first_nonempty(title, c.safe_get(raw, "m_name"), "Exploit infrastructure")),
                "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified,
                "labels": labels, "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None
            }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = c.add_obj(infra, ("infrastructure", f"infra:{infra_seed}"))
        external_refs = self._build_external_refs(c, raw, main_url=url, base_url=base_url)
        object_refs: List[str] = []
        if actor_ref: object_refs.append(actor_ref)
        if infra_ref: object_refs.append(infra_ref)
        if observed_ref: object_refs.append(observed_ref)
        if note_ref: object_refs.append(note_ref)
        object_refs.extend(location_refs + indicator_refs + vuln_refs + attack_refs)
        custom = {"x_orion_network": str(network) if network else None, "x_orion_platform": str(platform) if platform else None}
        return self._finalize_bundle(c, created, modified, title, summary, labels, lang, external_refs, object_refs, doc_id, "exploit", tlp_amber_id, **custom)

    def _convert_leak(self, raw: LeakResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created: modified = created
        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"), "Leak - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"))
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        summary_src = c.first_nonempty(c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_content"), "")
        summary = c.clean_text(str(summary_src or ""))
        if len(summary) > 4000: summary = summary[:4000] + "…"
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._get_content_types(c, raw)
        labels_set: set[str] = set(content_types)
        if network:
            labels_set.add(str(network).strip().lower())
        if platform:
            labels_set.add(f"platform:{str(platform).strip().lower()}")
        labels_set.add("orion:leak")
        labels = list(labels_set)
        langs = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        victim_refs: List[str] = []
        for org in c.as_list(c.safe_get(raw, "m_org")) + c.as_list(c.safe_get(raw, "m_company_name")):
            name = str(org).strip()
            if name:
                ident = {
                    "type": "identity", "spec_version": "2.1", "id": c.stix_id("identity", f"victim:{name}"),
                    "created": created, "modified": modified, "name": name, "identity_class": "organization",
                    "object_marking_refs": [tlp_amber_id]
                }
                ident = {k: v for k, v in ident.items() if v is not None}
                victim_refs.append(c.add_obj(ident, ("identity", f"victim:{name}")))
        for vref in victim_refs:
            for lref in location_refs:
                rel = {
                    "type": "relationship", "spec_version": "2.1", "id": c.stix_id("relationship", f"{vref}|located-at|{lref}"),
                    "created": created, "modified": modified, "relationship_type": "located-at",
                    "source_ref": vref, "target_ref": lref, "object_marking_refs": [tlp_amber_id]
                }
                c.add_obj(rel, ("relationship", f"{vref}|located-at|{lref}"))
        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"))
        actor_ref = None
        if team and str(team).strip():
            tname = str(team).strip()
            actor = {
                "type": "intrusion-set", "spec_version": "2.1", "id": c.stix_id("intrusion-set", f"team:{tname}"),
                "created": created, "modified": modified, "name": tname, "description": summary if summary else None,
                "object_marking_refs": [tlp_amber_id]
            }
            actor = {k: v for k, v in actor.items() if v is not None}
            actor_ref = c.add_obj(actor, ("intrusion-set", f"team:{tname}"))
        extra_urls = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_dumplink")) + c.as_list(c.safe_get(raw, "m_websites")) if str(x).strip()]
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._process_iocs(c, raw, main_url=url, extra_urls=extra_urls)
        observed_ref, indicator_refs, vuln_refs, attack_refs = self._add_common_objects(c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
                                                                                        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths)
        note_ref = self._add_sensitive_note(c, created, modified, tlp_amber_id, tlp_red_id, doc_id, raw, base_abstract="Sensitive artifacts")
        infra_seed = c.first_nonempty(base_url, url, domain_vals[0] if domain_vals else None)
        infra_ref = None
        if infra_seed:
            infra_types = ["command-and-control"] if "ransomware" in content_types else (["anonymization"] if str(network or "").lower() == "onion" else ["unknown"])
            infra = {
                "type": "infrastructure", "spec_version": "2.1", "id": c.stix_id("infrastructure", f"infra:{infra_seed}"),
                "created": created, "modified": modified, "name": str(c.first_nonempty(c.safe_get(raw, "m_team"), title, "Leak infrastructure")),
                "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified,
                "labels": labels, "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None
            }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = c.add_obj(infra, ("infrastructure", f"infra:{infra_seed}"))
        if actor_ref and infra_ref:
            rel = {
                "type": "relationship", "spec_version": "2.1", "id": c.stix_id("relationship", f"{actor_ref}|uses|{infra_ref}"),
                "created": created, "modified": modified, "relationship_type": "uses",
                "source_ref": actor_ref, "target_ref": infra_ref, "object_marking_refs": [tlp_amber_id]
            }
            c.add_obj(rel, ("relationship", f"{actor_ref}|uses|{infra_ref}"))
        extra_ext = []
        if c.safe_get(raw, "m_screenshot"):
            extra_ext.append({"source_name": "screenshot", "external_id": str(c.safe_get(raw, "m_screenshot"))})
        external_refs = self._build_external_refs(c, raw, main_url=url, base_url=base_url, extra=extra_ext)
        object_refs: List[str] = []
        if actor_ref: object_refs.append(actor_ref)
        if infra_ref: object_refs.append(infra_ref)
        if observed_ref: object_refs.append(observed_ref)
        if note_ref: object_refs.append(note_ref)
        object_refs.extend(victim_refs + location_refs + indicator_refs + vuln_refs + attack_refs)
        custom = {
            "x_orion_network": str(network) if network else None,
            "x_orion_platform": str(platform) if platform else None,
            "x_orion_dumplink_count": str(len(c.as_list(c.safe_get(raw, "m_dumplink")))) or None
        }
        return self._finalize_bundle(c, created, modified, title, summary, labels, lang, external_refs, object_refs, doc_id, "leak", tlp_amber_id, **custom)

    def _convert_social(self, raw: SocialResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.parse_ts(c.safe_get(raw, "m_message_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created: modified = created
        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_channel_url"), "Social - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_message_sharable_link"), c.safe_get(raw, "m_channel_url"), c.safe_get(raw, "m_url"))
        base_url = c.safe_get(raw, "m_channel_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        summary_src = c.first_nonempty(c.safe_get(raw, "m_content"), c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_meta_description"), "")
        summary = c.clean_text(str(summary_src or ""))
        if len(summary) > 4000: summary = summary[:4000] + "…"
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._get_content_types(c, raw)
        labels_set: set[str] = set(content_types)
        if network:
            labels_set.add(str(network).strip().lower())
        if platform:
            labels_set.add(f"platform:{str(platform).strip().lower()}")
        labels_set.add("orion:social")
        labels = list(labels_set)
        langs = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        author = c.first_nonempty(c.safe_get(raw, "m_author"), c.safe_get(raw, "m_username"))
        created_by_ref = None
        if author:
            author_name = str(author[0]).strip() if isinstance(author, list) and author else str(author).strip()
            if author_name:
                ident = {
                    "type": "identity", "spec_version": "2.1", "id": c.stix_id("identity", f"author:{author_name}"),
                    "created": created, "modified": modified, "name": author_name, "identity_class": "individual",
                    "object_marking_refs": [tlp_amber_id]
                }
                created_by_ref = c.add_obj(ident, ("identity", f"author:{author_name}"))
        extra_urls = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_social_media_profiles")) if str(x).strip()]
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._process_iocs(c, raw, main_url=url, extra_urls=extra_urls)
        extra_scos: List[dict] = []
        for x in c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_xmpp_addresses")) if str(x).strip()]):
            extra_scos.append({"type": "x-mpp-addr", "id": c.sco_id("x-mpp-addr", x), "value": x})
        for w in c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_crypto_address")) if str(x).strip()]):
            extra_scos.append({"type": "cryptocurrency-wallet", "id": c.sco_id("cryptocurrency-wallet", w), "address": w})
        for ua in c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_user_agents")) if str(x).strip()]):
            extra_scos.append({"type": "user-agent", "id": c.sco_id("user-agent", ua), "string": ua})
        observed_ref, indicator_refs, vuln_refs, attack_refs = self._add_common_objects(c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
                                                                                        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths, extra_scos=extra_scos)
        hashtags = c.dedupe_keep([str(x).strip().lstrip("#") for x in c.as_list(c.safe_get(raw, "m_hashtag")) if str(x).strip()])
        mentions = c.dedupe_keep([str(x).strip().lstrip("@") for x in c.as_list(c.safe_get(raw, "m_mention")) if str(x).strip()])
        extra_content = {}
        if hashtags:
            extra_content["hashtags"] = hashtags
        if mentions:
            extra_content["mentions"] = mentions
        note_ref = self._add_sensitive_note(c, created, modified, tlp_amber_id, tlp_red_id, doc_id, raw, extra_content=extra_content or None, base_abstract="Social metadata")
        infra_seed = c.first_nonempty(base_url, url, domain_vals[0] if domain_vals else None)
        infra_ref = None
        if infra_seed:
            infra_types = ["anonymization"] if str(network or "").lower() == "onion" else ["unknown"]
            infra = {
                "type": "infrastructure", "spec_version": "2.1", "id": c.stix_id("infrastructure", f"infra:{infra_seed}"),
                "created": created, "modified": modified, "name": str(c.first_nonempty(platform, title, "Social infrastructure")),
                "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified,
                "labels": labels, "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None,
                "x_orion_platform": str(platform) if platform else None
            }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = c.add_obj(infra, ("infrastructure", f"infra:{infra_seed}"))
        extra_ext = []
        if c.safe_get(raw, "m_message_sharable_link"):
            extra_ext.append({"source_name": "share_link", "url": str(c.safe_get(raw, "m_message_sharable_link"))})
        external_refs = self._build_external_refs(c, raw, main_url=url, base_url=base_url, extra=extra_ext)
        object_refs: List[str] = []
        if infra_ref: object_refs.append(infra_ref)
        if observed_ref: object_refs.append(observed_ref)
        if note_ref: object_refs.append(note_ref)
        if created_by_ref: object_refs.append(created_by_ref)
        object_refs.extend(location_refs + indicator_refs + vuln_refs + attack_refs)
        custom = {
            "x_orion_network": str(network) if network else None,
            "x_orion_platform": str(platform) if platform else None,
            "x_orion_post_comments_count": str(c.safe_get(raw, "m_post_comments_count")) if c.safe_get(raw, "m_post_comments_count") is not None else None
        }
        return self._finalize_bundle(c, created, modified, title, summary, labels, lang, external_refs, object_refs, doc_id, "social", tlp_amber_id, created_by_ref=created_by_ref, **custom)

    def _convert_general(self, raw: GeneralResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created: modified = created
        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"), "General - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"))
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        summary_src = c.first_nonempty(c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_meta_description"), c.safe_get(raw, "m_content"), "")
        summary = c.clean_text(str(summary_src or ""))
        if len(summary) > 4000: summary = summary[:4000] + "…"
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._get_content_types(c, raw)
        labels_set: set[str] = set(content_types)
        if network:
            labels_set.add(str(network).strip().lower())
        for p in c.as_list(c.safe_get(raw, "m_platform")):
            sp = str(p).strip().lower()
            if sp:
                labels_set.add(f"platform:{sp}")
        for h in c.as_list(c.safe_get(raw, "m_hashtag")):
            sh = str(h).strip().lstrip("#").lower()
            if sh:
                labels_set.add(f"tag:{sh}")
        labels_set.add("orion:general")
        labels = list(labels_set)
        langs = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        victim_refs: List[str] = []
        for org in c.as_list(c.safe_get(raw, "m_org")) + c.as_list(c.safe_get(raw, "m_company_name")):
            name = str(org).strip()
            if name:
                ident = {
                    "type": "identity", "spec_version": "2.1", "id": c.stix_id("identity", f"victim:{name}"),
                    "created": created, "modified": modified, "name": name, "identity_class": "organization",
                    "object_marking_refs": [tlp_amber_id]
                }
                ident = {k: v for k, v in ident.items() if v is not None}
                victim_refs.append(c.add_obj(ident, ("identity", f"victim:{name}")))
        for vref in victim_refs:
            for lref in location_refs:
                rel = {
                    "type": "relationship", "spec_version": "2.1", "id": c.stix_id("relationship", f"{vref}|located-at|{lref}"),
                    "created": created, "modified": modified, "relationship_type": "located-at",
                    "source_ref": vref, "target_ref": lref, "object_marking_refs": [tlp_amber_id]
                }
                c.add_obj(rel, ("relationship", f"{vref}|located-at|{lref}"))
        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"))
        actor_ref = None
        if team and str(team).strip():
            tname = str(team).strip()
            actor = {
                "type": "intrusion-set", "spec_version": "2.1", "id": c.stix_id("intrusion-set", f"team:{tname}"),
                "created": created, "modified": modified, "name": tname, "description": summary if summary else None,
                "object_marking_refs": [tlp_amber_id]
            }
            actor = {k: v for k, v in actor.items() if v is not None}
            actor_ref = c.add_obj(actor, ("intrusion-set", f"team:{tname}"))
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._process_iocs(c, raw, main_url=url)
        observed_ref, indicator_refs, vuln_refs, attack_refs = self._add_common_objects(c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
                                                                                        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths)
        note_ref = self._add_sensitive_note(c, created, modified, tlp_amber_id, tlp_red_id, doc_id, raw, base_abstract="Sensitive artifacts")
        infra_seed = c.first_nonempty(url, base_url, domain_vals[0] if domain_vals else None)
        infra_ref = None
        if infra_seed:
            infra_types = ["anonymization"] if str(network or "").lower() == "onion" else (["hosting-malware"] if "darkweb" in content_types else ["unknown"])
            infra = {
                "type": "infrastructure", "spec_version": "2.1", "id": c.stix_id("infrastructure", f"infra:{infra_seed}"),
                "created": created, "modified": modified, "name": str(c.first_nonempty(c.safe_get(raw, "m_team"), title, "Observed infrastructure")),
                "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified,
                "labels": labels, "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None
            }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = c.add_obj(infra, ("infrastructure", f"infra:{infra_seed}"))
        if actor_ref and infra_ref:
            rel = {
                "type": "relationship", "spec_version": "2.1", "id": c.stix_id("relationship", f"{actor_ref}|uses|{infra_ref}"),
                "created": created, "modified": modified, "relationship_type": "uses",
                "source_ref": actor_ref, "target_ref": infra_ref, "object_marking_refs": [tlp_amber_id]
            }
            c.add_obj(rel, ("relationship", f"{actor_ref}|uses|{infra_ref}"))
        extra_ext = []
        if c.safe_get(raw, "m_screenshot"):
            extra_ext.append({"source_name": "screenshot", "external_id": str(c.safe_get(raw, "m_screenshot"))})
        external_refs = self._build_external_refs(c, raw, main_url=url, base_url=base_url, extra=extra_ext)
        object_refs: List[str] = []
        if actor_ref: object_refs.append(actor_ref)
        if infra_ref: object_refs.append(infra_ref)
        if observed_ref: object_refs.append(observed_ref)
        if note_ref: object_refs.append(note_ref)
        object_refs.extend(victim_refs + location_refs + indicator_refs + vuln_refs + attack_refs)
        custom = {"x_orion_network": str(network) if network else None}
        return self._finalize_bundle(c, created, modified, title, summary, labels, lang, external_refs, object_refs, doc_id, "general", tlp_amber_id, **custom)

    def _convert_chat(self, raw: ChatResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.parse_ts(c.safe_get(raw, "m_message_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created: modified = created
        caption = str(c.first_nonempty(c.safe_get(raw, "m_caption"), c.safe_get(raw, "m_content"), "Chat - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_message_sharable_link"), c.safe_get(raw, "m_media_url"))
        channel_url = c.safe_get(raw, "m_channel_url")
        channel_id = c.safe_get(raw, "m_channel_id")
        platform = c.safe_get(raw, "m_platform")
        network = c.safe_get(raw, "m_network") or (str(platform).strip().lower() if platform else None)
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), c.safe_get(raw, "m_message_id"), url, channel_id, caption)
        summary_src = c.first_nonempty(c.safe_get(raw, "m_content"), c.safe_get(raw, "m_media_caption"), "")
        summary = c.clean_text(str(summary_src or ""))
        if len(summary) > 4000: summary = summary[:4000] + "…"
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._get_content_types(c, raw)
        labels_set: set[str] = set(content_types)
        if platform:
            labels_set.add(f"platform:{str(platform).strip().lower()}")
        if network:
            labels_set.add(str(network).strip().lower())
        labels_set.add("orion:chat")
        labels = list(labels_set)
        langs = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None
        sender = c.first_nonempty(c.safe_get(raw, "m_sender_username"), c.safe_get(raw, "m_users"), c.safe_get(raw, "m_author"))
        created_by_ref = None
        if sender:
            sender_name = str(sender[0]).strip() if isinstance(sender, list) and sender else str(sender).strip()
            if sender_name:
                ident = {
                    "type": "identity", "spec_version": "2.1", "id": c.stix_id("identity", f"sender:{sender_name}"),
                    "created": created, "modified": modified, "name": sender_name, "identity_class": "individual",
                    "object_marking_refs": [tlp_amber_id]
                }
                created_by_ref = c.add_obj(ident, ("identity", f"sender:{sender_name}"))
        channel_name = c.first_nonempty(c.safe_get(raw, "m_channel_name"), channel_id, channel_url, "Chat channel")
        infra_seed = c.first_nonempty(channel_url, channel_id)
        infra_ref = None
        if infra_seed:
            infra_types = ["communications"] if str(platform or "").lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)) else ["unknown"]
            infra = {
                "type": "infrastructure", "spec_version": "2.1", "id": c.stix_id("infrastructure", f"channel:{infra_seed}"),
                "created": created, "modified": modified, "name": str(channel_name), "description": summary if summary else None,
                "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified, "labels": labels,
                "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None,
                "x_orion_channel_id": str(channel_id) if channel_id else None
            }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = c.add_obj(infra, ("infrastructure", f"channel:{infra_seed}"))
        extra_urls = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_weblink")) if str(x).strip()]
        if channel_url:
            extra_urls.append(str(channel_url))
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._process_iocs(c, raw, main_url=url, extra_urls=extra_urls)
        extra_scos: List[dict] = []
        for ua in c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_user_agents")) if str(x).strip()]):
            extra_scos.append({"type": "user-agent", "id": c.sco_id("user-agent", ua), "string": ua})
        cves_raw = [str(x).strip().upper() for x in c.as_list(c.safe_get(raw, "m_cve")) if str(x).strip()]
        custom_cves = [x for x in cves_raw if x.startswith("CVE-")]
        observed_ref, indicator_refs, vuln_refs, attack_refs = self._add_common_objects(c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
                                                                                        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths,
                                                                                        extra_scos=extra_scos, custom_cves=custom_cves or None)
        hashtags = c.dedupe_keep([str(x).strip().lstrip("#") for x in c.as_list(c.safe_get(raw, "m_hashtag")) if str(x).strip()])
        mentions = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_mention")) if str(x).strip()])
        extra_content = {}
        if hashtags:
            extra_content["hashtags"] = hashtags
        if mentions:
            extra_content["mentions"] = mentions
        note_ref = self._add_sensitive_note(c, created, modified, tlp_amber_id, tlp_red_id, doc_id, raw, extra_content=extra_content or None, base_abstract="Chat metadata")
        extra_ext = []
        if c.safe_get(raw, "m_message_id"):
            extra_ext.append({"source_name": "message_id", "external_id": str(c.safe_get(raw, "m_message_id"))})
        external_refs = self._build_external_refs(c, raw, main_url=url, base_url=channel_url, extra=extra_ext)
        object_refs: List[str] = []
        if infra_ref: object_refs.append(infra_ref)
        if observed_ref: object_refs.append(observed_ref)
        if note_ref: object_refs.append(note_ref)
        if created_by_ref: object_refs.append(created_by_ref)
        object_refs.extend(indicator_refs + vuln_refs + attack_refs)
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
        return self._finalize_bundle(c, created, modified, caption, summary, labels, lang, external_refs, object_refs, doc_id, "chat", tlp_amber_id, created_by_ref=created_by_ref, **custom)