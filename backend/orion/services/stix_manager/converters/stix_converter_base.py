from __future__ import annotations
from typing import Any, Dict, Optional, List

class stix_converter_base:

    def extract_common(self, c, raw, title_values, url_values, base_url_field, default_title, include_platform=False):
        title = str(c.first_nonempty(*title_values, default_title))
        url = c.first_nonempty(*url_values)
        base_url = c.safe_get(raw, base_url_field)
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform") if include_platform else None
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        return title, url, base_url, network, platform, doc_id

    def get_timestamps(self, c, raw: Any, priority_keys: List[str]) -> tuple[str, str]:
        created = c.now_ts()
        for key in priority_keys:
            ts = c.parse_ts(c.safe_get(raw, key))
            if ts:
                created = ts
                break
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created
        return created, modified

    def get_content_types(self, c, raw: Any) -> set[str]:
        content_types: set[str] = set()
        for x in (c.as_list(c.safe_get(raw, "m_content_type")) + c.as_list(c.safe_get(raw, "content_type"))):
            s = str(x).strip().lower()
            if s:
                content_types.add(s)
        return content_types

    def setup_marking_and_types(self, c, created: str, raw: Any, default_type: Optional[str] = None) -> tuple[str, set[str]]:
        tlp_amber_id, _ = c.add_tlp(created)
        content_types = self.get_content_types(c, raw)
        if default_type and not content_types:
            content_types.add(default_type)
        return tlp_amber_id, content_types

    def get_lang(self, c, raw: Any) -> Optional[str]:
        langs = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_language")) if str(x).strip()]
        return langs[0] if len(langs) == 1 else None

    def standard_labels(self, c, raw: Any, content_types: set[str], specific_tag: str) -> List[str]:
        labels_set = set(content_types)
        network = c.safe_get(raw, "m_network")
        if network:
            labels_set.add(str(network).strip().lower())
        platform = c.safe_get(raw, "m_platform")
        if platform:
            labels_set.add(f"platform:{str(platform).strip().lower()}")
        labels_set.add(specific_tag)
        return list(labels_set)

    def process_summary(self, c, raw: Any, summary_keys: List[str], add_code_snippet: bool = False) -> str:
        summary_src = c.first_nonempty(*(c.safe_get(raw, k) for k in summary_keys), "")
        summary = c.clean_text(str(summary_src))
        if add_code_snippet:
            code_snips = [str(x) for x in c.as_list(c.safe_get(raw, "m_code_snippet")) if str(x).strip()]
            if code_snips and len(summary) < 600:
                extra = c.clean_text(code_snips[0])
                if extra:
                    summary = (summary + "\n\n" + extra) if summary else extra
        if len(summary) > 4000:
            summary = summary[:4000] + "…"
        return summary

    def process_iocs(self, c, raw: Any, main_url: Optional[str] = None, extra_urls: Optional[List[str]] = None) -> tuple[List[str], List[str], List[str], List[str], List[str], List[str]]:
        domain_vals = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_domain")) if str(x).strip()])
        url_vals = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_url")) if str(x).strip()])
        if main_url:
            url_vals.append(str(main_url))
        encoded_urls = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_encoded_urls")) if str(x).strip()])
        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)
        if extra_urls:
            for u in [str(x).strip() for x in extra_urls if str(x).strip()]:
                if u.startswith(("http://", "https://")):
                    url_vals.append(u)
        url_vals = c.dedupe_keep(url_vals)
        ip_vals = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_ip")) if str(x).strip()])
        email_vals = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_email")) if str(x).strip()])
        asn_vals = c.dedupe_keep([a for a in [str(x).strip().upper().lstrip("AS") for x in c.as_list(c.safe_get(raw, "m_asns")) if str(x).strip()] if a.isdigit()])
        file_paths = c.dedupe_keep([str(x).strip() for x in c.as_list(c.safe_get(raw, "m_file_paths")) if str(x).strip()])
        return domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths

    def prepare_common_iocs_refs(self, c, raw: Any, created: str, modified: str, tlp_amber_id: str, labels: List[str], summary: str, doc_id: str, url: Optional[str],extra_urls=None, actor_keys=None) -> tuple[Optional[str], str, Optional[str], List[str], List[str], List[str], List[str]]:
        if actor_keys is None:
            actor_keys = []
        if extra_urls is None:
            extra_urls = []
        actor_ref = self.add_actor(c, raw, created, modified, tlp_amber_id, summary, actor_keys)
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self.process_iocs(c, raw, main_url=url, extra_urls=extra_urls)
        observed_ref, indicator_refs, vuln_refs, attack_refs = self.add_common_objects(c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
                                                                                        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths)
        note_ref = self.add_sensitive_note(c, created, modified, tlp_amber_id, c.add_tlp(created)[1], doc_id, raw)
        return actor_ref, observed_ref, note_ref, indicator_refs, vuln_refs, attack_refs, domain_vals

    def determine_infra_types(self, content_types: set[str], network: Optional[Any], special_condition: Optional[str] = None, special_target: Optional[str] = None) -> List[str]:
        types = ["unknown"]
        if special_condition and special_condition in content_types:
            types = [special_target or "unknown"]
        if str(network or "").lower() == "onion":
            types = ["anonymization"]
        return types

    def get_infra_name(self, c, raw: Any, title: str, default: str, priority_keys=None, priority_value: Optional[Any] = None) -> str:
        if priority_keys is None:
            priority_keys = []
        priority = priority_value if priority_value is not None else c.first_nonempty(*(c.safe_get(raw, k) for k in priority_keys))
        return str(c.first_nonempty(priority, title, default))

    def add_actor(self, c, raw: Any, created: str, modified: str, tlp_amber_id: str, summary: Optional[str], keys: List[str]) -> Optional[str]:
        team = c.first_nonempty(*(c.safe_get(raw, k) for k in keys))
        if team and str(team).strip():
            tname = str(team).strip()
            actor = {
                "type": "intrusion-set",
                "spec_version": "2.1",
                "id": c.stix_id("intrusion-set", f"team:{tname}"),
                "created": created,
                "modified": modified,
                "name": tname,
                "description": summary if summary else None,
                "object_marking_refs": [tlp_amber_id]
            }
            actor = {k: v for k, v in actor.items() if v is not None}
            return c.add_obj(actor, ("intrusion-set", f"team:{tname}"))
        return None

    def add_created_by(self, c, raw: Any, created: str, modified: str, tlp_amber_id: str, keys: List[str], id_prefix: str) -> Optional[str]:
        author = c.first_nonempty(*(c.safe_get(raw, k) for k in keys))
        if author:
            author_name = str(author[0]).strip() if isinstance(author, list) and author else str(author).strip()
            if author_name:
                ident = {
                    "type": "identity",
                    "spec_version": "2.1",
                    "id": c.stix_id("identity", f"{id_prefix}:{author_name}"),
                    "created": created,
                    "modified": modified,
                    "name": author_name,
                    "identity_class": "individual",
                    "object_marking_refs": [tlp_amber_id]
                }
                return c.add_obj(ident, ("identity", f"{id_prefix}:{author_name}"))
        return None

    def add_victims(self, c, raw: Any, created: str, modified: str, tlp_amber_id: str, location_refs: List[str], sectors: Optional[List[str]] = None) -> List[str]:
        victim_refs: List[str] = []
        for org in c.as_list(c.safe_get(raw, "m_org")) + c.as_list(c.safe_get(raw, "m_company_name")):
            name = str(org).strip()
            if not name:
                continue
            ident = {
                "type": "identity",
                "spec_version": "2.1",
                "id": c.stix_id("identity", f"victim:{name}"),
                "created": created,
                "modified": modified,
                "name": name,
                "identity_class": "organization",
                "sectors": sectors,
                "object_marking_refs": [tlp_amber_id]
            }
            ident = {k: v for k, v in ident.items() if v is not None}
            vref = c.add_obj(ident, ("identity", f"victim:{name}"))
            victim_refs.append(vref)
            for lref in location_refs:
                rel = {
                    "type": "relationship",
                    "spec_version": "2.1",
                    "id": c.stix_id("relationship", f"{vref}|located-at|{lref}"),
                    "created": created,
                    "modified": modified,
                    "relationship_type": "located-at",
                    "source_ref": vref,
                    "target_ref": lref,
                    "object_marking_refs": [tlp_amber_id]
                }
                c.add_obj(rel, ("relationship", f"{vref}|located-at|{lref}"))
        return victim_refs

    def add_actor_uses_infra_rel(self, c, created: str, modified: str, tlp_amber_id: str, actor_ref: Optional[str], infra_ref: Optional[str]) -> None:
        if actor_ref and infra_ref:
            rel = {
                "type": "relationship",
                "spec_version": "2.1",
                "id": c.stix_id("relationship", f"{actor_ref}|uses|{infra_ref}"),
                "created": created,
                "modified": modified,
                "relationship_type": "uses",
                "source_ref": actor_ref,
                "target_ref": infra_ref,
                "object_marking_refs": [tlp_amber_id]
            }
            c.add_obj(rel, ("relationship", f"{actor_ref}|uses|{infra_ref}"))

    def add_infrastructure(self, c, created: str, modified: str, tlp_amber_id: str, labels: List[str], summary: Optional[str],
                            network: Optional[Any], infra_seed: Optional[str], name: str,
                            infra_types: List[str], id_prefix: str = "infra", extra_fields: Optional[Dict[str, Any]] = None) -> Optional[str]:
        if not infra_seed:
            return None
        extra = {}
        if network:
            extra["x_orion_network"] = str(network)
        if extra_fields:
            extra.update(extra_fields)
        infra = {
            "type": "infrastructure",
            "spec_version": "2.1",
            "id": c.stix_id("infrastructure", f"{id_prefix}:{infra_seed}"),
            "created": created,
            "modified": modified,
            "name": name,
            "description": summary if summary else None,
            "infrastructure_types": infra_types,
            "first_seen": created,
            "last_seen": modified,
            "labels": labels,
            "object_marking_refs": [tlp_amber_id],
            **extra
        }
        infra = {k: v for k, v in infra.items() if v is not None}
        return c.add_obj(infra, ("infrastructure", f"{id_prefix}:{infra_seed}"))

    def post_infra_processing(self, c, raw: Any, created: str, modified: str, tlp_amber_id: str, actor_ref: Optional[str], infra_ref: Optional[str],
                              url: Optional[str], base_url: Optional[str], observed_ref: str, note_ref: Optional[str], location_refs: List[str],
                              indicator_refs: List[str], vuln_refs: List[str], attack_refs: List[str], victim_refs=None,
                              include_screenshot: bool = False, platform: Optional[Any] = None, dumplink_key: Optional[str] = None) -> tuple[Optional[List[dict]], List[str], Dict[str, Any]]:
        if victim_refs is None:
            victim_refs = []
        self.add_actor_uses_infra_rel(c, created, modified, tlp_amber_id, actor_ref, infra_ref)
        extra_ext = []
        if include_screenshot and c.safe_get(raw, "m_screenshot"):
            extra_ext.append({"source_name": "screenshot", "external_id": str(c.safe_get(raw, "m_screenshot"))})
        external_refs = self.build_external_refs(c, raw, main_url=url, base_url=base_url, extra=extra_ext or None)
        object_refs = self.collect_object_refs(actor_ref=actor_ref, infra_ref=infra_ref, observed_ref=observed_ref, note_ref=note_ref,
                                               victim_refs=victim_refs, location_refs=location_refs, indicator_refs=indicator_refs,
                                               vuln_refs=vuln_refs, attack_refs=attack_refs)
        custom: Dict[str, Any] = {"x_orion_network": str(c.safe_get(raw, "m_network")) if c.safe_get(raw, "m_network") else None}
        if platform is not None:
            custom["x_orion_platform"] = str(platform) if platform else None
        if dumplink_key:
            custom["x_orion_dumplink_count"] = str(len(c.as_list(c.safe_get(raw, dumplink_key)))) if c.as_list(c.safe_get(raw, dumplink_key)) else None
        return external_refs, object_refs, custom

    def add_common_objects(self, c, created: str, modified: str, tlp_amber_id: str, labels: List[str], summary: Optional[str], doc_id: str, raw: Any,
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

    def build_external_refs(self, c, raw: Any, main_url: Optional[str] = None, base_url: Optional[str] = None, extra: Optional[List[dict]] = None) -> Optional[List[dict]]:
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

    def add_sensitive_note(self, c, created: str, modified: str, tlp_amber_id: str, tlp_red_id: str, doc_id: str, raw: Any,
                            extra_content: Optional[dict] = None, base_abstract: str = "Sensitive artifacts") -> Optional[str]:
        sensitive: dict[str, List[dict]] = {}
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

    def collect_object_refs(self, actor_ref: Optional[str] = None, infra_ref: Optional[str] = None, observed_ref: Optional[str] = None,
                            note_ref: Optional[str] = None, created_by_ref: Optional[str] = None, victim_refs=None,
                            location_refs=None, indicator_refs=None, vuln_refs=None, attack_refs=None) -> List[str]:
        if victim_refs is None:
            victim_refs = []
        if attack_refs is None:
            attack_refs = []
        if vuln_refs is None:
            vuln_refs = []
        if indicator_refs is None:
            indicator_refs = []
        if location_refs is None:
            location_refs = []
        object_refs: List[str] = [r for r in [actor_ref, infra_ref, observed_ref, note_ref, created_by_ref] if r]
        object_refs.extend(victim_refs)
        object_refs.extend(location_refs)
        object_refs.extend(indicator_refs)
        object_refs.extend(vuln_refs)
        object_refs.extend(attack_refs)
        return object_refs

    def finalize_bundle(self, c, created: str, modified: str, title: str, summary: Optional[str], labels: List[str], lang: Optional[str],
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
