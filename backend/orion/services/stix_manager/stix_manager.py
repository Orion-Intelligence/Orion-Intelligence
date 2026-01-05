from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import result_item as ChatResultItem
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import result_item as DefacementResultItem
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import result_item as ExploitResultItem
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import result_item as GeneralResultItem
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import result_item as LeakResultItem
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import result_item as SocialResultItem
from orion.api.interactive.search_manager.search_model import search_model
from orion.services.stix_manager.stix_helper import stix_helper


class StixManager:
    __instance: StixManager | None = None

    def __init__(self) -> None:
        if StixManager.__instance is not None:
            raise Exception("This class is a singleton!")
        self._search_model = search_model.getInstance()
        StixManager.__instance = self

    @staticmethod
    def get_instance() -> StixManager:
        if StixManager.__instance is None:
            StixManager()
        return StixManager.__instance  # type: ignore[return-value]

    async def get_defacement_stix(self, doc_id: str) -> Dict[str, Any]:
        raw = await self._search_model.request_defacement_doc(doc_id)
        if raw is None:
            return {"error": "No defacement document found", "doc_id": doc_id}
        return self._convert_defacement(DefacementResultItem(**raw))

    async def get_exploit_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_exploit_doc(doc_id, lang)
        if raw is None:
            return {"error": "No exploit document found", "doc_id": doc_id}
        return self._convert_exploit(ExploitResultItem(**raw))

    async def get_leak_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_leak_doc(doc_id, lang)
        if raw is None:
            return {"error": "No leak document found", "doc_id": doc_id}
        return self._convert_leak(LeakResultItem(**raw))

    async def get_social_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_social_doc(doc_id, lang)
        if raw is None:
            return {"error": "No social document found", "doc_id": doc_id}
        return self._convert_social(SocialResultItem(**raw))

    async def get_general_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_general_doc(doc_id, lang)
        if raw is None:
            return {"error": "No general document found", "doc_id": doc_id}
        return self._convert_general(GeneralResultItem(**raw))

    async def get_chat_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_chat_doc(doc_id, lang)
        if raw is None:
            return {"error": "No chat document found", "doc_id": doc_id}
        return self._convert_chat(ChatResultItem(**raw))

    def _clip_summary(self, c: stix_helper, text: Any) -> str:
        s = c.clean_text(str(text or ""))
        return (s[:4000] + "…") if len(s) > 4000 else s

    def _lang_single(self, c: stix_helper, raw: Any) -> Optional[str]:
        langs = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_language")) if str(x).strip()]
        return langs[0] if len(langs) == 1 else None

    def _content_types(self, c: stix_helper, raw: Any) -> Set[str]:
        out: Set[str] = set()
        for x in (c.as_list(c.safe_get(raw, "m_content_type")) + c.as_list(c.safe_get(raw, "content_type"))):
            s = str(x).strip().lower()
            if s:
                out.add(s)
        return out

    def _labels(self, c: stix_helper, base: Sequence[str], content_types: Set[str], network: Any, platform: Any) -> List[str]:
        labels_set: Set[str] = set()
        for ct in content_types:
            if ct:
                labels_set.add(ct)
        if network:
            labels_set.add(str(network).strip().lower())
        if platform is not None:
            sp = str(platform).strip().lower()
            if sp:
                labels_set.add(f"platform:{sp}")
        for b in base:
            sb = str(b).strip()
            if sb:
                labels_set.add(sb)
        return list(labels_set)

    def _dedup_strs(self, c: stix_helper, xs: List[str]) -> List[str]:
        return c.dedupe_keep([str(x).strip() for x in xs if str(x).strip()])

    def _collect_str_list(self, c: stix_helper, raw: Any, key: str) -> List[str]:
        return [str(x).strip() for x in c.as_list(c.safe_get(raw, key)) if str(x).strip()]

    def _extend_urls_from_fields(self, c: stix_helper, raw: Any, url_vals: List[str], keys: Sequence[str]) -> List[str]:
        for k in keys:
            for x in c.as_list(c.safe_get(raw, k)):
                s = str(x).strip()
                if s.startswith(("http://", "https://")):
                    url_vals.append(s)
        return url_vals

    def _append_url_and_dedupe_scos(self, c: stix_helper, url_vals: List[str], url: Any, domain_vals: List[str], ip_vals: List[str], email_vals: List[str], asn_vals: List[str], dir_vals: List[str]) -> Tuple[List[str], List[str], List[str], List[str], List[str], List[str]]:
        if url:
            url_vals.append(str(url))
        domain_vals = c.dedupe_keep(domain_vals)
        url_vals = c.dedupe_keep(url_vals)
        ip_vals = c.dedupe_keep(ip_vals)
        email_vals = c.dedupe_keep(email_vals)
        asn_vals = c.dedupe_keep([a for a in asn_vals if a.isdigit()])
        dir_vals = c.dedupe_keep(dir_vals)
        return domain_vals, url_vals, ip_vals, email_vals, asn_vals, dir_vals

    def _collect_sco_lists(self, c: stix_helper, raw: Any, domain_key: str = "m_domain", url_key: str = "m_url", ip_key: str = "m_ip", email_key: str = "m_email", asn_key: str = "m_asns", dir_key: str = "m_file_paths") -> Tuple[List[str], List[str], List[str], List[str], List[str], List[str]]:
        domain_vals = self._collect_str_list(c, raw, domain_key)
        url_vals = self._collect_str_list(c, raw, url_key)
        ip_vals = self._collect_str_list(c, raw, ip_key)
        email_vals = self._collect_str_list(c, raw, email_key)
        asn_vals = [str(x).strip().upper().lstrip("AS") for x in c.as_list(c.safe_get(raw, asn_key)) if str(x).strip()]
        dir_vals = self._collect_str_list(c, raw, dir_key)
        return self._append_url_and_dedupe_scos(c, url_vals, None, domain_vals, ip_vals, email_vals, asn_vals, dir_vals)

    def _sensitive(self, c: stix_helper, raw: Any) -> Dict[str, List[Dict[str, str]]]:
        sensitive: Dict[str, List[Dict[str, str]]] = {}
        c.sensitive_add(sensitive=sensitive, cat="credit_cards", values=c.as_list(c.safe_get(raw, "m_credit_card")))
        c.sensitive_add(sensitive=sensitive, cat="us_passport", values=c.as_list(c.safe_get(raw, "m_us_passport")))
        c.sensitive_add(sensitive=sensitive, cat="au_abn", values=c.as_list(c.safe_get(raw, "m_au_abn")))
        c.sensitive_add(sensitive=sensitive, cat="us_bank_number", values=c.as_list(c.safe_get(raw, "m_us_bank_number")))
        return sensitive

    def _note(self, c: stix_helper, note_id_seed: str, created: str, modified: str, abstract: str, content: Dict[str, Any], marking_refs: List[str]) -> str:
        note = {"type": "note", "spec_version": "2.1", "id": c.stix_id("note", note_id_seed), "created": created, "modified": modified, "abstract": abstract, "content": str(content), "object_marking_refs": marking_refs}
        return c.add_obj(note, ("note", note["id"]))

    def _meta_note(self, c: stix_helper, note_id_seed: str, created: str, modified: str, tlp_amber_id: str, tlp_red_id: str, abstract: str, sensitive: Dict[str, List[Dict[str, str]]], hashtags: List[str], mentions: List[str]) -> Optional[str]:
        if not sensitive and not hashtags and not mentions:
            return None
        content_note: Dict[str, Any] = {}
        if sensitive:
            content_note["sensitive_hashed"] = sensitive
        if hashtags:
            content_note["hashtags"] = hashtags
        if mentions:
            content_note["mentions"] = mentions
        return self._note(c, note_id_seed, created, modified, abstract, content_note, [tlp_red_id] if sensitive else [tlp_amber_id])

    def _sensitive_note_only(self, c: stix_helper, raw: Any, doc_id: str, created: str, modified: str, tlp_red_id: str) -> Optional[str]:
        sensitive = self._sensitive(c, raw)
        if not sensitive:
            return None
        note = {"type": "note", "spec_version": "2.1", "id": c.stix_id("note", f"sensitive|{doc_id}|{created}"), "created": created, "modified": modified, "abstract": "Sensitive artifacts (hashed)", "content": str(sensitive), "object_marking_refs": [tlp_red_id]}
        return c.add_obj(note, ("note", note["id"]))

    def _external_refs_common(self, c: stix_helper, raw: Any, url: Any, base_url: Any, base_url_name: str = "base_url", extra: Optional[List[dict[str, Any]]] = None) -> List[dict[str, Any]]:
        external_refs: List[dict[str, Any]] = []
        if url:
            external_refs.append({"source_name": "source", "url": str(url)})
        if base_url and base_url != url:
            external_refs.append({"source_name": base_url_name, "url": str(base_url)})
        if c.safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(c.safe_get(raw, "m_hash"))})
        if c.safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(c.safe_get(raw, "m_scrap_file"))})
        if extra:
            external_refs.extend(extra)
        return external_refs

    def _infra(self, c: stix_helper, stix_type_seed: str, created: str, modified: str, name: str, description: Optional[str], infra_types: List[str], labels: List[str], tlp_amber_id: str, network: Any, platform: Any = None, extras: Optional[Dict[str, Any]] = None) -> str:
        base: Dict[str, Any] = {"type": "infrastructure", "spec_version": "2.1", "id": c.stix_id("infrastructure", stix_type_seed), "created": created, "modified": modified, "name": name, "description": description, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified, "labels": labels, "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None}
        if platform is not None:
            base["x_orion_platform"] = str(platform) if platform else None
        if extras:
            base.update(extras)
        base = {k: v for k, v in base.items() if v is not None}
        return c.add_obj(base, ("infrastructure", stix_type_seed))

    def _actor_intrusion_set(self, c: stix_helper, team_name: str, created: str, modified: str, summary: str, tlp_amber_id: str) -> str:
        actor = {"type": "intrusion-set", "spec_version": "2.1", "id": c.stix_id("intrusion-set", f"team:{team_name}"), "created": created, "modified": modified, "name": team_name, "description": summary if summary else None, "object_marking_refs": [tlp_amber_id]}
        actor = {k: v for k, v in actor.items() if v is not None}
        return c.add_obj(actor, ("intrusion-set", f"team:{team_name}"))

    def _victim_identities(self, c: stix_helper, names: List[str], created: str, modified: str, sector: Optional[str], tlp_amber_id: str) -> List[str]:
        out: List[str] = []
        for nm in names:
            name = str(nm).strip()
            if not name:
                continue
            ident = {"type": "identity", "spec_version": "2.1", "id": c.stix_id("identity", f"victim:{name}"), "created": created, "modified": modified, "name": name, "identity_class": "organization", "sectors": [sector] if sector else None, "object_marking_refs": [tlp_amber_id]}
            ident = {k: v for k, v in ident.items() if v is not None}
            out.append(c.add_obj(ident, ("identity", f"victim:{name}")))
        return out

    def _link_located_at(self, c: stix_helper, created: str, modified: str, tlp_amber_id: str, victim_refs: List[str], location_refs: List[str]) -> None:
        for vref in victim_refs:
            for lref in location_refs:
                rel = {"type": "relationship", "spec_version": "2.1", "id": c.stix_id("relationship", f"{vref}|located-at|{lref}"), "created": created, "modified": modified, "relationship_type": "located-at", "source_ref": vref, "target_ref": lref, "object_marking_refs": [tlp_amber_id]}
                c.add_obj(rel, ("relationship", f"{vref}|located-at|{lref}"))

    def _link_uses(self, c: stix_helper, created: str, modified: str, tlp_amber_id: str, src: Optional[str], dst: Optional[str]) -> None:
        if not src or not dst:
            return
        rel = {"type": "relationship", "spec_version": "2.1", "id": c.stix_id("relationship", f"{src}|uses|{dst}"), "created": created, "modified": modified, "relationship_type": "uses", "source_ref": src, "target_ref": dst, "object_marking_refs": [tlp_amber_id]}
        c.add_obj(rel, ("relationship", f"{src}|uses|{dst}"))

    def _observed_and_indicators(self, c: stix_helper, raw: Any, doc_id: str, created: str, modified: str, tlp_amber_id: str, labels: List[str], summary: str, domain_vals: List[str], url_vals: List[str], ip_vals: List[str], email_vals: List[str], asn_vals: List[str], dir_vals: List[str], extra_scos: Optional[List[dict[str, Any]]] = None) -> Tuple[Optional[str], List[str]]:
        sco_refs = c.add_scos(tlp_amber_id=tlp_amber_id, url_vals=url_vals, domain_vals=domain_vals, ip_vals=ip_vals, email_vals=email_vals, asn_vals=asn_vals, dir_vals=dir_vals, extra_scos=extra_scos or None)
        observed_ref = c.add_observed(doc_id=str(doc_id), created=created, modified=modified, tlp_amber_id=tlp_amber_id, sco_refs=sco_refs)
        indicator_refs = c.add_indicators(created=created, modified=modified, tlp_amber_id=tlp_amber_id, labels=labels, summary=summary, domain_vals=domain_vals, url_vals=url_vals, ip_vals=ip_vals, email_vals=email_vals, indicator_types_default="malicious-activity")
        indicator_refs.extend(c.add_yara_indicators(created=created, modified=modified, tlp_amber_id=tlp_amber_id, labels=labels, yara_rules=c.as_list(c.safe_get(raw, "m_yara_rule"))))
        return observed_ref, indicator_refs

    def _vulns_and_attack(self, c: stix_helper, raw: Any, created: str, modified: str, tlp_amber_id: str) -> Tuple[List[str], List[str]]:
        vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id, cves=c.as_list(c.safe_get(raw, "m_cve")))
        attack_refs = c.add_attack_patterns(created=created, modified=modified, tlp_amber_id=tlp_amber_id, tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")), techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques")))
        return vuln_refs, attack_refs

    def _chat_vulns_and_attack(self, c: stix_helper, raw: Any, created: str, modified: str, tlp_amber_id: str, cves: List[str]) -> Tuple[List[str], List[str]]:
        vuln_only = [x for x in cves if x.startswith("CVE-")]
        vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id, cves=c.dedupe_keep(vuln_only))
        attack_refs = c.add_attack_patterns(created=created, modified=modified, tlp_amber_id=tlp_amber_id, tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")), techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques")))
        return vuln_refs, attack_refs

    def _build_report_object_refs(self, c: stix_helper, base_refs: Sequence[Optional[str]], *ref_lists: Sequence[str]) -> List[str]:
        out: List[str] = []
        for r in base_refs:
            if r:
                out.append(r)
        for xs in ref_lists:
            out.extend(list(xs))
        return c.dedupe_keep(out)

    def _bundle_with_report(self, c: stix_helper, report: Dict[str, Any]) -> Dict[str, Any]:
        report = {k: v for k, v in report.items() if v is not None}
        c.add_obj(report, ("report", report["id"]))
        return {"type": "bundle", "id": c.stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": c.objects}

    def _convert_defacement(self, raw: DefacementResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_leak_date")) or c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created
        title = c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"), (c.as_list(c.safe_get(raw, "m_mirror_links"))[0] if c.as_list(c.safe_get(raw, "m_mirror_links")) else None), (str(c.safe_get(raw, "m_content")).splitlines()[0] if c.safe_get(raw, "m_content") else None), "Defacement - unknown title")
        title = str(title)
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"), (c.as_list(c.safe_get(raw, "m_source_url"))[0] if c.as_list(c.safe_get(raw, "m_source_url")) else None), (c.as_list(c.safe_get(raw, "m_mirror_links"))[0] if c.as_list(c.safe_get(raw, "m_mirror_links")) else None))
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        content_src = c.first_nonempty(c.safe_get(raw, "m_content"), c.safe_get(raw, "m_important_content"), "")
        summary = self._clip_summary(c, content_src)
        tlp_amber_id, _ = c.add_tlp(created)
        content_types = self._content_types(c, raw)
        if not content_types:
            content_types.add("defacement")
        labels = self._labels(c, ["orion:defacement"], content_types, network, platform)
        lang = self._lang_single(c, raw)
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._collect_sco_lists(c, raw)
        encoded_urls = self._collect_str_list(c, raw, "m_encoded_urls")
        mirror_links = self._collect_str_list(c, raw, "m_mirror_links")
        source_urls = self._collect_str_list(c, raw, "m_source_url")
        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)
        for ml in mirror_links:
            if ml.startswith(("http://", "https://")):
                url_vals.append(ml)
        for su in source_urls:
            if su.startswith(("http://", "https://")):
                url_vals.append(su)
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._append_url_and_dedupe_scos(c, url_vals, url, domain_vals, ip_vals, email_vals, asn_vals, file_paths)
        infra_seed = c.first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_ref = self._infra(c, f"infra:{infra_seed}", created, modified, title, summary if summary else None, ["unknown"], labels, tlp_amber_id, network) if infra_seed else None
        observed_ref, indicator_refs = self._observed_and_indicators(c, raw, str(doc_id), created, modified, tlp_amber_id, labels, summary, domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths)
        vuln_refs, attack_refs = self._vulns_and_attack(c, raw, created, modified, tlp_amber_id)
        external_refs = self._external_refs_common(c, raw, url, base_url)
        attack_vector = c.first_nonempty((c.as_list(c.safe_get(raw, "m_ioc_type"))[0] if c.as_list(c.safe_get(raw, "m_ioc_type")) else None), (c.as_list(c.safe_get(raw, "m_web_server"))[0] if c.as_list(c.safe_get(raw, "m_web_server")) else None), "Unknown")
        report_object_refs = self._build_report_object_refs(c, [infra_ref, observed_ref], location_refs, indicator_refs, vuln_refs, attack_refs)
        report = {"type": "report", "spec_version": "2.1", "id": c.stix_id("report", f"defacement:{doc_id}"), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": ["threat-report"], "published": created, "labels": labels, "lang": lang, "external_references": external_refs or None, "object_refs": report_object_refs, "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(doc_id), "x_orion_network": str(network) if network else None, "x_orion_attack_vector": str(attack_vector), "x_orion_mirror_links_count": str(len(mirror_links)) if mirror_links else None}
        return self._bundle_with_report(c, report)

    def _convert_exploit(self, raw: ExploitResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.parse_ts(c.safe_get(raw, "m_leak_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created
        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_weblink"), "Exploit - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), (c.as_list(c.safe_get(raw, "m_weblink"))[0] if c.as_list(c.safe_get(raw, "m_weblink")) else None))
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        content_src = c.first_nonempty(c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_content"), "")
        summary = self._clip_summary(c, content_src)
        code_snips = [str(x) for x in c.as_list(c.safe_get(raw, "m_code_snippet")) if str(x).strip()]
        if code_snips and len(summary) < 600:
            extra = c.clean_text(code_snips[0])
            if extra:
                summary = (summary + "\n\n" + extra) if summary else extra
                if len(summary) > 4000:
                    summary = summary[:4000] + "…"
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._content_types(c, raw)
        labels = self._labels(c, ["orion:exploit"], content_types, network, platform)
        lang = self._lang_single(c, raw)
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"), c.safe_get(raw, "m_name"))
        actor_ref = self._actor_intrusion_set(c, str(team).strip(), created, modified, summary, tlp_amber_id) if team and str(team).strip() else None
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._collect_sco_lists(c, raw)
        self._extend_urls_from_fields(c, raw, url_vals, ["m_encoded_urls", "m_weblink"])
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._append_url_and_dedupe_scos(c, url_vals, url, domain_vals, ip_vals, email_vals, asn_vals, file_paths)
        infra_seed = c.first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if "c2" in content_types:
                infra_types = ["command-and-control"]
            elif str(network).lower() == "onion":
                infra_types = ["anonymization"]
            infra_ref = self._infra(c, f"infra:{infra_seed}", created, modified, str(c.first_nonempty(title, c.safe_get(raw, "m_name"), "Exploit infrastructure")), summary if summary else None, infra_types, labels, tlp_amber_id, network)
        observed_ref, indicator_refs = self._observed_and_indicators(c, raw, str(doc_id), created, modified, tlp_amber_id, labels, summary, domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths)
        vuln_refs, attack_refs = self._vulns_and_attack(c, raw, created, modified, tlp_amber_id)
        note_ref = self._sensitive_note_only(c, raw, str(doc_id), created, modified, tlp_red_id)
        external_refs = self._external_refs_common(c, raw, url, base_url)
        report_object_refs = self._build_report_object_refs(c, [actor_ref, infra_ref, observed_ref, note_ref], location_refs, indicator_refs, vuln_refs, attack_refs)
        report = {"type": "report", "spec_version": "2.1", "id": c.stix_id("report", f"exploit:{doc_id}"), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": ["threat-report"], "published": created, "labels": labels, "lang": lang, "external_references": external_refs or None, "object_refs": report_object_refs, "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(doc_id), "x_orion_network": str(network) if network else None, "x_orion_platform": str(platform) if platform else None}
        return self._bundle_with_report(c, report)

    def _convert_leak(self, raw: LeakResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created
        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"), "Leak - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"))
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        content_src = c.first_nonempty(c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_content"), "")
        summary = self._clip_summary(c, content_src)
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._content_types(c, raw)
        labels = self._labels(c, ["orion:leak"], content_types, network, platform)
        lang = self._lang_single(c, raw)
        industries = self._collect_str_list(c, raw, "m_industry")
        sector = industries[0] if industries else None
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        victim_names = self._dedup_strs(c, self._collect_str_list(c, raw, "m_org") + self._collect_str_list(c, raw, "m_company_name"))
        victim_refs = self._victim_identities(c, victim_names, created, modified, sector, tlp_amber_id)
        self._link_located_at(c, created, modified, tlp_amber_id, victim_refs, location_refs)
        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"))
        actor_ref = self._actor_intrusion_set(c, str(team).strip(), created, modified, summary, tlp_amber_id) if team and str(team).strip() else None
        infra_seed = c.first_nonempty(base_url, url, (c.as_list(c.safe_get(raw, "m_domain"))[0] if c.as_list(c.safe_get(raw, "m_domain")) else None))
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(network).lower() == "onion":
                infra_types = ["anonymization"]
            if "ransomware" in content_types:
                infra_types = ["command-and-control"]
            infra_ref = self._infra(c, f"infra:{infra_seed}", created, modified, str(c.first_nonempty(c.safe_get(raw, "m_team"), title, "Leak infrastructure")), summary if summary else None, infra_types, labels, tlp_amber_id, network)
        self._link_uses(c, created, modified, tlp_amber_id, actor_ref, infra_ref)
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._collect_sco_lists(c, raw)
        self._extend_urls_from_fields(c, raw, url_vals, ["m_encoded_urls", "m_dumplink", "m_websites"])
        dump_links = self._collect_str_list(c, raw, "m_dumplink")
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._append_url_and_dedupe_scos(c, url_vals, url, domain_vals, ip_vals, email_vals, asn_vals, file_paths)
        observed_ref, indicator_refs = self._observed_and_indicators(c, raw, str(doc_id), created, modified, tlp_amber_id, labels, summary, domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths)
        vuln_refs, attack_refs = self._vulns_and_attack(c, raw, created, modified, tlp_amber_id)
        note_ref = self._sensitive_note_only(c, raw, str(doc_id), created, modified, tlp_red_id)
        extra_external = [{"source_name": "screenshot", "external_id": str(c.safe_get(raw, "m_screenshot"))}] if c.safe_get(raw, "m_screenshot") else []
        external_refs = self._external_refs_common(c, raw, url, base_url, extra=extra_external)
        report_object_refs = self._build_report_object_refs(c, [actor_ref, infra_ref, observed_ref, note_ref], victim_refs, location_refs, indicator_refs, vuln_refs, attack_refs)
        report = {"type": "report", "spec_version": "2.1", "id": c.stix_id("report", f"leak:{doc_id}"), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": ["threat-report"], "published": created, "labels": labels, "lang": lang, "external_references": external_refs or None, "object_refs": report_object_refs, "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(doc_id), "x_orion_network": str(network) if network else None, "x_orion_platform": str(platform) if platform else None, "x_orion_dumplink_count": str(len(dump_links)) if dump_links else None}
        return self._bundle_with_report(c, report)

    def _convert_social(self, raw: SocialResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.parse_ts(c.safe_get(raw, "m_message_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created
        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_channel_url"), "Social - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_message_sharable_link"), c.safe_get(raw, "m_channel_url"), c.safe_get(raw, "m_url"))
        base_url = c.safe_get(raw, "m_channel_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        content_src = c.first_nonempty(c.safe_get(raw, "m_content"), c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_meta_description"), "")
        summary = self._clip_summary(c, content_src)
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._content_types(c, raw)
        labels = self._labels(c, ["orion:social"], content_types, network, platform)
        lang = self._lang_single(c, raw)
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        author = c.first_nonempty(c.safe_get(raw, "m_author"), c.safe_get(raw, "m_username"))
        created_by_ref = None
        if author:
            author_name = str(author[0]).strip() if isinstance(author, list) and author else str(author).strip()
            if author_name:
                ident = {"type": "identity", "spec_version": "2.1", "id": c.stix_id("identity", f"author:{author_name}"), "created": created, "modified": modified, "name": author_name, "identity_class": "individual", "object_marking_refs": [tlp_amber_id]}
                created_by_ref = c.add_obj(ident, ("identity", f"author:{author_name}"))
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, path_vals = self._collect_sco_lists(c, raw)
        social_profiles = self._collect_str_list(c, raw, "m_social_media_profiles")
        encoded_urls = self._collect_str_list(c, raw, "m_encoded_urls")
        xmpp_vals = self._dedup_strs(c, self._collect_str_list(c, raw, "m_xmpp_addresses"))
        crypto_vals = self._dedup_strs(c, self._collect_str_list(c, raw, "m_crypto_address"))
        user_agents = self._dedup_strs(c, self._collect_str_list(c, raw, "m_user_agents"))
        hashtags = self._dedup_strs(c, [str(x).strip().lstrip("#") for x in c.as_list(c.safe_get(raw, "m_hashtag")) if str(x).strip()])
        mentions = self._dedup_strs(c, [str(x).strip().lstrip("@") for x in c.as_list(c.safe_get(raw, "m_mention")) if str(x).strip()])
        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)
        for sp in social_profiles:
            if sp.startswith(("http://", "https://")):
                url_vals.append(sp)
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, path_vals = self._append_url_and_dedupe_scos(c, url_vals, url, domain_vals, ip_vals, email_vals, asn_vals, path_vals)
        infra_seed = c.first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(network).lower() == "onion":
                infra_types = ["anonymization"]
            infra_ref = self._infra(c, f"infra:{infra_seed}", created, modified, str(c.first_nonempty(platform, title, "Social infrastructure")), summary if summary else None, infra_types, labels, tlp_amber_id, network, platform)
        extra_scos: List[dict[str, Any]] = []
        for x in xmpp_vals:
            extra_scos.append({"type": "x-mpp-addr", "id": c.sco_id("x-mpp-addr", x), "value": x})
        for w in crypto_vals:
            extra_scos.append({"type": "cryptocurrency-wallet", "id": c.sco_id("cryptocurrency-wallet", w), "address": w})
        for ua in user_agents:
            extra_scos.append({"type": "user-agent", "id": c.sco_id("user-agent", ua), "string": ua})
        observed_ref, indicator_refs = self._observed_and_indicators(c, raw, str(doc_id), created, modified, tlp_amber_id, labels, summary, domain_vals, url_vals, ip_vals, email_vals, asn_vals, path_vals, extra_scos=extra_scos)
        vuln_refs, attack_refs = self._vulns_and_attack(c, raw, created, modified, tlp_amber_id)
        sensitive = self._sensitive(c, raw)
        note_ref = self._meta_note(c, f"social-meta|{doc_id}|{created}", created, modified, tlp_amber_id, tlp_red_id, "Social metadata (and sensitive hashed)", sensitive, hashtags, mentions)
        extra_external: List[dict[str, Any]] = [{"source_name": "share_link", "url": str(c.safe_get(raw, "m_message_sharable_link"))}] if c.safe_get(raw, "m_message_sharable_link") else []
        external_refs = self._external_refs_common(c, raw, url, base_url, base_url_name="channel_url", extra=extra_external)
        report_object_refs = self._build_report_object_refs(c, [infra_ref, observed_ref, note_ref, created_by_ref], location_refs, indicator_refs, vuln_refs, attack_refs)
        report = {"type": "report", "spec_version": "2.1", "id": c.stix_id("report", f"social:{doc_id}"), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": ["threat-report"], "published": created, "labels": labels, "lang": lang, "created_by_ref": created_by_ref, "external_references": external_refs or None, "object_refs": report_object_refs, "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(doc_id), "x_orion_network": str(network) if network else None, "x_orion_platform": str(platform) if platform else None, "x_orion_post_comments_count": str(c.safe_get(raw, "m_post_comments_count")) if c.safe_get(raw, "m_post_comments_count") else None}
        return self._bundle_with_report(c, report)

    def _convert_general(self, raw: GeneralResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created
        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"), "General - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"))
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)
        summary_src = c.first_nonempty(c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_meta_description"), c.safe_get(raw, "m_content"), "")
        summary = self._clip_summary(c, summary_src)
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._content_types(c, raw)
        labels_set: Set[str] = set()
        for ct in content_types:
            if ct:
                labels_set.add(ct)
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
        lang = self._lang_single(c, raw)
        industries = self._collect_str_list(c, raw, "m_industry")
        sector = industries[0] if industries else None
        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])
        victim_names = self._dedup_strs(c, self._collect_str_list(c, raw, "m_org") + self._collect_str_list(c, raw, "m_company_name"))
        victim_refs = self._victim_identities(c, victim_names, created, modified, sector, tlp_amber_id)
        self._link_located_at(c, created, modified, tlp_amber_id, victim_refs, location_refs)
        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"))
        actor_ref = self._actor_intrusion_set(c, str(team).strip(), created, modified, summary, tlp_amber_id) if team and str(team).strip() else None
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, path_vals = self._collect_sco_lists(c, raw)
        self._extend_urls_from_fields(c, raw, url_vals, ["m_encoded_urls"])
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, path_vals = self._append_url_and_dedupe_scos(c, url_vals, url, domain_vals, ip_vals, email_vals, asn_vals, path_vals)
        infra_seed = c.first_nonempty(url, base_url, (domain_vals[0] if domain_vals else None))
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(network).lower() == "onion":
                infra_types = ["anonymization"]
            elif "darkweb" in content_types:
                infra_types = ["hosting-malware"]
            infra_ref = self._infra(c, f"infra:{infra_seed}", created, modified, str(c.first_nonempty(c.safe_get(raw, "m_team"), title, "Observed infrastructure")), summary if summary else None, infra_types, labels, tlp_amber_id, network)
        self._link_uses(c, created, modified, tlp_amber_id, actor_ref, infra_ref)
        observed_ref, indicator_refs = self._observed_and_indicators(c, raw, str(doc_id), created, modified, tlp_amber_id, labels, summary, domain_vals, url_vals, ip_vals, email_vals, asn_vals, path_vals)
        vuln_refs, attack_refs = self._vulns_and_attack(c, raw, created, modified, tlp_amber_id)
        note_ref = self._sensitive_note_only(c, raw, str(doc_id), created, modified, tlp_red_id)
        extra_external = [{"source_name": "screenshot", "external_id": str(c.safe_get(raw, "m_screenshot"))}] if c.safe_get(raw, "m_screenshot") else []
        external_refs = self._external_refs_common(c, raw, url, base_url, extra=extra_external)
        report_object_refs = self._build_report_object_refs(c, [actor_ref, infra_ref, observed_ref, note_ref], victim_refs, location_refs, indicator_refs, vuln_refs, attack_refs)
        report = {"type": "report", "spec_version": "2.1", "id": c.stix_id("report", str(doc_id)), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": ["threat-report"], "published": created, "labels": labels, "lang": lang, "external_references": external_refs or None, "object_refs": report_object_refs, "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(doc_id), "x_orion_network": str(network) if network else None}
        return self._bundle_with_report(c, report)

    def _convert_chat(self, raw: ChatResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = c.parse_ts(c.safe_get(raw, "m_creation_date")) or c.parse_ts(c.safe_get(raw, "m_update_date")) or c.parse_ts(c.safe_get(raw, "m_message_date")) or c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created
        caption = str(c.first_nonempty(c.safe_get(raw, "m_caption"), c.safe_get(raw, "m_content"), "Chat - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_message_sharable_link"), c.safe_get(raw, "m_media_url"))
        channel_url = c.safe_get(raw, "m_channel_url")
        channel_id = c.safe_get(raw, "m_channel_id")
        platform = c.safe_get(raw, "m_platform")
        network = c.safe_get(raw, "m_network") or (str(platform).strip().lower() if platform else None)
        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), c.safe_get(raw, "m_message_id"), url, channel_id, caption)
        content_src = c.first_nonempty(c.safe_get(raw, "m_content"), c.safe_get(raw, "m_media_caption"), "")
        summary = self._clip_summary(c, content_src)
        tlp_amber_id, tlp_red_id = c.add_tlp(created)
        content_types = self._content_types(c, raw)
        labels_set: Set[str] = set()
        for ct in content_types:
            if ct:
                labels_set.add(ct)
        if platform:
            labels_set.add(f"platform:{str(platform).strip().lower()}")
        if network:
            labels_set.add(str(network).strip().lower())
        labels_set.add("orion:chat")
        labels = list(labels_set)
        lang = self._lang_single(c, raw)
        sender = c.first_nonempty(c.safe_get(raw, "m_sender_username"), c.safe_get(raw, "m_users"), c.safe_get(raw, "m_author"))
        created_by_ref = None
        if sender:
            sender_name = str(sender[0]).strip() if isinstance(sender, list) and sender else str(sender).strip()
            if sender_name:
                ident = {"type": "identity", "spec_version": "2.1", "id": c.stix_id("identity", f"sender:{sender_name}"), "created": created, "modified": modified, "name": sender_name, "identity_class": "individual", "object_marking_refs": [tlp_amber_id]}
                created_by_ref = c.add_obj(ident, ("identity", f"sender:{sender_name}"))
        channel_name = c.first_nonempty(c.safe_get(raw, "m_channel_name"), channel_id, channel_url, "Chat channel")
        infra_seed = c.first_nonempty(channel_url, channel_id)
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(platform).strip().lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)):
                infra_types = ["communications"]
            infra_ref = self._infra(c, f"channel:{infra_seed}", created, modified, str(channel_name), summary if summary else None, infra_types, labels, tlp_amber_id, network, extras={"x_orion_channel_id": str(channel_id) if channel_id else None})
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._collect_sco_lists(c, raw)
        mentions = self._dedup_strs(c, self._collect_str_list(c, raw, "m_mention"))
        hashtags = self._dedup_strs(c, [str(x).strip().lstrip("#") for x in c.as_list(c.safe_get(raw, "m_hashtag")) if str(x).strip()])
        user_agents = self._dedup_strs(c, self._collect_str_list(c, raw, "m_user_agents"))
        cves = [str(x).strip().upper() for x in c.as_list(c.safe_get(raw, "m_cve")) if str(x).strip()]
        self._extend_urls_from_fields(c, raw, url_vals, ["m_encoded_urls", "m_weblink"])
        if channel_url:
            url_vals.append(str(channel_url))
        domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths = self._append_url_and_dedupe_scos(c, url_vals, url, domain_vals, ip_vals, email_vals, asn_vals, file_paths)
        extra_scos: List[dict[str, Any]] = [{"type": "user-agent", "id": c.sco_id("user-agent", ua), "string": ua} for ua in user_agents]
        observed_ref, indicator_refs = self._observed_and_indicators(c, raw, str(doc_id), created, modified, tlp_amber_id, labels, summary, domain_vals, url_vals, ip_vals, email_vals, asn_vals, file_paths, extra_scos=extra_scos)
        vuln_refs, attack_refs = self._chat_vulns_and_attack(c, raw, created, modified, tlp_amber_id, cves)
        sensitive = self._sensitive(c, raw)
        note_ref = self._meta_note(c, f"chat-meta|{doc_id}|{created}", created, modified, tlp_amber_id, tlp_red_id, "Chat metadata (and sensitive hashed)", sensitive, hashtags, mentions)
        external_refs = self._external_refs_common(c, raw, url, channel_url, base_url_name="channel_url", extra=[{"source_name": "message_id", "external_id": str(c.safe_get(raw, "m_message_id"))}] if c.safe_get(raw, "m_message_id") else None)
        report_object_refs = self._build_report_object_refs(c, [infra_ref, observed_ref, note_ref, created_by_ref], vuln_refs, indicator_refs, attack_refs)
        report = {"type": "report", "spec_version": "2.1", "id": c.stix_id("report", f"chat:{doc_id}"), "created": created, "modified": modified, "name": caption, "description": summary if summary else None, "report_types": ["threat-report"], "published": created, "labels": labels, "lang": lang, "created_by_ref": created_by_ref, "external_references": external_refs or None, "object_refs": report_object_refs, "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(doc_id), "x_orion_network": str(network) if network else None, "x_orion_platform": str(platform) if platform else None, "x_orion_channel_id": str(channel_id) if channel_id else None, "x_orion_channel_name": str(c.safe_get(raw, "m_channel_name")) if c.safe_get(raw, "m_channel_name") else None, "x_orion_views": str(c.safe_get(raw, "m_views")) if c.safe_get(raw, "m_views") else None, "x_orion_sender_is_bot": bool(c.safe_get(raw, "m_sender_is_bot")) if c.safe_get(raw, "m_sender_is_bot") is not None else None, "x_orion_is_forwarded": bool(c.safe_get(raw, "m_is_forwarded")) if c.safe_get(raw, "m_is_forwarded") is not None else None, "x_orion_is_reply": bool(c.safe_get(raw, "m_is_reply")) if c.safe_get(raw, "m_is_reply") is not None else None, "x_orion_pinned": bool(c.safe_get(raw, "m_pinned")) if c.safe_get(raw, "m_pinned") is not None else None}
        return self._bundle_with_report(c, report)
