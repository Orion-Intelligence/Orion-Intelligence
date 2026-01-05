from __future__ import annotations
from typing import Any, Dict, Optional, List


class stix_converter_base:
    def get_timestamps(self, c, raw: Any, priority_keys: List[str]) -> tuple[str, str]:
        created = c.now_ts()
        for key in priority_keys:
            ts = c.parse_ts(c.safe_get(raw, key))
            if ts:
                created = ts
                break
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        return (created, modified) if modified >= created else (created, created)

    def get_content_types(self, c, raw: Any) -> set[str]:
        all_types = c.as_list(c.safe_get(raw, "m_content_type")) + c.as_list(c.safe_get(raw, "content_type"))
        return {str(x).strip().lower() for x in all_types if str(x).strip()}

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
        labels = set(content_types)

        if network := c.safe_get(raw, "m_network"):
            labels.add(str(network).strip().lower())

        if platform := c.safe_get(raw, "m_platform"):
            labels.add(f"platform:{str(platform).strip().lower()}")

        labels.add(specific_tag)
        return list(labels)

    def process_summary(self, c, raw: Any, summary_keys: List[str], add_code_snippet: bool = False) -> str:
        summary_src = c.first_nonempty(*(c.safe_get(raw, k) for k in summary_keys), "")
        summary = c.clean_text(str(summary_src))

        if add_code_snippet and len(summary) < 600:
            code_snips = [str(x) for x in c.as_list(c.safe_get(raw, "m_code_snippet")) if str(x).strip()]
            if code_snips:
                extra = c.clean_text(code_snips[0])
                if extra:
                    summary = f"{summary}\n\n{extra}" if summary else extra

        return summary[:4000] + "…" if len(summary) > 4000 else summary

    def _extract_values(self, c, raw: Any, key: str) -> List[str]:
        return [str(x).strip() for x in c.as_list(c.safe_get(raw, key)) if str(x).strip()]

    def _extract_deduped(self, c, raw: Any, key: str) -> List[str]:
        return c.dedupe_keep(self._extract_values(c, raw, key))

    def _extract_asns_deduped(self, c, raw: Any) -> List[str]:
        values = c.as_list(c.safe_get(raw, "m_asns"))
        cleaned = [str(x).strip().upper().lstrip("AS") for x in values if str(x).strip()]
        digits_only = [a for a in cleaned if a.isdigit()]
        return c.dedupe_keep(digits_only)

    def _collect_urls(self, c, raw: Any, main_url: Optional[str], extra_urls: Optional[List[str]]) -> List[str]:
        url_vals = self._extract_deduped(c, raw, "m_url")

        if main_url:
            url_vals.append(str(main_url))

        encoded_urls = self._extract_values(c, raw, "m_encoded_urls")
        url_vals.extend([u for u in encoded_urls if u.startswith(("http://", "https://"))])

        if extra_urls:
            extra_clean = [str(x).strip() for x in extra_urls if str(x).strip()]
            url_vals.extend([u for u in extra_clean if u.startswith(("http://", "https://"))])

        return c.dedupe_keep(url_vals)

    def process_iocs(self, c, raw: Any, main_url: Optional[str] = None, extra_urls: Optional[List[str]] = None) -> tuple[List[str], List[str], List[str], List[str], List[str], List[str]]:
        domain_vals = self._extract_deduped(c, raw, "m_domain")
        url_vals = self._collect_urls(c, raw, main_url, extra_urls)
        ip_vals = self._extract_deduped(c, raw, "m_ip")
        email_vals = self._extract_deduped(c, raw, "m_email")
        asn_vals = self._extract_asns_deduped(c, raw)
        file_paths = self._extract_deduped(c, raw, "m_file_paths")

        return domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths

    def prepare_common_iocs_refs(
            self, c, raw: Any, created: str, modified: str, tlp_amber_id: str,
            labels: List[str], summary: str, doc_id: str, url: Optional[str],
            extra_urls=None, actor_keys=None
            ) -> tuple[Optional[str], str, Optional[str], List[str], List[str], List[str], List[str]]:
        actor_keys = actor_keys or []
        extra_urls = extra_urls or []

        actor_ref = self.add_actor(c, raw, created, modified, tlp_amber_id, summary, actor_keys)
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self.process_iocs(c, raw, url, extra_urls)

        observed_ref, indicator_refs, vuln_refs, attack_refs = self.add_common_objects(
            c, created, modified, tlp_amber_id, labels, summary, doc_id, raw,
            domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths
        )

        note_ref = self.add_sensitive_note(c, created, modified, tlp_amber_id, c.add_tlp(created)[1], doc_id, raw)

        return actor_ref, observed_ref, note_ref, indicator_refs, vuln_refs, attack_refs, domain_vals

    def determine_infra_types(
            self, content_types: set[str], network: Optional[Any],
            special_condition: Optional[str] = None, special_target: Optional[str] = None
            ) -> List[str]:
        if special_condition and special_condition in content_types:
            return [special_target or "unknown"]

        if str(network or "").lower() == "onion":
            return ["anonymization"]

        return ["unknown"]

    def get_infra_name(
            self, c, raw: Any, title: str, default: str, priority_keys=None,
            priority_value: Optional[Any] = None
            ) -> str:
        priority_keys = priority_keys or []
        priority = priority_value if priority_value is not None else c.first_nonempty(*(c.safe_get(raw, k) for k in priority_keys))
        return str(c.first_nonempty(priority, title, default))

    def _create_stix_object(
            self, obj_type: str, c, name: str, created: str, modified: str,
            tlp_amber_id: str, seed: str, **kwargs
            ) -> Optional[str]:
        obj = {
            "type": obj_type,
            "spec_version": "2.1",
            "id": c.stix_id(obj_type, seed),
            "created": created,
            "modified": modified,
            "name": name,
            "object_marking_refs": [tlp_amber_id],
            **kwargs
        }
        obj = {k: v for k, v in obj.items() if v is not None}
        return c.add_obj(obj, (obj_type, seed))

    def _create_relationship(
            self, c, created: str, modified: str, tlp_amber_id: str,
            source_ref: str, target_ref: str, relationship_type: str
            ) -> None:
        seed = f"{source_ref}|{relationship_type}|{target_ref}"
        rel = {
            "type": "relationship",
            "spec_version": "2.1",
            "id": c.stix_id("relationship", seed),
            "created": created,
            "modified": modified,
            "relationship_type": relationship_type,
            "source_ref": source_ref,
            "target_ref": target_ref,
            "object_marking_refs": [tlp_amber_id]
        }
        c.add_obj(rel, ("relationship", seed))

    def add_actor(
            self, c, raw: Any, created: str, modified: str, tlp_amber_id: str,
            summary: Optional[str], keys: List[str]
            ) -> Optional[str]:
        team = c.first_nonempty(*(c.safe_get(raw, k) for k in keys))
        if not team or not str(team).strip():
            return None

        tname = str(team).strip()
        return self._create_stix_object(
            "intrusion-set", c, tname, created, modified, tlp_amber_id, f"team:{tname}",
            description=summary
        )

    def add_created_by(
            self, c, raw: Any, created: str, modified: str, tlp_amber_id: str,
            keys: List[str], id_prefix: str
            ) -> Optional[str]:
        author = c.first_nonempty(*(c.safe_get(raw, k) for k in keys))
        if not author:
            return None

        author_name = str(author[0]).strip() if isinstance(author, list) and author else str(author).strip()
        if not author_name:
            return None

        return self._create_stix_object(
            "identity", c, author_name, created, modified, tlp_amber_id, f"{id_prefix}:{author_name}",
            identity_class="individual"
        )

    def _create_victim_identity(
            self, c, created: str, modified: str, tlp_amber_id: str,
            name: str, sectors: Optional[List[str]]
            ) -> str:
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
        return c.add_obj(ident, ("identity", f"victim:{name}"))

    def add_victims(
            self, c, raw: Any, created: str, modified: str, tlp_amber_id: str,
            location_refs: List[str], sectors: Optional[List[str]] = None
            ) -> List[str]:
        victim_refs = []
        all_orgs = c.as_list(c.safe_get(raw, "m_org")) + c.as_list(c.safe_get(raw, "m_company_name"))

        for org in all_orgs:
            name = str(org).strip()
            if not name:
                continue

            vref = self._create_victim_identity(c, created, modified, tlp_amber_id, name, sectors)
            victim_refs.append(vref)

            for lref in location_refs:
                self._create_relationship(c, created, modified, tlp_amber_id, vref, lref, "located-at")

        return victim_refs

    def add_actor_uses_infra_rel(
            self, c, created: str, modified: str, tlp_amber_id: str,
            actor_ref: Optional[str], infra_ref: Optional[str]
            ) -> None:
        if not (actor_ref and infra_ref):
            return

        self._create_relationship(c, created, modified, tlp_amber_id, actor_ref, infra_ref, "uses")

    def add_infrastructure(
            self, c, created: str, modified: str, tlp_amber_id: str, labels: List[str],
            summary: Optional[str], network: Optional[Any], infra_seed: Optional[str],
            name: str, infra_types: List[str], id_prefix: str = "infra",
            extra_fields: Optional[Dict[str, Any]] = None
            ) -> Optional[str]:
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
            "description": summary,
            "infrastructure_types": infra_types,
            "first_seen": created,
            "last_seen": modified,
            "labels": labels,
            "object_marking_refs": [tlp_amber_id],
            **extra
        }
        infra = {k: v for k, v in infra.items() if v is not None}
        return c.add_obj(infra, ("infrastructure", f"{id_prefix}:{infra_seed}"))

    def _build_extra_external_refs(self, c, raw: Any, include_screenshot: bool) -> List[dict]:
        extra = []
        if include_screenshot and c.safe_get(raw, "m_screenshot"):
            extra.append({"source_name": "screenshot", "external_id": str(c.safe_get(raw, "m_screenshot"))})
        return extra

    def _build_custom_properties(self, c, raw: Any, platform: Optional[Any], dumplink_key: Optional[str]) -> Dict[str, Any]:
        custom = {}
        if network := c.safe_get(raw, "m_network"):
            custom["x_orion_network"] = str(network)
        if platform is not None:
            custom["x_orion_platform"] = str(platform) if platform else None
        if dumplink_key:
            dumplinks = c.as_list(c.safe_get(raw, dumplink_key))
            if dumplinks:
                custom["x_orion_dumplink_count"] = str(len(dumplinks))
        return custom

    def post_infra_processing(
            self, c, raw: Any, created: str, modified: str, tlp_amber_id: str,
            actor_ref: Optional[str], infra_ref: Optional[str], url: Optional[str],
            base_url: Optional[str], observed_ref: str, note_ref: Optional[str],
            location_refs: List[str], indicator_refs: List[str], vuln_refs: List[str],
            attack_refs: List[str], victim_refs=None, include_screenshot: bool = False,
            platform: Optional[Any] = None, dumplink_key: Optional[str] = None
            ) -> tuple[Optional[List[dict]], List[str], Dict[str, Any]]:
        victim_refs = victim_refs or []

        self.add_actor_uses_infra_rel(c, created, modified, tlp_amber_id, actor_ref, infra_ref)

        extra_ext = self._build_extra_external_refs(c, raw, include_screenshot)

        external_refs = self.build_external_refs(c, raw, url, base_url, extra_ext or None)
        object_refs = self.collect_object_refs(
            actor_ref=actor_ref, infra_ref=infra_ref, observed_ref=observed_ref, note_ref=note_ref,
            victim_refs=victim_refs, location_refs=location_refs, indicator_refs=indicator_refs,
            vuln_refs=vuln_refs, attack_refs=attack_refs
        )

        custom = self._build_custom_properties(c, raw, platform, dumplink_key)

        return external_refs, object_refs, custom

    def add_common_objects(
            self, c, created: str, modified: str, tlp_amber_id: str, labels: List[str],
            summary: Optional[str], doc_id: str, raw: Any, domain_vals: List[str],
            url_vals: List[str], ip_vals: List[str], email_vals: List[str],
            asn_vals: List[str], file_paths: List[str], extra_scos: Optional[List[dict]] = None,
            custom_cves: Optional[List[str]] = None
            ) -> tuple[str, List[str], List[str], List[str]]:
        sco_refs = c.add_scos(
            tlp_amber_id=tlp_amber_id, url_vals=url_vals, domain_vals=domain_vals,
            ip_vals=ip_vals, email_vals=email_vals, asn_vals=asn_vals,
            dir_vals=file_paths, extra_scos=extra_scos
        )

        observed_ref = c.add_observed(
            doc_id=str(doc_id), created=created, modified=modified,
            tlp_amber_id=tlp_amber_id, sco_refs=sco_refs
        )

        indicator_refs = c.add_indicators(
            created=created, modified=modified, tlp_amber_id=tlp_amber_id,
            labels=labels, summary=summary, domain_vals=domain_vals,
            url_vals=url_vals, ip_vals=ip_vals, email_vals=email_vals,
            indicator_types_default="malicious-activity"
        )

        indicator_refs.extend(c.add_yara_indicators(
            created=created, modified=modified, tlp_amber_id=tlp_amber_id,
            labels=labels, yara_rules=c.as_list(c.safe_get(raw, "m_yara_rule"))
        ))

        cves = custom_cves if custom_cves is not None else c.as_list(c.safe_get(raw, "m_cve"))
        vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id, cves=cves)

        attack_refs = c.add_attack_patterns(
            created=created, modified=modified, tlp_amber_id=tlp_amber_id,
            tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")),
            techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques"))
        )

        return observed_ref, indicator_refs, vuln_refs, attack_refs

    def build_external_refs(
            self, c, raw: Any, main_url: Optional[str] = None,
            base_url: Optional[str] = None, extra: Optional[List[dict]] = None
            ) -> Optional[List[dict]]:
        refs = []

        if main_url:
            refs.append({"source_name": "source", "url": str(main_url)})
        if base_url and base_url != main_url:
            refs.append({"source_name": "base_url", "url": str(base_url)})
        if hash_val := c.safe_get(raw, "m_hash"):
            refs.append({"source_name": "content-hash", "external_id": str(hash_val)})
        if scrap_val := c.safe_get(raw, "m_scrap_file"):
            refs.append({"source_name": "scraper", "external_id": str(scrap_val)})
        if extra:
            refs.extend(extra)

        return refs or None

    def add_sensitive_note(
            self, c, created: str, modified: str, tlp_amber_id: str, tlp_red_id: str,
            doc_id: str, raw: Any, extra_content: Optional[dict] = None,
            base_abstract: str = "Sensitive artifacts"
            ) -> Optional[str]:
        sensitive = {}
        c.sensitive_add(sensitive=sensitive, cat="credit_cards", values=c.as_list(c.safe_get(raw, "m_credit_card")))
        c.sensitive_add(sensitive=sensitive, cat="us_passport", values=c.as_list(c.safe_get(raw, "m_us_passport")))
        c.sensitive_add(sensitive=sensitive, cat="au_abn", values=c.as_list(c.safe_get(raw, "m_au_abn")))
        c.sensitive_add(sensitive=sensitive, cat="us_bank_number", values=c.as_list(c.safe_get(raw, "m_us_bank_number")))

        has_sensitive = bool(sensitive)
        if not has_sensitive and not extra_content:
            return None

        content = {}
        if has_sensitive:
            content["sensitive_hashed"] = sensitive
        if extra_content:
            content.update(extra_content)

        abstract = f"{base_abstract} (and sensitive hashed)" if has_sensitive else base_abstract
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

    def collect_object_refs(
            self, actor_ref: Optional[str] = None, infra_ref: Optional[str] = None,
            observed_ref: Optional[str] = None, note_ref: Optional[str] = None,
            created_by_ref: Optional[str] = None, victim_refs=None, location_refs=None,
            indicator_refs=None, vuln_refs=None, attack_refs=None
            ) -> List[str]:
        victim_refs = victim_refs or []
        location_refs = location_refs or []
        indicator_refs = indicator_refs or []
        vuln_refs = vuln_refs or []
        attack_refs = attack_refs or []

        object_refs = [r for r in [actor_ref, infra_ref, observed_ref, note_ref, created_by_ref] if r]
        object_refs.extend(victim_refs + location_refs + indicator_refs + vuln_refs + attack_refs)
        return object_refs

    def finalize_bundle(
            self, c, created: str, modified: str, title: str, summary: Optional[str],
            labels: List[str], lang: Optional[str], external_refs: Optional[List[dict]],
            object_refs: List[str], doc_id: str, type_str: str, tlp_amber_id: str,
            created_by_ref: Optional[str] = None, **custom
            ) -> Dict[str, Any]:
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

        return {
            "type": "bundle",
            "id": c.stix_id("bundle", report["id"]),
            "spec_version": "2.1",
            "objects": c.objects
        }