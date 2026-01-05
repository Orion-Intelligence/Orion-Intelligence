from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import result_item as ChatResultItem
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import (
    result_item as DefacementResultItem,
)
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import (
    result_item as ExploitResultItem,
)
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import (
    result_item as GeneralResultItem,
)
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import result_item as LeakResultItem
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import (
    result_item as SocialResultItem,
)
from orion.api.interactive.search_manager.search_model import search_model
from orion.services.stix_manager.stix_helper import stix_helper


class StixManager:
    __instance: "StixManager | None" = None

    def __init__(self) -> None:
        if StixManager.__instance is not None:
            raise Exception("This class is a singleton!")
        self._search_model = search_model.getInstance()
        StixManager.__instance = self

    @staticmethod
    def get_instance() -> "StixManager":
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

    def _timestamps(
        self, c: Any, raw: Any, created_keys: Sequence[str], modified_key: str, fallback_now: bool = True
    ) -> Tuple[str, str]:
        created = None
        for k in created_keys:
            created = c.parse_ts(c.safe_get(raw, k))
            if created:
                break
        if not created and fallback_now:
            created = c.now_ts()
        modified = c.parse_ts(c.safe_get(raw, modified_key)) or created
        if modified < created:
            modified = created
        return created, modified

    def _clean_summary(self, c: Any, raw: Any, keys: Sequence[str], extra: Optional[str] = None) -> str:
        src = None
        for k in keys:
            src = c.safe_get(raw, k)
            if src:
                break
        summary = c.clean_text(str(src or ""))
        if extra:
            extra_clean = c.clean_text(str(extra))
            if extra_clean:
                summary = (summary + "\n\n" + extra_clean) if summary else extra_clean
        if len(summary) > 4000:
            summary = summary[:4000] + "…"
        return summary

    def _content_types(self, c: Any, raw: Any, keys: Sequence[str]) -> set[str]:
        s: set[str] = set()
        for k in keys:
            for x in c.as_list(c.safe_get(raw, k)):
                v = str(x).strip().lower()
                if v:
                    s.add(v)
        return s

    def _lang_single(self, c: Any, raw: Any, key: str) -> Optional[str]:
        langs = [str(x).strip() for x in c.as_list(c.safe_get(raw, key)) if str(x).strip()]
        return langs[0] if len(langs) == 1 else None

    def _labels(
        self,
        c: Any,
        content_types: Iterable[str],
        network: Optional[Any] = None,
        platform: Optional[Any] = None,
        extra_labels: Optional[Iterable[str]] = None,
        platform_prefix: str = "platform:",
        include_network: bool = True,
    ) -> List[str]:
        labels_set: set[str] = set()
        for ct in content_types:
            v = str(ct).strip().lower()
            if v:
                labels_set.add(v)
        if include_network and network:
            labels_set.add(str(network).strip().lower())
        if platform:
            labels_set.add(f"{platform_prefix}{str(platform).strip().lower()}")
        if extra_labels:
            for x in extra_labels:
                v = str(x).strip().lower()
                if v:
                    labels_set.add(v)
        return list(labels_set)

    def _dedupe_str_list(self, c: Any, xs: Iterable[Any]) -> List[str]:
        vals = [str(x).strip() for x in xs if str(x).strip()]
        return c.dedupe_keep(vals)

    def _extract_iocs(
        self,
        c: Any,
        raw: Any,
        domain_key: str = "m_domain",
        url_key: str = "m_url",
        ip_key: str = "m_ip",
        email_key: str = "m_email",
        asn_key: str = "m_asns",
        paths_key: str = "m_file_paths",
        url_extra_keys: Optional[Sequence[str]] = None,
        add_single_url: Optional[Any] = None,
        add_single_channel_url: Optional[Any] = None,
    ) -> Dict[str, List[str]]:
        domain_vals = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, domain_key)))
        url_vals = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, url_key)))
        ip_vals = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, ip_key)))
        email_vals = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, email_key)))

        asn_vals_raw = [str(x).strip().upper().lstrip("AS") for x in c.as_list(c.safe_get(raw, asn_key)) if str(x).strip()]
        asn_vals = c.dedupe_keep([a for a in asn_vals_raw if a.isdigit()])

        path_vals = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, paths_key)))

        for k in url_extra_keys or ():
            for x in self._dedupe_str_list(c, c.as_list(c.safe_get(raw, k))):
                if x.startswith(("http://", "https://")):
                    url_vals.append(x)

        if add_single_url:
            su = str(add_single_url).strip()
            if su:
                url_vals.append(su)
        if add_single_channel_url:
            cu = str(add_single_channel_url).strip()
            if cu:
                url_vals.append(cu)

        url_vals = c.dedupe_keep(url_vals)
        domain_vals = c.dedupe_keep(domain_vals)
        ip_vals = c.dedupe_keep(ip_vals)
        email_vals = c.dedupe_keep(email_vals)
        path_vals = c.dedupe_keep(path_vals)

        return {
            "domain_vals": domain_vals,
            "url_vals": url_vals,
            "ip_vals": ip_vals,
            "email_vals": email_vals,
            "asn_vals": asn_vals,
            "path_vals": path_vals,
        }

    def _external_refs(
        self,
        c: Any,
        raw: Any,
        primary_url: Optional[Any] = None,
        base_url: Optional[Any] = None,
        base_url_source_name: str = "base_url",
        include_hash: bool = True,
        include_scraper: bool = True,
        extras_external_id: Optional[Sequence[Tuple[str, str]]] = None,
        extras_url: Optional[Sequence[Tuple[str, Any]]] = None,
    ) -> List[Dict[str, Any]]:
        refs: List[Dict[str, Any]] = []
        if primary_url:
            refs.append({"source_name": "source", "url": str(primary_url)})
        if base_url and str(base_url) != str(primary_url):
            refs.append({"source_name": base_url_source_name, "url": str(base_url)})
        if include_hash and c.safe_get(raw, "m_hash"):
            refs.append({"source_name": "content-hash", "external_id": str(c.safe_get(raw, "m_hash"))})
        if include_scraper and c.safe_get(raw, "m_scrap_file"):
            refs.append({"source_name": "scraper", "external_id": str(c.safe_get(raw, "m_scrap_file"))})
        for src, key in (extras_external_id or ()):
            v = c.safe_get(raw, key)
            if v:
                refs.append({"source_name": src, "external_id": str(v)})
        for src, urlv in (extras_url or ()):
            if urlv:
                refs.append({"source_name": src, "url": str(urlv)})
        return refs

    def _add_intrusion_set_if_present(
        self, c: Any, created: str, modified: str, tlp_amber_id: str, team_value: Optional[Any], summary: str
    ) -> Optional[str]:
        if not team_value:
            return None
        tname = str(team_value).strip()
        if not tname:
            return None
        actor = {
            "type": "intrusion-set",
            "spec_version": "2.1",
            "id": c.stix_id("intrusion-set", f"team:{tname}"),
            "created": created,
            "modified": modified,
            "name": tname,
            "description": summary if summary else None,
            "object_marking_refs": [tlp_amber_id],
        }
        actor = {k: v for k, v in actor.items() if v is not None}
        return c.add_obj(actor, ("intrusion-set", f"team:{tname}"))

    def _add_identity_if_present(
        self,
        c: Any,
        created: str,
        modified: str,
        tlp_amber_id: str,
        identity_class: str,
        prefix: str,
        name_value: Optional[Any],
    ) -> Optional[str]:
        if not name_value:
            return None
        name = str(name_value[0]).strip() if isinstance(name_value, list) and name_value else str(name_value).strip()
        if not name:
            return None
        ident = {
            "type": "identity",
            "spec_version": "2.1",
            "id": c.stix_id("identity", f"{prefix}:{name}"),
            "created": created,
            "modified": modified,
            "name": name,
            "identity_class": identity_class,
            "object_marking_refs": [tlp_amber_id],
        }
        ident = {k: v for k, v in ident.items() if v is not None}
        return c.add_obj(ident, ("identity", f"{prefix}:{name}"))

    def _add_victims(
        self,
        c: Any,
        raw: Any,
        created: str,
        modified: str,
        tlp_amber_id: str,
        org_keys: Sequence[str],
        sector: Optional[str] = None,
    ) -> List[str]:
        victim_refs: List[str] = []
        org_vals: List[Any] = []
        for k in org_keys:
            org_vals.extend(c.as_list(c.safe_get(raw, k)))
        for org in org_vals:
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
                "sectors": [sector] if sector else None,
                "object_marking_refs": [tlp_amber_id],
            }
            ident = {k: v for k, v in ident.items() if v is not None}
            victim_refs.append(c.add_obj(ident, ("identity", f"victim:{name}")))
        return victim_refs

    def _link_located_at(self, c: Any, created: str, modified: str, tlp_amber_id: str, sources: List[str], targets: List[str]) -> None:
        for sref in sources:
            for tref in targets:
                rel = {
                    "type": "relationship",
                    "spec_version": "2.1",
                    "id": c.stix_id("relationship", f"{sref}|located-at|{tref}"),
                    "created": created,
                    "modified": modified,
                    "relationship_type": "located-at",
                    "source_ref": sref,
                    "target_ref": tref,
                    "object_marking_refs": [tlp_amber_id],
                }
                c.add_obj(rel, ("relationship", f"{sref}|located-at|{tref}"))

    def _add_uses(self, c: Any, created: str, modified: str, tlp_amber_id: str, actor_ref: Optional[str], infra_ref: Optional[str]) -> None:
        if not actor_ref or not infra_ref:
            return
        rel = {
            "type": "relationship",
            "spec_version": "2.1",
            "id": c.stix_id("relationship", f"{actor_ref}|uses|{infra_ref}"),
            "created": created,
            "modified": modified,
            "relationship_type": "uses",
            "source_ref": actor_ref,
            "target_ref": infra_ref,
            "object_marking_refs": [tlp_amber_id],
        }
        c.add_obj(rel, ("relationship", f"{actor_ref}|uses|{infra_ref}"))

    def _add_sensitive_note(
        self,
        c: Any,
        raw: Any,
        doc_id: str,
        created: str,
        modified: str,
        tlp_amber_id: str,
        tlp_red_id: str,
        note_prefix: str,
        include_hashtags: Optional[List[str]] = None,
        include_mentions: Optional[List[str]] = None,
        mark_red_if_sensitive: bool = True,
    ) -> Optional[str]:
        sensitive: Dict[str, List[Dict[str, str]]] = {}
        c.sensitive_add(sensitive=sensitive, cat="credit_cards", values=c.as_list(c.safe_get(raw, "m_credit_card")))
        c.sensitive_add(sensitive=sensitive, cat="us_passport", values=c.as_list(c.safe_get(raw, "m_us_passport")))
        c.sensitive_add(sensitive=sensitive, cat="au_abn", values=c.as_list(c.safe_get(raw, "m_au_abn")))
        c.sensitive_add(sensitive=sensitive, cat="us_bank_number", values=c.as_list(c.safe_get(raw, "m_us_bank_number")))

        hashtags = include_hashtags or []
        mentions = include_mentions or []

        if not sensitive and not hashtags and not mentions:
            return None

        content_note: Dict[str, Any] = {}
        if sensitive:
            content_note["sensitive_hashed"] = sensitive
        if hashtags:
            content_note["hashtags"] = hashtags
        if mentions:
            content_note["mentions"] = mentions

        marking = [tlp_red_id] if (mark_red_if_sensitive and sensitive) else [tlp_amber_id]
        note = {
            "type": "note",
            "spec_version": "2.1",
            "id": c.stix_id("note", f"{note_prefix}|{doc_id}|{created}"),
            "created": created,
            "modified": modified,
            "abstract": "Sensitive artifacts (hashed)" if sensitive and not (hashtags or mentions) else "Metadata (and sensitive hashed)",
            "content": str(content_note if (hashtags or mentions) else sensitive),
            "object_marking_refs": marking,
        }
        return c.add_obj(note, ("note", note["id"]))

    def _add_infrastructure(
        self,
        c: Any,
        created: str,
        modified: str,
        tlp_amber_id: str,
        infra_seed: Optional[Any],
        name: str,
        summary: str,
        labels: List[str],
        network: Optional[Any] = None,
        infra_types: Optional[List[str]] = None,
        key: Optional[str] = None,
        extra_fields: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        if not infra_seed:
            return None
        seed = str(infra_seed)
        infra = {
            "type": "infrastructure",
            "spec_version": "2.1",
            "id": c.stix_id("infrastructure", key or f"infra:{seed}"),
            "created": created,
            "modified": modified,
            "name": name,
            "description": summary if summary else None,
            "infrastructure_types": infra_types or ["unknown"],
            "first_seen": created,
            "last_seen": modified,
            "labels": labels,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_network": str(network) if network else None,
        }
        if extra_fields:
            infra.update(extra_fields)
        infra = {k: v for k, v in infra.items() if v is not None}
        return c.add_obj(infra, ("infrastructure", key or f"infra:{seed}"))

    def _add_common_refs(
        self,
        c: Any,
        raw: Any,
        doc_id: str,
        created: str,
        modified: str,
        tlp_amber_id: str,
        labels: List[str],
        summary: str,
        location_keys: Sequence[str],
        iocs: Dict[str, List[str]],
        indicator_types_default: str = "malicious-activity",
        add_yara: bool = True,
        add_vulns: bool = True,
        add_attack: bool = True,
        extra_scos: Optional[List[Dict[str, Any]]] = None,
        cve_values: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        location_refs = c.add_locations(
            raw=raw,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            keys=list(location_keys),
        )
        sco_refs = c.add_scos(
            tlp_amber_id=tlp_amber_id,
            url_vals=iocs["url_vals"],
            domain_vals=iocs["domain_vals"],
            ip_vals=iocs["ip_vals"],
            email_vals=iocs["email_vals"],
            asn_vals=iocs["asn_vals"],
            dir_vals=iocs["path_vals"],
            extra_scos=extra_scos or None,
        )
        observed_ref = c.add_observed(
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            sco_refs=sco_refs,
        )
        indicator_refs = c.add_indicators(
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            labels=labels,
            summary=summary,
            domain_vals=iocs["domain_vals"],
            url_vals=iocs["url_vals"],
            ip_vals=iocs["ip_vals"],
            email_vals=iocs["email_vals"],
            indicator_types_default=indicator_types_default,
        )
        if add_yara:
            indicator_refs.extend(
                c.add_yara_indicators(
                    created=created,
                    modified=modified,
                    tlp_amber_id=tlp_amber_id,
                    labels=labels,
                    yara_rules=c.as_list(c.safe_get(raw, "m_yara_rule")),
                )
            )
        vuln_refs: List[str] = []
        if add_vulns:
            cves = cve_values if cve_values is not None else c.as_list(c.safe_get(raw, "m_cve"))
            vuln_refs = c.add_vulns(created=created, modified=modified, tlp_amber_id=tlp_amber_id, cves=cves)
        attack_refs: List[str] = []
        if add_attack:
            attack_refs = c.add_attack_patterns(
                created=created,
                modified=modified,
                tlp_amber_id=tlp_amber_id,
                tactics=c.as_list(c.safe_get(raw, "m_enterprise_attack_tactics")),
                techniques=c.as_list(c.safe_get(raw, "m_enterprise_attack_techniques")),
            )
        return {
            "location_refs": location_refs,
            "observed_ref": observed_ref,
            "indicator_refs": indicator_refs,
            "vuln_refs": vuln_refs,
            "attack_refs": attack_refs,
        }

    def _bundle(self, c: Any, report_id: str) -> Dict[str, Any]:
        return {
            "type": "bundle",
            "id": c.stix_id("bundle", report_id),
            "spec_version": "2.1",
            "objects": c.objects,
        }

    def _convert_defacement(self, raw: DefacementResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created = (
            c.parse_ts(c.safe_get(raw, "m_leak_date"))
            or c.parse_ts(c.safe_get(raw, "m_creation_date"))
            or c.parse_ts(c.safe_get(raw, "m_update_date"))
            or c.now_ts()
        )
        modified = c.parse_ts(c.safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title_candidate = c.first_nonempty(
            c.safe_get(raw, "m_title"),
            c.safe_get(raw, "m_url"),
            c.safe_get(raw, "m_base_url"),
            (c.as_list(c.safe_get(raw, "m_mirror_links"))[0] if c.as_list(c.safe_get(raw, "m_mirror_links")) else None),
            (str(c.safe_get(raw, "m_content")).splitlines()[0] if c.safe_get(raw, "m_content") else None),
            "Defacement - unknown title",
        )
        title = str(title_candidate)

        url = c.first_nonempty(
            c.safe_get(raw, "m_url"),
            c.safe_get(raw, "m_base_url"),
            (c.as_list(c.safe_get(raw, "m_source_url"))[0] if c.as_list(c.safe_get(raw, "m_source_url")) else None),
            (c.as_list(c.safe_get(raw, "m_mirror_links"))[0] if c.as_list(c.safe_get(raw, "m_mirror_links")) else None),
        )
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")

        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)

        content_src = c.first_nonempty(c.safe_get(raw, "m_content"), c.safe_get(raw, "m_important_content"), "")
        summary = self._clean_summary(c, raw, keys=(), extra=str(content_src or ""))

        tlp_amber_id, tlp_red_id = c.add_tlp(created)

        content_types = self._content_types(c, raw, keys=("m_content_type", "content_type"))
        if not content_types:
            content_types = {"defacement"}

        labels = self._labels(
            c,
            content_types=content_types,
            network=network,
            platform=platform,
            extra_labels=("orion:defacement",),
            include_network=True,
        )
        lang = self._lang_single(c, raw, "m_language")

        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])

        mirror_links = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, "m_mirror_links")))
        source_urls = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, "m_source_url")))
        encoded_urls = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, "m_encoded_urls")))

        iocs = self._extract_iocs(
            c,
            raw,
            url_extra_keys=("m_encoded_urls", "m_mirror_links", "m_source_url"),
            add_single_url=url,
        )

        infra_seed = c.first_nonempty(base_url, url, (iocs["domain_vals"][0] if iocs["domain_vals"] else None))
        infra_ref = self._add_infrastructure(
            c=c,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            infra_seed=infra_seed,
            name=title,
            summary=summary,
            labels=labels,
            network=network,
            infra_types=["unknown"],
            key=f"infra:{infra_seed}" if infra_seed else None,
        )

        refs = self._add_common_refs(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            labels=labels,
            summary=summary,
            location_keys=("m_country", "m_location"),
            iocs=iocs,
        )

        external_refs = self._external_refs(
            c=c,
            raw=raw,
            primary_url=url,
            base_url=base_url,
            base_url_source_name="base_url",
            include_hash=True,
            include_scraper=True,
        )

        report_object_refs: List[str] = []
        if infra_ref:
            report_object_refs.append(infra_ref)
        if refs["observed_ref"]:
            report_object_refs.append(refs["observed_ref"])
        report_object_refs.extend(location_refs)
        report_object_refs.extend(refs["indicator_refs"])
        report_object_refs.extend(refs["vuln_refs"])
        report_object_refs.extend(refs["attack_refs"])
        report_object_refs = c.dedupe_keep(report_object_refs)

        attack_vector = c.first_nonempty(
            (c.as_list(c.safe_get(raw, "m_ioc_type"))[0] if c.as_list(c.safe_get(raw, "m_ioc_type")) else None),
            (c.as_list(c.safe_get(raw, "m_web_server"))[0] if c.as_list(c.safe_get(raw, "m_web_server")) else None),
            "Unknown",
        )

        report = {
            "type": "report",
            "spec_version": "2.1",
            "id": c.stix_id("report", f"defacement:{doc_id}"),
            "created": created,
            "modified": modified,
            "name": title,
            "description": summary if summary else None,
            "report_types": ["threat-report"],
            "published": created,
            "labels": labels,
            "lang": lang,
            "external_references": external_refs or None,
            "object_refs": report_object_refs,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_doc_id": str(doc_id),
            "x_orion_network": str(network) if network else None,
            "x_orion_attack_vector": str(attack_vector),
            "x_orion_mirror_links_count": str(len(mirror_links)) if mirror_links else None,
        }
        report = {k: v for k, v in report.items() if v is not None}
        c.add_obj(report, ("report", report["id"]))
        return self._bundle(c, report["id"])

    def _convert_exploit(self, raw: ExploitResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._timestamps(
            c=c,
            raw=raw,
            created_keys=("m_creation_date", "m_update_date", "m_leak_date"),
            modified_key="m_update_date",
        )

        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_weblink"), "Exploit - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), (c.as_list(c.safe_get(raw, "m_weblink"))[0] if c.as_list(c.safe_get(raw, "m_weblink")) else None))
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")

        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)

        content_src = c.first_nonempty(c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_content"), "")
        summary = self._clean_summary(c, raw, keys=(), extra=str(content_src or ""))

        code_snips = [str(x) for x in c.as_list(c.safe_get(raw, "m_code_snippet")) if str(x).strip()]
        if code_snips and len(summary) < 600:
            summary = self._clean_summary(c, raw, keys=(), extra=(summary + "\n\n" + code_snips[0] if summary else code_snips[0]))

        tlp_amber_id, tlp_red_id = c.add_tlp(created)

        content_types = self._content_types(c, raw, keys=("m_content_type", "content_type"))
        labels = self._labels(
            c,
            content_types=content_types,
            network=network,
            platform=platform,
            extra_labels=("orion:exploit",),
            include_network=True,
        )
        lang = self._lang_single(c, raw, "m_language")

        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"), c.safe_get(raw, "m_name"))
        actor_ref = self._add_intrusion_set_if_present(c, created, modified, tlp_amber_id, team, summary)

        iocs = self._extract_iocs(
            c=c,
            raw=raw,
            url_extra_keys=("m_encoded_urls", "m_weblink"),
            add_single_url=url,
        )

        infra_seed = c.first_nonempty(base_url, url, (iocs["domain_vals"][0] if iocs["domain_vals"] else None))
        infra_types = ["unknown"]
        if "c2" in content_types:
            infra_types = ["command-and-control"]
        elif str(network).lower() == "onion":
            infra_types = ["anonymization"]

        infra_ref = self._add_infrastructure(
            c=c,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            infra_seed=infra_seed,
            name=str(c.first_nonempty(title, c.safe_get(raw, "m_name"), "Exploit infrastructure")),
            summary=summary,
            labels=labels,
            network=network,
            infra_types=infra_types,
            key=f"infra:{infra_seed}" if infra_seed else None,
            extra_fields={"x_orion_network": str(network) if network else None},
        )

        refs = self._add_common_refs(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            labels=labels,
            summary=summary,
            location_keys=("m_country", "m_location"),
            iocs=iocs,
        )

        note_ref = self._add_sensitive_note(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            tlp_red_id=tlp_red_id,
            note_prefix="sensitive",
            mark_red_if_sensitive=True,
        )

        external_refs = self._external_refs(
            c=c,
            raw=raw,
            primary_url=url,
            base_url=base_url,
            base_url_source_name="base_url",
            include_hash=True,
            include_scraper=True,
        )

        report_object_refs: List[str] = []
        for r in (actor_ref, infra_ref, refs["observed_ref"], note_ref):
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(refs["location_refs"])
        report_object_refs.extend(refs["indicator_refs"])
        report_object_refs.extend(refs["vuln_refs"])
        report_object_refs.extend(refs["attack_refs"])
        report_object_refs = c.dedupe_keep(report_object_refs)

        report = {
            "type": "report",
            "spec_version": "2.1",
            "id": c.stix_id("report", f"exploit:{doc_id}"),
            "created": created,
            "modified": modified,
            "name": title,
            "description": summary if summary else None,
            "report_types": ["threat-report"],
            "published": created,
            "labels": labels,
            "lang": lang,
            "external_references": external_refs or None,
            "object_refs": report_object_refs,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_doc_id": str(doc_id),
            "x_orion_network": str(network) if network else None,
            "x_orion_platform": str(platform) if platform else None,
        }
        report = {k: v for k, v in report.items() if v is not None}
        c.add_obj(report, ("report", report["id"]))
        return self._bundle(c, report["id"])

    def _convert_leak(self, raw: LeakResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._timestamps(
            c=c,
            raw=raw,
            created_keys=("m_creation_date", "m_update_date"),
            modified_key="m_update_date",
        )

        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"), "Leak - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"))
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")

        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)

        content_src = c.first_nonempty(c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_content"), "")
        summary = self._clean_summary(c, raw, keys=(), extra=str(content_src or ""))

        tlp_amber_id, tlp_red_id = c.add_tlp(created)

        content_types = self._content_types(c, raw, keys=("m_content_type", "content_type"))
        labels = self._labels(
            c,
            content_types=content_types,
            network=network,
            platform=platform,
            extra_labels=("orion:leak",),
            include_network=True,
        )
        lang = self._lang_single(c, raw, "m_language")

        industries = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else None

        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])

        victim_refs = self._add_victims(
            c=c,
            raw=raw,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            org_keys=("m_org", "m_company_name"),
            sector=sector,
        )
        self._link_located_at(c, created, modified, tlp_amber_id, victim_refs, location_refs)

        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"))
        actor_ref = self._add_intrusion_set_if_present(c, created, modified, tlp_amber_id, team, summary)

        infra_seed = c.first_nonempty(base_url, url, (c.as_list(c.safe_get(raw, "m_domain"))[0] if c.as_list(c.safe_get(raw, "m_domain")) else None))
        infra_types = ["unknown"]
        if str(network).lower() == "onion":
            infra_types = ["anonymization"]
        if "ransomware" in content_types:
            infra_types = ["command-and-control"]

        infra_ref = self._add_infrastructure(
            c=c,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            infra_seed=infra_seed,
            name=str(c.first_nonempty(c.safe_get(raw, "m_team"), title, "Leak infrastructure")),
            summary=summary,
            labels=labels,
            network=network,
            infra_types=infra_types,
            key=f"infra:{infra_seed}" if infra_seed else None,
        )
        self._add_uses(c, created, modified, tlp_amber_id, actor_ref, infra_ref)

        iocs = self._extract_iocs(
            c=c,
            raw=raw,
            url_extra_keys=("m_encoded_urls", "m_dumplink", "m_websites"),
            add_single_url=None,
        )

        refs = self._add_common_refs(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            labels=labels,
            summary=summary,
            location_keys=("m_country", "m_location"),
            iocs=iocs,
        )

        note_ref = self._add_sensitive_note(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            tlp_red_id=tlp_red_id,
            note_prefix="sensitive",
            mark_red_if_sensitive=True,
        )

        external_refs = self._external_refs(
            c=c,
            raw=raw,
            primary_url=url,
            base_url=base_url,
            base_url_source_name="base_url",
            include_hash=True,
            include_scraper=True,
            extras_external_id=(("screenshot", "m_screenshot"),),
        )

        report_object_refs: List[str] = []
        for r in (actor_ref, infra_ref, refs["observed_ref"], note_ref):
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(victim_refs)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(refs["indicator_refs"])
        report_object_refs.extend(refs["vuln_refs"])
        report_object_refs.extend(refs["attack_refs"])
        report_object_refs = c.dedupe_keep(report_object_refs)

        dump_links = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, "m_dumplink")))

        report = {
            "type": "report",
            "spec_version": "2.1",
            "id": c.stix_id("report", f"leak:{doc_id}"),
            "created": created,
            "modified": modified,
            "name": title,
            "description": summary if summary else None,
            "report_types": ["threat-report"],
            "published": created,
            "labels": labels,
            "lang": lang,
            "external_references": external_refs or None,
            "object_refs": report_object_refs,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_doc_id": str(doc_id),
            "x_orion_network": str(network) if network else None,
            "x_orion_platform": str(platform) if platform else None,
            "x_orion_dumplink_count": str(len(dump_links)) if dump_links else None,
        }
        report = {k: v for k, v in report.items() if v is not None}
        c.add_obj(report, ("report", report["id"]))
        return self._bundle(c, report["id"])

    def _convert_social(self, raw: SocialResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._timestamps(
            c=c,
            raw=raw,
            created_keys=("m_creation_date", "m_update_date", "m_message_date"),
            modified_key="m_update_date",
        )

        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_channel_url"), "Social - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_message_sharable_link"), c.safe_get(raw, "m_channel_url"), c.safe_get(raw, "m_url"))
        base_url = c.safe_get(raw, "m_channel_url")
        network = c.safe_get(raw, "m_network")
        platform = c.safe_get(raw, "m_platform")

        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)

        content_src = c.first_nonempty(c.safe_get(raw, "m_content"), c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_meta_description"), "")
        summary = self._clean_summary(c, raw, keys=(), extra=str(content_src or ""))

        tlp_amber_id, tlp_red_id = c.add_tlp(created)

        content_types = self._content_types(c, raw, keys=("m_content_type", "content_type"))
        labels = self._labels(
            c,
            content_types=content_types,
            network=network,
            platform=platform,
            extra_labels=("orion:social",),
            include_network=True,
        )
        lang = self._lang_single(c, raw, "m_language")

        industries = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else "Social Media"

        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])

        author = c.first_nonempty(c.safe_get(raw, "m_author"), c.safe_get(raw, "m_username"))
        created_by_ref = self._add_identity_if_present(
            c=c,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            identity_class="individual",
            prefix="author",
            name_value=author,
        )

        hashtags = self._dedupe_str_list(c, (str(x).strip().lstrip("#") for x in c.as_list(c.safe_get(raw, "m_hashtag")) if str(x).strip()))
        mentions = self._dedupe_str_list(c, (str(x).strip().lstrip("@") for x in c.as_list(c.safe_get(raw, "m_mention")) if str(x).strip()))

        xmpp_vals = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, "m_xmpp_addresses")))
        crypto_vals = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, "m_crypto_address")))
        user_agents = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, "m_user_agents")))
        social_profiles = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, "m_social_media_profiles")))

        iocs = self._extract_iocs(
            c=c,
            raw=raw,
            url_extra_keys=("m_encoded_urls",),
            add_single_url=url,
        )
        for sp in social_profiles:
            if sp.startswith(("http://", "https://")):
                iocs["url_vals"].append(sp)
        iocs["url_vals"] = c.dedupe_keep(iocs["url_vals"])

        infra_seed = c.first_nonempty(base_url, url, (iocs["domain_vals"][0] if iocs["domain_vals"] else None))
        infra_types = ["unknown"]
        if str(network).lower() == "onion":
            infra_types = ["anonymization"]

        infra_ref = self._add_infrastructure(
            c=c,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            infra_seed=infra_seed,
            name=str(c.first_nonempty(platform, title, "Social infrastructure")),
            summary=summary,
            labels=labels,
            network=network,
            infra_types=infra_types,
            key=f"infra:{infra_seed}" if infra_seed else None,
            extra_fields={"x_orion_platform": str(platform) if platform else None},
        )

        extra_scos: List[Dict[str, Any]] = []
        for x in xmpp_vals:
            extra_scos.append({"type": "x-mpp-addr", "id": c.sco_id("x-mpp-addr", x), "value": x})
        for w in crypto_vals:
            extra_scos.append({"type": "cryptocurrency-wallet", "id": c.sco_id("cryptocurrency-wallet", w), "address": w})
        for ua in user_agents:
            extra_scos.append({"type": "user-agent", "id": c.sco_id("user-agent", ua), "string": ua})

        refs = self._add_common_refs(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            labels=labels,
            summary=summary,
            location_keys=("m_country", "m_location"),
            iocs=iocs,
            extra_scos=extra_scos,
        )

        note_ref = self._add_sensitive_note(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            tlp_red_id=tlp_red_id,
            note_prefix="social-meta",
            include_hashtags=hashtags,
            include_mentions=mentions,
            mark_red_if_sensitive=True,
        )

        external_refs = self._external_refs(
            c=c,
            raw=raw,
            primary_url=url,
            base_url=base_url,
            base_url_source_name="channel_url",
            include_hash=True,
            include_scraper=True,
            extras_url=(("share_link", c.safe_get(raw, "m_message_sharable_link")),),
        )

        report_object_refs: List[str] = []
        for r in (infra_ref, refs["observed_ref"], note_ref, created_by_ref):
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(refs["indicator_refs"])
        report_object_refs.extend(refs["vuln_refs"])
        report_object_refs.extend(refs["attack_refs"])
        report_object_refs = c.dedupe_keep(report_object_refs)

        report = {
            "type": "report",
            "spec_version": "2.1",
            "id": c.stix_id("report", f"social:{doc_id}"),
            "created": created,
            "modified": modified,
            "name": title,
            "description": summary if summary else None,
            "report_types": ["threat-report"],
            "published": created,
            "labels": labels,
            "lang": lang,
            "created_by_ref": created_by_ref,
            "external_references": external_refs or None,
            "object_refs": report_object_refs,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_doc_id": str(doc_id),
            "x_orion_network": str(network) if network else None,
            "x_orion_platform": str(platform) if platform else None,
            "x_orion_post_comments_count": str(c.safe_get(raw, "m_post_comments_count")) if c.safe_get(raw, "m_post_comments_count") else None,
        }
        report = {k: v for k, v in report.items() if v is not None}
        c.add_obj(report, ("report", report["id"]))
        return self._bundle(c, report["id"])

    def _convert_general(self, raw: GeneralResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._timestamps(
            c=c,
            raw=raw,
            created_keys=("m_creation_date", "m_update_date"),
            modified_key="m_update_date",
        )

        title = str(c.first_nonempty(c.safe_get(raw, "m_title"), c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"), "General - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_url"), c.safe_get(raw, "m_base_url"))
        base_url = c.safe_get(raw, "m_base_url")
        network = c.safe_get(raw, "m_network")

        doc_id = c.first_nonempty(c.safe_get(raw, "m_document_id"), c.safe_get(raw, "m_hash"), url, base_url, title)

        summary_src = c.first_nonempty(c.safe_get(raw, "m_important_content"), c.safe_get(raw, "m_meta_description"), c.safe_get(raw, "m_content"), "")
        summary = self._clean_summary(c, raw, keys=(), extra=str(summary_src or ""))

        tlp_amber_id, tlp_red_id = c.add_tlp(created)

        content_types = self._content_types(c, raw, keys=("m_content_type", "content_type"))
        extra_platforms = [f"platform:{str(p).strip().lower()}" for p in c.as_list(c.safe_get(raw, "m_platform")) if str(p).strip()]
        extra_tags = [f"tag:{str(h).strip().lstrip('#').lower()}" for h in c.as_list(c.safe_get(raw, "m_hashtag")) if str(h).strip()]
        labels = self._labels(
            c,
            content_types=content_types,
            network=network,
            platform=None,
            extra_labels=[*extra_platforms, *extra_tags, "orion:general"],
            include_network=True,
        )
        lang = self._lang_single(c, raw, "m_language")

        industries = [str(x).strip() for x in c.as_list(c.safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else None

        location_refs = c.add_locations(raw=raw, created=created, modified=modified, tlp_amber_id=tlp_amber_id, keys=["m_country", "m_location"])

        victim_refs = self._add_victims(
            c=c,
            raw=raw,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            org_keys=("m_org", "m_company_name"),
            sector=sector,
        )
        self._link_located_at(c, created, modified, tlp_amber_id, victim_refs, location_refs)

        team = c.first_nonempty(c.safe_get(raw, "m_team"), c.safe_get(raw, "m_author"))
        actor_ref = self._add_intrusion_set_if_present(c, created, modified, tlp_amber_id, team, summary)

        iocs = self._extract_iocs(
            c=c,
            raw=raw,
            url_extra_keys=("m_encoded_urls",),
            add_single_url=url,
        )

        infra_seed = c.first_nonempty(url, base_url, (iocs["domain_vals"][0] if iocs["domain_vals"] else None))
        infra_types = ["unknown"]
        if str(network).lower() == "onion":
            infra_types = ["anonymization"]
        elif "darkweb" in content_types:
            infra_types = ["hosting-malware"]

        infra_ref = self._add_infrastructure(
            c=c,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            infra_seed=infra_seed,
            name=str(c.first_nonempty(c.safe_get(raw, "m_team"), title, "Observed infrastructure")),
            summary=summary,
            labels=labels,
            network=network,
            infra_types=infra_types,
            key=f"infra:{infra_seed}" if infra_seed else None,
        )
        self._add_uses(c, created, modified, tlp_amber_id, actor_ref, infra_ref)

        refs = self._add_common_refs(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            labels=labels,
            summary=summary,
            location_keys=("m_country", "m_location"),
            iocs=iocs,
        )

        note_ref = self._add_sensitive_note(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            tlp_red_id=tlp_red_id,
            note_prefix="sensitive",
            mark_red_if_sensitive=True,
        )

        external_refs = self._external_refs(
            c=c,
            raw=raw,
            primary_url=url,
            base_url=base_url,
            base_url_source_name="base_url",
            include_hash=True,
            include_scraper=True,
            extras_external_id=(("screenshot", "m_screenshot"),),
        )

        report_object_refs: List[str] = []
        for r in (actor_ref, infra_ref, refs["observed_ref"], note_ref):
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(victim_refs)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(refs["indicator_refs"])
        report_object_refs.extend(refs["vuln_refs"])
        report_object_refs.extend(refs["attack_refs"])
        report_object_refs = c.dedupe_keep(report_object_refs)

        report = {
            "type": "report",
            "spec_version": "2.1",
            "id": c.stix_id("report", str(doc_id)),
            "created": created,
            "modified": modified,
            "name": title,
            "description": summary if summary else None,
            "report_types": ["threat-report"],
            "published": created,
            "labels": labels,
            "lang": lang,
            "external_references": external_refs or None,
            "object_refs": report_object_refs,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_doc_id": str(doc_id),
            "x_orion_network": str(network) if network else None,
        }
        report = {k: v for k, v in report.items() if v is not None}
        c.add_obj(report, ("report", report["id"]))
        return self._bundle(c, report["id"])

    def _convert_chat(self, raw: ChatResultItem) -> Dict[str, Any]:
        c = stix_helper()
        created, modified = self._timestamps(
            c=c,
            raw=raw,
            created_keys=("m_creation_date", "m_update_date", "m_message_date"),
            modified_key="m_update_date",
        )

        caption = str(c.first_nonempty(c.safe_get(raw, "m_caption"), c.safe_get(raw, "m_content"), "Chat - unknown title"))
        url = c.first_nonempty(c.safe_get(raw, "m_message_sharable_link"), c.safe_get(raw, "m_media_url"))
        channel_url = c.safe_get(raw, "m_channel_url")
        channel_id = c.safe_get(raw, "m_channel_id")
        platform = c.safe_get(raw, "m_platform")
        network = c.safe_get(raw, "m_network") or (str(platform).strip().lower() if platform else None)

        doc_id = c.first_nonempty(
            c.safe_get(raw, "m_document_id"),
            c.safe_get(raw, "m_hash"),
            c.safe_get(raw, "m_message_id"),
            url,
            channel_id,
            caption,
        )

        content_src = c.first_nonempty(c.safe_get(raw, "m_content"), c.safe_get(raw, "m_media_caption"), "")
        summary = self._clean_summary(c, raw, keys=(), extra=str(content_src or ""))

        tlp_amber_id, tlp_red_id = c.add_tlp(created)

        content_types = self._content_types(c, raw, keys=("m_content_type", "content_type"))
        labels = self._labels(
            c,
            content_types=content_types,
            network=network,
            platform=platform,
            extra_labels=("orion:chat",),
            include_network=True,
        )
        lang = self._lang_single(c, raw, "m_language")

        sender = c.first_nonempty(c.safe_get(raw, "m_sender_username"), c.safe_get(raw, "m_users"), c.safe_get(raw, "m_author"))
        created_by_ref = self._add_identity_if_present(
            c=c,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            identity_class="individual",
            prefix="sender",
            name_value=sender,
        )

        channel_name = c.first_nonempty(c.safe_get(raw, "m_channel_name"), channel_id, channel_url, "Chat channel")
        infra_seed = c.first_nonempty(channel_url, channel_id)

        infra_types = ["unknown"]
        if str(platform).strip().lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)):
            infra_types = ["communications"]

        infra_ref = self._add_infrastructure(
            c=c,
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            infra_seed=infra_seed,
            name=str(channel_name),
            summary=summary,
            labels=labels,
            network=network,
            infra_types=infra_types,
            key=f"channel:{infra_seed}" if infra_seed else None,
            extra_fields={"x_orion_channel_id": str(channel_id) if channel_id else None},
        )

        mentions = self._dedupe_str_list(c, (str(x).strip().lstrip("@") for x in c.as_list(c.safe_get(raw, "m_mention")) if str(x).strip()))
        hashtags = self._dedupe_str_list(c, (str(x).strip().lstrip("#") for x in c.as_list(c.safe_get(raw, "m_hashtag")) if str(x).strip()))
        user_agents = self._dedupe_str_list(c, c.as_list(c.safe_get(raw, "m_user_agents")))

        cves_raw = [str(x).strip().upper() for x in c.as_list(c.safe_get(raw, "m_cve")) if str(x).strip()]
        vuln_only = c.dedupe_keep([x for x in cves_raw if x.startswith("CVE-")])

        iocs = self._extract_iocs(
            c=c,
            raw=raw,
            url_extra_keys=("m_encoded_urls", "m_weblink"),
            add_single_url=url,
            add_single_channel_url=channel_url,
        )

        extra_scos = [{"type": "user-agent", "id": c.sco_id("user-agent", ua), "string": ua} for ua in user_agents]

        refs = self._add_common_refs(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            labels=labels,
            summary=summary,
            location_keys=(),
            iocs=iocs,
            extra_scos=extra_scos,
            cve_values=vuln_only,
        )

        note_ref = self._add_sensitive_note(
            c=c,
            raw=raw,
            doc_id=str(doc_id),
            created=created,
            modified=modified,
            tlp_amber_id=tlp_amber_id,
            tlp_red_id=tlp_red_id,
            note_prefix="chat-meta",
            include_hashtags=hashtags,
            include_mentions=mentions,
            mark_red_if_sensitive=True,
        )

        external_refs = self._external_refs(
            c=c,
            raw=raw,
            primary_url=url,
            base_url=channel_url,
            base_url_source_name="channel_url",
            include_hash=True,
            include_scraper=True,
            extras_external_id=(("message_id", "m_message_id"),),
        )

        report_object_refs: List[str] = []
        for r in (infra_ref, refs["observed_ref"], note_ref, created_by_ref):
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(refs["vuln_refs"])
        report_object_refs.extend(refs["indicator_refs"])
        report_object_refs.extend(refs["attack_refs"])
        report_object_refs = c.dedupe_keep(report_object_refs)

        report = {
            "type": "report",
            "spec_version": "2.1",
            "id": c.stix_id("report", f"chat:{doc_id}"),
            "created": created,
            "modified": modified,
            "name": caption,
            "description": summary if summary else None,
            "report_types": ["threat-report"],
            "published": created,
            "labels": labels,
            "lang": lang,
            "created_by_ref": created_by_ref,
            "external_references": external_refs or None,
            "object_refs": report_object_refs,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_doc_id": str(doc_id),
            "x_orion_network": str(network) if network else None,
            "x_orion_platform": str(platform) if platform else None,
            "x_orion_channel_id": str(channel_id) if channel_id else None,
            "x_orion_channel_name": str(c.safe_get(raw, "m_channel_name")) if c.safe_get(raw, "m_channel_name") else None,
            "x_orion_views": str(c.safe_get(raw, "m_views")) if c.safe_get(raw, "m_views") else None,
            "x_orion_sender_is_bot": bool(c.safe_get(raw, "m_sender_is_bot")) if c.safe_get(raw, "m_sender_is_bot") is not None else None,
            "x_orion_is_forwarded": bool(c.safe_get(raw, "m_is_forwarded")) if c.safe_get(raw, "m_is_forwarded") is not None else None,
            "x_orion_is_reply": bool(c.safe_get(raw, "m_is_reply")) if c.safe_get(raw, "m_is_reply") is not None else None,
            "x_orion_pinned": bool(c.safe_get(raw, "m_pinned")) if c.safe_get(raw, "m_pinned") is not None else None,
        }
        report = {k: v for k, v in report.items() if v is not None}
        c.add_obj(report, ("report", report["id"]))
        return self._bundle(c, report["id"])
