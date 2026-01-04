from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import re
import uuid
from typing import Any, Dict, Optional, List, Set, Tuple, Callable, Awaitable

try:
    from orion.api.interactive.search_manager.search_model import search_model
except Exception:
    search_model = None

@dataclass
class _AttrObj:
    __data: Dict[str, Any]

    def __getattr__(self, item: str) -> Any:
        try:
            return self.__data[item]
        except KeyError:
            raise AttributeError(item)

    def to_dict(self) -> Dict[str, Any]:
        return dict(self.__data)


def _to_attr_obj(raw: Any) -> Any:
    if raw is None:
        return raw
    if isinstance(raw, _AttrObj):
        return raw
    if isinstance(raw, dict):
        return _AttrObj(raw)
    return raw


def safe_get(obj: Any, key: str, default: Any = None) -> Any:
    return getattr(obj, key, default)


def as_list(v: Any) -> List[Any]:
    if v is None:
        return []
    if isinstance(v, list):
        return [x for x in v if x is not None and x != ""]
    return [v] if v != "" else []


def first_nonempty(*vals: Any) -> Optional[Any]:
    for v in vals:
        if v is None:
            continue
        if isinstance(v, str) and not v.strip():
            continue
        if isinstance(v, list) and len(v) == 0:
            continue
        return v
    return None


def clean_text(s: str) -> str:
    if not s:
        return ""
    s = s.replace("\r\n", "\n")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def parse_ts_full(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        v = str(value).strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            dt = datetime.fromisoformat(v).replace(tzinfo=timezone.utc)
            return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")
        if v.endswith("Z"):
            v = v[:-1] + "+00:00"
        dt = datetime.fromisoformat(v)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt = dt.astimezone(timezone.utc)
        return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    except Exception:
        return None


def parse_ts_general(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        v = value.strip()
        if v.endswith("Z"):
            v = v[:-1] + "+00:00"
        dt = datetime.fromisoformat(v)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt = dt.astimezone(timezone.utc)
        return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    except Exception:
        return None


def now_ts() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def uuid5(seed: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, seed))


def stix_id(stix_type: str, seed: str) -> str:
    return f"{stix_type}--{uuid5(f'{stix_type}:{seed}')}"


def sco_id(sco_type: str, seed: str) -> str:
    return f"{sco_type}--{uuid5(f'{sco_type}:{seed}')}"


def sha256(v: str) -> str:
    return hashlib.sha256(v.encode("utf-8", errors="ignore")).hexdigest()


def escape_pat(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def add_obj(objects: List[Dict[str, Any]],
            seen: Dict[Tuple[str, str], str],
            obj: Dict[str, Any],
            uniq: Optional[Tuple[str, str]] = None) -> str:
    oid = obj["id"]
    if uniq is not None:
        existing = seen.get(uniq)
        if existing:
            return existing
        seen[uniq] = oid
    objects.append(obj)
    return oid


def ensure_tlp_markings(objects: List[Dict[str, Any]],
                        seen: Dict[Tuple[str, str], str],
                        created: str) -> Tuple[str, str]:
    tlp_amber_id = stix_id("marking-definition", "tlp:amber")
    tlp_red_id = stix_id("marking-definition", "tlp:red")
    md_amber = {"type": "marking-definition", "spec_version": "2.1", "id": tlp_amber_id,
                "created": created, "definition_type": "tlp",
                "definition": {"tlp": "amber"}}
    md_red = {"type": "marking-definition", "spec_version": "2.1", "id": tlp_red_id,
              "created": created, "definition_type": "tlp",
              "definition": {"tlp": "red"}}
    add_obj(objects, seen, md_amber, uniq=("marking-definition", tlp_amber_id))
    add_obj(objects, seen, md_red, uniq=("marking-definition", tlp_red_id))
    return tlp_amber_id, tlp_red_id


class _BaseConverter:
    type_label: str = "orion:general"
    report_prefix: str = "general"
    parse_ts_func = staticmethod(parse_ts_full)
    created_ts_fields = ["m_creation_date", "m_update_date"]
    modified_ts_fields = ["m_update_date"]
    email_indicator_types = ["phishing"]
    extra_url_fields: List[str] = []

    def convert(self, raw: Any) -> Dict[str, Any]:
        raw = _to_attr_obj(raw)
        created, modified = self._get_timestamps(raw)
        title = self._get_title(raw)
        url = self._get_url(raw)
        base_url = safe_get(raw, "m_base_url")
        network = safe_get(raw, "m_network")
        platform = safe_get(raw, "m_platform")
        doc_id = self._get_doc_id(raw, url, base_url, title)
        summary = self._get_summary(raw)
        objects: List[Dict[str, Any]] = []
        seen: Dict[Tuple[str, str], str] = {}
        tlp_amber_id, tlp_red_id = ensure_tlp_markings(objects, seen, created)
        content_types = self._get_content_types(raw)
        labels = set(str(ct).lower() for ct in content_types)
        self._add_type_specific_labels(labels, raw, network, platform)
        labels = sorted(labels)
        lang = self._get_lang(raw)
        location_refs = self._create_location_objects(objects, seen, raw, created, modified, tlp_amber_id)
        actor_ref = self._create_intrusion_set_object(objects, seen, raw, created, modified, summary, tlp_amber_id)
        author_ref = self._create_author_identity_object(objects, seen, raw, created, modified, tlp_amber_id)
        victim_refs = self._create_victim_identities(objects, seen, raw, created, modified, tlp_amber_id, location_refs)
        infra_ref = self._create_infrastructure_object(objects, seen, raw, created, modified, title, summary, labels, network, platform, tlp_amber_id, content_types, base_url, url)
        if actor_ref and infra_ref:
            rel = {"type": "relationship", "spec_version": "2.1",
                   "id": stix_id("relationship", f"{actor_ref}|uses|{infra_ref}"),
                   "created": created, "modified": modified,
                   "relationship_type": "uses", "source_ref": actor_ref, "target_ref": infra_ref,
                   "object_marking_refs": [tlp_amber_id]}
            add_obj(objects, seen, rel, uniq=("relationship", f"{actor_ref}|uses|{infra_ref}"))
        sco_refs: List[str] = []
        self._collect_and_add_scos(objects, seen, raw, url, sco_refs)
        observed_ref = self._create_observed_data(objects, seen, doc_id, created, modified, sco_refs, tlp_amber_id)
        indicator_refs = self._create_indicator_objects(objects, seen, raw, created, modified, summary, labels, tlp_amber_id)
        vuln_refs = self._create_vulnerability_objects(objects, seen, raw, created, modified, tlp_amber_id)
        attack_refs = self._create_attack_pattern_objects(objects, seen, raw, created, modified, tlp_amber_id)
        note_ref = self._create_note_object(objects, seen, raw, doc_id, created, modified, tlp_red_id, tlp_amber_id)
        external_refs = self._get_external_references(raw, url, base_url)
        report_object_refs = self._collect_report_object_refs(actor_ref, author_ref, infra_ref, observed_ref, note_ref, location_refs, indicator_refs, vuln_refs, attack_refs, victim_refs)
        custom_fields = self._get_report_custom_fields(raw)
        report = self._build_report(objects, seen, doc_id, created, modified, title, summary, labels, lang, external_refs, report_object_refs, tlp_amber_id, network, platform, author_ref, **custom_fields)
        bundle = {"type": "bundle", "id": stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": objects}
        return bundle

    def _get_timestamps(self, raw: Any) -> Tuple[str, str]:
        parse_ts = self.parse_ts_func
        created = first_nonempty(*[parse_ts(safe_get(raw, f)) for f in self.created_ts_fields], now_ts())
        modified = first_nonempty(*[parse_ts(safe_get(raw, f)) for f in self.modified_ts_fields], created)
        if modified < created:
            modified = created
        return created, modified

    def _get_title(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_title"), "Unknown title"))

    def _get_url(self, raw: Any) -> Optional[str]:
        return first_nonempty(safe_get(raw, "m_url"), safe_get(raw, "m_base_url"))

    def _get_doc_id(self, raw: Any, url: Optional[str], base_url: Optional[str], title: str) -> str:
        return str(first_nonempty(safe_get(raw, "m_document_id"), safe_get(raw, "m_hash"), url, base_url, title))

    def _get_summary_source(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_important_content"), safe_get(raw, "m_content"), safe_get(raw, "m_meta_description"), ""))

    def _get_summary(self, raw: Any) -> str:
        source = self._get_summary_source(raw)
        summary = clean_text(source)
        if len(summary) > 4000:
            summary = summary[:4000] + "…"
        extra = self._get_extra_summary(raw, summary)
        if extra:
            summary = (summary + "\n\n" + extra) if summary else extra
            if len(summary) > 4000:
                summary = summary[:4000] + "…"
        return summary

    def _get_extra_summary(self, raw: Any, current_summary: str) -> Optional[str]:
        return None

    def _get_content_types(self, raw: Any) -> Set[str]:
        return {str(x).strip().lower() for x in (as_list(safe_get(raw, "m_content_type")) + as_list(safe_get(raw, "content_type"))) if str(x).strip()}

    def _add_type_specific_labels(self, labels: Set[str], raw: Any, network: Optional[Any], platform: Optional[Any]) -> None:
        if network:
            labels.add(str(network).strip().lower())
        for p in as_list(platform or safe_get(raw, "m_platform")):
            sp = str(p).strip().lower()
            if sp:
                labels.add(f"platform:{sp}")
        labels.add(self.type_label)

    def _get_lang(self, raw: Any) -> Optional[str]:
        langs = [str(x).strip() for x in as_list(safe_get(raw, "m_language")) if str(x).strip()]
        return langs[0] if len(langs) == 1 else None

    def _create_location_objects(self, objects, seen, raw, created, modified, tlp_amber_id) -> List[str]:
        refs = []
        for c in (as_list(safe_get(raw, "m_country")) or as_list(safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            loc = {"type": "location", "spec_version": "2.1", "id": stix_id("location", f"country:{cc}"),
                   "created": created, "modified": modified, "name": cc, "country": cc,
                   "object_marking_refs": [tlp_amber_id]}
            refs.append(add_obj(objects, seen, loc, uniq=("location", f"country:{cc}")))
        return refs

    def _create_intrusion_set_object(self, objects, seen, raw, created, modified, summary, tlp_amber_id) -> Optional[str]:
        return None

    def _create_author_identity_object(self, objects, seen, raw, created, modified, tlp_amber_id) -> Optional[str]:
        return None

    def _create_victim_identities(self, objects, seen, raw, created, modified, tlp_amber_id, location_refs) -> List[str]:
        return []

    def _get_infra_seed(self, raw, base_url, url, domain_vals) -> Optional[str]:
        return first_nonempty(base_url, url, domain_vals[0] if domain_vals else None)

    def _get_infra_name(self, raw, title) -> str:
        return title

    def _get_infra_types(self, raw, content_types, network) -> List[str]:
        types = ["unknown"]
        if network and str(network).lower() == "onion":
            types = ["anonymization"]
        return types

    def _create_infrastructure_object(self, objects, seen, raw, created, modified, title, summary, labels, network, platform, tlp_amber_id, content_types, base_url, url) -> Optional[str]:
        domain_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_domain")) if str(x).strip()]
        seed = self._get_infra_seed(raw, base_url, url, domain_vals)
        if not seed:
            return None
        infra_types = self._get_infra_types(raw, content_types, network)
        name = self._get_infra_name(raw, title)
        infra = {
            "type": "infrastructure", "spec_version": "2.1",
            "id": stix_id("infrastructure", f"infra:{seed}"),
            "created": created, "modified": modified,
            "name": name, "description": summary if summary else None,
            "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified,
            "labels": labels, "object_marking_refs": [tlp_amber_id],
            "x_orion_network": str(network) if network else None,
        }
        infra = {k: v for k, v in infra.items() if v is not None}
        return add_obj(objects, seen, infra, uniq=("infrastructure", f"infra:{seed}"))

    def _collect_and_add_scos(self, objects, seen, raw, url, sco_refs: List[str]):
        domain_vals = sorted(set(str(x).strip() for x in as_list(safe_get(raw, "m_domain")) if str(x).strip()))
        url_vals = set(str(x).strip() for x in as_list(safe_get(raw, "m_url")) if str(x).strip())
        ip_vals = sorted(set(str(x).strip() for x in as_list(safe_get(raw, "m_ip")) if str(x).strip()))
        email_vals = sorted(set(str(x).strip() for x in as_list(safe_get(raw, "m_email")) if str(x).strip()))
        asn_vals = sorted(set(a for a in (str(x).strip().upper().lstrip("AS") for x in as_list(safe_get(raw, "m_asns"))) if a.isdigit()))
        file_paths = sorted(set(str(x).strip() for x in as_list(safe_get(raw, "m_file_paths")) if str(x).strip()))

        encoded_urls = [str(x).strip() for x in as_list(safe_get(raw, "m_encoded_urls")) if str(x).strip()]
        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.add(eu)

        for field in self.extra_url_fields:
            for u in as_list(safe_get(raw, field)):
                u_str = str(u).strip()
                if u_str.startswith(("http://", "https://")):
                    url_vals.add(u_str)

        if url:
            url_vals.add(str(url))

        url_vals = sorted(url_vals)

        for u in url_vals:
            sco_refs.append(add_obj(objects, seen, {"type": "url", "id": sco_id("url", u), "value": u}, uniq=("url", u)))
        for d in domain_vals:
            sco_refs.append(add_obj(objects, seen, {"type": "domain-name", "id": sco_id("domain-name", d), "value": d}, uniq=("domain-name", d)))
        for ip in ip_vals:
            sco_type = "ipv6-addr" if ":" in ip else "ipv4-addr"
            sco_refs.append(add_obj(objects, seen, {"type": sco_type, "id": sco_id(sco_type, ip), "value": ip}, uniq=(sco_type, ip)))
        for e in email_vals:
            el = e.lower()
            sco_refs.append(add_obj(objects, seen, {"type": "email-addr", "id": sco_id("email-addr", el), "value": e}, uniq=("email-addr", el)))
        for a in asn_vals:
            sco_refs.append(add_obj(objects, seen, {"type": "autonomous-system", "id": sco_id("autonomous-system", a), "number": int(a)}, uniq=("autonomous-system", a)))
        for p in file_paths:
            sco_refs.append(add_obj(objects, seen, {"type": "directory", "id": sco_id("directory", p), "path": p}, uniq=("directory", p)))

        self._add_extra_scos(objects, seen, sco_refs, raw)

    def _add_extra_scos(self, objects, seen, sco_refs: List[str], raw: Any) -> None:
        pass

    def _create_observed_data(self, objects, seen, doc_id, created, modified, sco_refs, tlp_amber_id) -> Optional[str]:
        if not sco_refs:
            return None
        obs = {
            "type": "observed-data", "spec_version": "2.1",
            "id": stix_id("observed-data", f"{doc_id}|{created}"),
            "created": created, "modified": modified,
            "first_observed": created, "last_observed": modified,
            "number_observed": 1, "object_refs": sorted(set(sco_refs)),
            "object_marking_refs": [tlp_amber_id],
        }
        return add_obj(objects, seen, obs, uniq=("observed-data", obs["id"]))

    def _create_indicator_objects(self, objects, seen, raw, created, modified, summary, labels, tlp_amber_id) -> List[str]:
        indicator_refs = []
        domain_vals = sorted(set(str(x).strip() for x in as_list(safe_get(raw, "m_domain")) if str(x).strip()))
        url_vals = sorted(set(str(x).strip() for x in as_list(safe_get(raw, "m_url")) if str(x).strip()))
        ip_vals = sorted(set(str(x).strip() for x in as_list(safe_get(raw, "m_ip")) if str(x).strip()))
        email_vals = sorted(set(str(x).strip() for x in as_list(safe_get(raw, "m_email")) if str(x).strip()))

        def add_indicator(name: str, pattern: str, types: List[str]):
            ind = {
                "type": "indicator", "spec_version": "2.1",
                "id": stix_id("indicator", f"{name}|{pattern}"),
                "created": created, "modified": modified,
                "name": name, "description": summary if summary else None,
                "indicator_types": types, "pattern_type": "stix", "pattern": pattern,
                "valid_from": created, "labels": labels, "object_marking_refs": [tlp_amber_id],
            }
            ind = {k: v for k, v in ind.items() if v is not None}
            return add_obj(objects, seen, ind, uniq=("indicator", ind["id"]))

        if domain_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in domain_vals)
            indicator_refs.append(add_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"]))

        if url_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in url_vals)
            indicator_refs.append(add_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"]))

        if ip_vals:
            v4 = sorted(v for v in ip_vals if ":" not in v)
            v6 = sorted(v for v in ip_vals if ":" in v)
            if v4:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v4)
                indicator_refs.append(add_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"]))
            if v6:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v6)
                indicator_refs.append(add_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"]))

        if email_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in email_vals)
            indicator_refs.append(add_indicator("Emails", f"[email-addr:value IN ({vals})]", self.email_indicator_types))

        for yr in as_list(safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if rule:
                yara_ind = {
                    "type": "indicator", "spec_version": "2.1",
                    "id": stix_id("indicator", f"yara|{sha256(rule)}"),
                    "created": created, "modified": modified,
                    "name": "YARA Rule", "pattern_type": "yara", "pattern": rule,
                    "valid_from": created, "labels": labels, "object_marking_refs": [tlp_amber_id],
                }
                indicator_refs.append(add_obj(objects, seen, yara_ind, uniq=("indicator", yara_ind["id"])))

        return indicator_refs

    def _create_vulnerability_objects(self, objects, seen, raw, created, modified, tlp_amber_id) -> List[str]:
        refs = []
        for token in as_list(safe_get(raw, "m_cve")):
            token = str(token).strip().upper()
            if not token:
                continue
            if token.startswith("CVE-"):
                v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id("vulnerability", token),
                     "created": created, "modified": modified, "name": token,
                     "external_references": [{"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}],
                     "object_marking_refs": [tlp_amber_id]}
                refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))
            elif token.startswith("CWE-"):
                cwe_num = token.replace("CWE-", "")
                if cwe_num.isdigit():
                    v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id("vulnerability", token),
                         "created": created, "modified": modified, "name": token,
                         "external_references": [{"source_name": "cwe", "external_id": token, "url": f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"}],
                         "object_marking_refs": [tlp_amber_id]}
                    refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))
        return refs

    def _create_attack_pattern_objects(self, objects, seen, raw, created, modified, tlp_amber_id) -> List[str]:
        tactics = [str(x).strip().lower().replace(" ", "-") for x in as_list(safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in as_list(safe_get(raw, "m_enterprise_attack_techniques")) if str(x).strip()]
        refs = []
        for tech in sorted(set(techniques)):
            if not re.match(r"^(T\d{4})(\.\d{3})?$", tech):
                continue
            base = tech.split(".")[0]
            ap = {
                "type": "attack-pattern", "spec_version": "2.1", "id": stix_id("attack-pattern", tech),
                "created": created, "modified": modified, "name": tech,
                "external_references": [{"source_name": "mitre-attack", "external_id": tech, "url": f"https://attack.mitre.org/techniques/{base}/"}],
                "kill_chain_phases": [{"kill_chain_name": "mitre-attack", "phase_name": t} for t in sorted(set(tactics))] if tactics else None,
                "object_marking_refs": [tlp_amber_id],
            }
            ap = {k: v for k, v in ap.items() if v is not None}
            refs.append(add_obj(objects, seen, ap, uniq=("attack-pattern", tech)))
        return refs

    def _get_sensitive_data(self, raw: Any) -> Dict[str, List[Dict[str, str]]]:
        sensitive = {}
        def add(cat: str, field: str):
            vals = [str(v).strip() for v in as_list(safe_get(raw, field)) if str(v).strip()]
            if not vals:
                return
            out = [{"sha256": sha256(v), "last4": v[-4:] if len(v) >= 4 else v} for v in sorted(set(vals))]
            sensitive[cat] = out
        add("credit_cards", "m_credit_card")
        add("us_passport", "m_us_passport")
        add("au_abn", "m_au_abn")
        add("us_bank_number", "m_us_bank_number")
        return sensitive

    def _add_extra_note_content(self, content_note: Dict, raw: Any) -> None:
        pass

    def _create_note_object(self, objects, seen, raw, doc_id, created, modified, tlp_red_id, tlp_amber_id) -> Optional[str]:
        sensitive = self._get_sensitive_data(raw)
        content_note: Dict[str, Any] = {}
        if sensitive:
            content_note["sensitive_hashed"] = sensitive
        self._add_extra_note_content(content_note, raw)
        if not content_note:
            return None
        marking = [tlp_red_id] if sensitive else [tlp_amber_id]
        note = {
            "type": "note", "spec_version": "2.1",
            "id": stix_id("note", f"{self.type_label}|{doc_id}|{created}"),
            "created": created, "modified": modified,
            "abstract": "Sensitive artifacts (hashed)" if sensitive else "Metadata",
            "content": str(content_note),
            "object_marking_refs": marking,
        }
        return add_obj(objects, seen, note, uniq=("note", note["id"]))

    def _get_external_references(self, raw, url, base_url) -> Optional[List[Dict]]:
        refs = []
        if url:
            refs.append({"source_name": "source", "url": str(url)})
        if base_url and base_url != url:
            refs.append({"source_name": "base_url", "url": str(base_url)})
        if safe_get(raw, "m_hash"):
            refs.append({"source_name": "content-hash", "external_id": str(safe_get(raw, "m_hash"))})
        if safe_get(raw, "m_scrap_file"):
            refs.append({"source_name": "scraper", "external_id": str(safe_get(raw, "m_scrap_file"))})
        if safe_get(raw, "m_screenshot"):
            refs.append({"source_name": "screenshot", "external_id": str(safe_get(raw, "m_screenshot"))})
        return refs or None

    def _collect_report_object_refs(self, actor_ref, author_ref, infra_ref, observed_ref, note_ref, location_refs, indicator_refs, vuln_refs, attack_refs, victim_refs):
        refs = [r for r in (actor_ref, author_ref, infra_ref, observed_ref, note_ref) if r]
        refs.extend(location_refs + indicator_refs + vuln_refs + attack_refs + victim_refs)
        return sorted(set(refs))

    def _get_report_custom_fields(self, raw: Any) -> Dict[str, Any]:
        return {}

    def _build_report(self, objects, seen, doc_id, created, modified, title, summary, labels, lang, external_refs, object_refs, tlp_amber_id, network, platform, author_ref, **custom):
        report = {
            "type": "report", "spec_version": "2.1",
            "id": stix_id("report", f"{self.report_prefix}:{doc_id}"),
            "created": created, "modified": modified,
            "name": title, "description": summary if summary else None,
            "report_types": ["threat-report"], "published": created,
            "labels": labels, "lang": lang,
            "created_by_ref": author_ref,
            "external_references": external_refs,
            "object_refs": object_refs,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_doc_id": str(doc_id),
            "x_orion_network": str(network) if network else None,
            **custom,
        }
        report = {k: v for k, v in report.items() if v is not None}
        add_obj(objects, seen, report, uniq=("report", report["id"]))
        return report


class _DefacementConverter(_BaseConverter):
    type_label = "orion:defacement"
    report_prefix = "defacement"
    created_ts_fields = ["m_leak_date", "m_creation_date", "m_update_date"]
    extra_url_fields = ["m_mirror_links", "m_source_url"]

    def _get_title(self, raw: Any) -> str:
        return str(first_nonempty(
            safe_get(raw, "m_title"),
            safe_get(raw, "m_url"),
            safe_get(raw, "m_base_url"),
            as_list(safe_get(raw, "m_mirror_links"))[0] if as_list(safe_get(raw, "m_mirror_links")) else None,
            str(safe_get(raw, "m_content")).splitlines()[0] if safe_get(raw, "m_content") else None,
            "Defacement - unknown title",
        ))

    def _get_url(self, raw: Any) -> Optional[str]:
        return first_nonempty(
            safe_get(raw, "m_url"),
            safe_get(raw, "m_base_url"),
            as_list(safe_get(raw, "m_source_url"))[0] if as_list(safe_get(raw, "m_source_url")) else None,
            as_list(safe_get(raw, "m_mirror_links"))[0] if as_list(safe_get(raw, "m_mirror_links")) else None,
        )

    def _get_summary_source(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_content"), safe_get(raw, "m_important_content"), ""))

    def _get_content_types(self, raw: Any) -> Set[str]:
        ct = super()._get_content_types(raw)
        if not ct:
            ct.add("defacement")
        return ct

    def _get_report_custom_fields(self, raw: Any) -> Dict[str, Any]:
        attack_vector = str(first_nonempty(
            as_list(safe_get(raw, "m_ioc_type"))[0] if as_list(safe_get(raw, "m_ioc_type")) else None,
            as_list(safe_get(raw, "m_web_server"))[0] if as_list(safe_get(raw, "m_web_server")) else None,
            "Unknown",
        ))
        mirror_count = len(as_list(safe_get(raw, "m_mirror_links")))
        return {
            "x_orion_attack_vector": attack_vector,
            "x_orion_mirror_links_count": str(mirror_count) if mirror_count else None,
        }


class _ExploitConverter(_BaseConverter):
    type_label = "orion:exploit"
    report_prefix = "exploit"
    extra_url_fields = ["m_weblink"]

    def _get_title(self, raw: Any) -> str:
        return str(first_nonempty(
            safe_get(raw, "m_title"),
            safe_get(raw, "m_url"),
            as_list(safe_get(raw, "m_weblink"))[0] if as_list(safe_get(raw, "m_weblink")) else None,
            "Exploit - unknown title",
        ))

    def _get_url(self, raw: Any) -> Optional[str]:
        return first_nonempty(safe_get(raw, "m_url"), as_list(safe_get(raw, "m_weblink"))[0] if as_list(safe_get(raw, "m_weblink")) else None)

    def _get_extra_summary(self, raw: Any, current_summary: str) -> Optional[str]:
        code_snips = [str(x) for x in as_list(safe_get(raw, "m_code_snippet")) if str(x).strip()]
        if code_snips and len(current_summary) < 600:
            return clean_text(code_snips[0])
        return None

    def _create_intrusion_set_object(self, objects, seen, raw, created, modified, summary, tlp_amber_id) -> Optional[str]:
        team = first_nonempty(safe_get(raw, "m_team"), safe_get(raw, "m_author"), safe_get(raw, "m_name"))
        if not team:
            return None
        tname = str(team).strip()
        actor = {
            "type": "intrusion-set", "spec_version": "2.1",
            "id": stix_id("intrusion-set", f"team:{tname}"),
            "created": created, "modified": modified, "name": tname,
            "description": summary if summary else None,
            "object_marking_refs": [tlp_amber_id],
        }
        actor = {k: v for k, v in actor.items() if v is not None}
        return add_obj(objects, seen, actor, uniq=("intrusion-set", f"team:{tname}"))

    def _get_infra_types(self, raw, content_types, network) -> List[str]:
        if "c2" in content_types:
            return ["command-and-control"]
        if network and str(network).lower() == "onion":
            return ["anonymization"]
        return ["unknown"]

    def _get_report_custom_fields(self, raw: Any) -> Dict[str, Any]:
        return {"x_orion_platform": str(safe_get(raw, "m_platform")) if safe_get(raw, "m_platform") else None}


class _LeakConverter(_BaseConverter):
    type_label = "orion:leak"
    report_prefix = "leak"
    extra_url_fields = ["m_dumplink", "m_websites"]

    def _get_title(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_title"), safe_get(raw, "m_url"), safe_get(raw, "m_base_url"), "Leak - unknown title"))

    def _create_victim_identities(self, objects, seen, raw, created, modified, tlp_amber_id, location_refs) -> List[str]:
        industries = [str(x).strip() for x in as_list(safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else None
        refs = []
        for org in as_list(safe_get(raw, "m_org")) + as_list(safe_get(raw, "m_company_name")):
            name = str(org).strip()
            if not name:
                continue
            ident = {
                "type": "identity", "spec_version": "2.1",
                "id": stix_id("identity", f"victim:{name}"),
                "created": created, "modified": modified, "name": name,
                "identity_class": "organization",
                "sectors": [sector] if sector else None,
                "object_marking_refs": [tlp_amber_id],
            }
            ident = {k: v for k, v in ident.items() if v is not None}
            ref = add_obj(objects, seen, ident, uniq=("identity", f"victim:{name}"))
            refs.append(ref)
            for lref in location_refs:
                rel = {"type": "relationship", "spec_version": "2.1",
                       "id": stix_id("relationship", f"{ref}|located-at|{lref}"),
                       "created": created, "modified": modified,
                       "relationship_type": "located-at", "source_ref": ref, "target_ref": lref,
                       "object_marking_refs": [tlp_amber_id]}
                add_obj(objects, seen, rel, uniq=("relationship", f"{ref}|located-at|{lref}"))
        return refs

    def _create_intrusion_set_object(self, objects, seen, raw, created, modified, summary, tlp_amber_id) -> Optional[str]:
        team = first_nonempty(safe_get(raw, "m_team"), safe_get(raw, "m_author"))
        if not team:
            return None
        tname = str(team).strip()
        actor = {
            "type": "intrusion-set", "spec_version": "2.1",
            "id": stix_id("intrusion-set", f"team:{tname}"),
            "created": created, "modified": modified, "name": tname,
            "description": summary if summary else None,
            "object_marking_refs": [tlp_amber_id],
        }
        actor = {k: v for k, v in actor.items() if v is not None}
        return add_obj(objects, seen, actor, uniq=("intrusion-set", f"team:{tname}"))

    def _get_infra_types(self, raw, content_types, network) -> List[str]:
        types = ["unknown"]
        if network and str(network).lower() == "onion":
            types = ["anonymization"]
        if "ransomware" in content_types:
            types = ["command-and-control"]
        return types

    def _get_infra_name(self, raw, title) -> str:
        return str(first_nonempty(safe_get(raw, "m_team"), title, "Leak infrastructure"))

    def _get_report_custom_fields(self, raw: Any) -> Dict[str, Any]:
        dump_links = as_list(safe_get(raw, "m_dumplink"))
        return {
            "x_orion_platform": str(safe_get(raw, "m_platform")) if safe_get(raw, "m_platform") else None,
            "x_orion_dumplink_count": str(len(dump_links)) if dump_links else None,
        }


class _SocialConverter(_BaseConverter):
    type_label = "orion:social"
    report_prefix = "social"

    def _get_title(self, raw: Any) -> str:
        return str(first_nonempty(
            safe_get(raw, "m_title"),
            safe_get(raw, "m_url"),
            safe_get(raw, "m_channel_url"),
            "Social - unknown title",
        ))

    def _get_url(self, raw: Any) -> Optional[str]:
        return first_nonempty(safe_get(raw, "m_message_sharable_link"), safe_get(raw, "m_channel_url"), safe_get(raw, "m_url"))

    def _get_summary_source(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_content"), safe_get(raw, "m_important_content"), safe_get(raw, "m_meta_description"), ""))

    def _create_author_identity_object(self, objects, seen, raw, created, modified, tlp_amber_id) -> Optional[str]:
        author = first_nonempty(safe_get(raw, "m_author"), safe_get(raw, "m_username"))
        if not author:
            return None
        author_name = str(author[0]).strip() if isinstance(author, list) else str(author).strip()
        if not author_name:
            return None
        ident = {
            "type": "identity", "spec_version": "2.1",
            "id": stix_id("identity", f"author:{author_name}"),
            "created": created, "modified": modified, "name": author_name,
            "identity_class": "individual", "object_marking_refs": [tlp_amber_id],
        }
        return add_obj(objects, seen, ident, uniq=("identity", f"author:{author_name}"))

    def _get_infra_name(self, raw, title) -> str:
        return str(first_nonempty(safe_get(raw, "m_platform"), title, "Social infrastructure"))

    def _add_extra_scos(self, objects, seen, sco_refs: List[str], raw: Any) -> None:
        social_profiles = [str(x).strip() for x in as_list(safe_get(raw, "m_social_media_profiles")) if str(x).strip()]
        xmpp_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_xmpp_addresses")) if str(x).strip()]
        crypto_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_crypto_address")) if str(x).strip()]
        user_agents = [str(x).strip() for x in as_list(safe_get(raw, "m_user_agents")) if str(x).strip()]
        for x in xmpp_vals:
            sco_refs.append(add_obj(objects, seen, {"type": "x-mpp-addr", "id": sco_id("x-mpp-addr", x), "value": x}, uniq=("x-mpp-addr", x)))
        for c in crypto_vals:
            sco_refs.append(add_obj(objects, seen, {"type": "cryptocurrency-wallet", "id": sco_id("cryptocurrency-wallet", c), "address": c}, uniq=("cryptocurrency-wallet", c)))
        for ua in user_agents:
            sco_refs.append(add_obj(objects, seen, {"type": "user-agent", "id": sco_id("user-agent", ua), "string": ua}, uniq=("user-agent", ua)))

    def _add_extra_note_content(self, content_note: Dict, raw: Any) -> None:
        hashtags = sorted(set(str(x).strip().lstrip("#") for x in as_list(safe_get(raw, "m_hashtag")) if str(x).strip()))
        mentions = sorted(set(str(x).strip().lstrip("@") for x in as_list(safe_get(raw, "m_mention")) if str(x).strip()))
        if hashtags:
            content_note["hashtags"] = hashtags
        if mentions:
            content_note["mentions"] = mentions

    def _get_external_references(self, raw, url, base_url) -> Optional[List[Dict]]:
        refs = super()._get_external_references(raw, url, base_url) or []
        if safe_get(raw, "m_message_sharable_link"):
            refs.append({"source_name": "share_link", "url": str(safe_get(raw, "m_message_sharable_link"))})
        return refs or None

    def _get_report_custom_fields(self, raw: Any) -> Dict[str, Any]:
        return {
            "x_orion_platform": str(safe_get(raw, "m_platform")) if safe_get(raw, "m_platform") else None,
            "x_orion_post_comments_count": str(safe_get(raw, "m_post_comments_count")) if safe_get(raw, "m_post_comments_count") else None,
        }


class _GeneralConverter(_BaseConverter):
    parse_ts_func = staticmethod(parse_ts_general)

    def _get_title(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_title"), safe_get(raw, "m_url"), safe_get(raw, "m_base_url"), "General - unknown title"))

    def _add_type_specific_labels(self, labels: Set[str], raw: Any, network: Optional[Any], platform: Optional[Any]) -> None:
        super()._add_type_specific_labels(labels, raw, network, platform)
        for h in as_list(safe_get(raw, "m_hashtag")):
            sh = str(h).strip().lstrip("#").lower()
            if sh:
                labels.add(f"tag:{sh}")

    def _create_victim_identities(self, objects, seen, raw, created, modified, tlp_amber_id, location_refs) -> List[str]:
        industries = [str(x).strip() for x in as_list(safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else None
        refs = []
        for org in as_list(safe_get(raw, "m_org")) + as_list(safe_get(raw, "m_company_name")):
            name = str(org).strip()
            if not name:
                continue
            ident = {
                "type": "identity", "spec_version": "2.1",
                "id": stix_id("identity", f"victim:{name}"),
                "created": created, "modified": modified, "name": name,
                "identity_class": "organization",
                "sectors": [sector] if sector else None,
                "object_marking_refs": [tlp_amber_id],
            }
            ident = {k: v for k, v in ident.items() if v is not None}
            ref = add_obj(objects, seen, ident, uniq=("identity", f"victim:{name}"))
            refs.append(ref)
            for lref in location_refs:
                rel = {"type": "relationship", "spec_version": "2.1",
                       "id": stix_id("relationship", f"{ref}|located-at|{lref}"),
                       "created": created, "modified": modified,
                       "relationship_type": "located-at", "source_ref": ref, "target_ref": lref,
                       "object_marking_refs": [tlp_amber_id]}
                add_obj(objects, seen, rel, uniq=("relationship", f"{ref}|located-at|{lref}"))
        return refs

    def _create_intrusion_set_object(self, objects, seen, raw, created, modified, summary, tlp_amber_id) -> Optional[str]:
        team = first_nonempty(safe_get(raw, "m_team"), safe_get(raw, "m_author"))
        if not team:
            return None
        tname = str(team).strip()
        actor = {
            "type": "intrusion-set", "spec_version": "2.1",
            "id": stix_id("intrusion-set", f"team:{tname}"),
            "created": created, "modified": modified, "name": tname,
            "description": summary if summary else None,
            "object_marking_refs": [tlp_amber_id],
        }
        actor = {k: v for k, v in actor.items() if v is not None}
        return add_obj(objects, seen, actor, uniq=("intrusion-set", f"team:{tname}"))

    def _get_infra_types(self, raw, content_types, network) -> List[str]:
        types = ["unknown"]
        if network and str(network).lower() == "onion":
            types = ["anonymization"]
        if "darkweb" in content_types:
            types = ["hosting-malware"]
        return types

    def _get_infra_name(self, raw, title) -> str:
        return str(first_nonempty(safe_get(raw, "m_team"), title, "Observed infrastructure"))


class _ChatConverter(_BaseConverter):
    type_label = "orion:chat"
    report_prefix = "chat"
    created_ts_fields = ["m_creation_date", "m_update_date", "m_message_date"]

    def _get_title(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_caption"), safe_get(raw, "m_content"), "Chat - unknown title"))

    def _get_url(self, raw: Any) -> str:
        return first_nonempty(safe_get(raw, "m_message_sharable_link"), safe_get(raw, "m_media_url"))

    def _get_summary_source(self, raw: Any) -> str:
        return str(first_nonempty(safe_get(raw, "m_content"), safe_get(raw, "m_media_caption"), ""))

    def _create_author_identity_object(self, objects, seen, raw, created, modified, tlp_amber_id) -> Optional[str]:
        sender = first_nonempty(safe_get(raw, "m_sender_username"), safe_get(raw, "m_users"), safe_get(raw, "m_author"))
        if not sender:
            return None
        sender_name = str(sender[0]).strip() if isinstance(sender, list) else str(sender).strip()
        if not sender_name:
            return None
        ident = {
            "type": "identity", "spec_version": "2.1",
            "id": stix_id("identity", f"sender:{sender_name}"),
            "created": created, "modified": modified, "name": sender_name,
            "identity_class": "individual", "object_marking_refs": [tlp_amber_id],
        }
        return add_obj(objects, seen, ident, uniq=("identity", f"sender:{sender_name}"))

    def _get_infra_seed(self, raw, base_url, url, domain_vals) -> Optional[str]:
        channel_url = safe_get(raw, "m_channel_url")
        channel_id = safe_get(raw, "m_channel_id")
        return first_nonempty(channel_url, channel_id)

    def _get_infra_name(self, raw, title) -> str:
        return str(first_nonempty(safe_get(raw, "m_channel_name"), safe_get(raw, "m_channel_id"), safe_get(raw, "m_channel_url"), "Chat channel"))

    def _get_infra_types(self, raw, content_types, network) -> List[str]:
        platform = safe_get(raw, "m_platform")
        channel_url = safe_get(raw, "m_channel_url")
        if str(platform).strip().lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)):
            return ["communications"]
        return ["unknown"]

    def _add_extra_scos(self, objects, seen, sco_refs: List[str], raw: Any) -> None:
        user_agents = [str(x).strip() for x in as_list(safe_get(raw, "m_user_agents")) if str(x).strip()]
        for ua in user_agents:
            sco_refs.append(add_obj(objects, seen, {"type": "user-agent", "id": sco_id("user-agent", ua), "string": ua}, uniq=("user-agent", ua)))

    def _add_extra_note_content(self, content_note: Dict, raw: Any) -> None:
        hashtags = sorted(set(str(x).strip().lstrip("#") for x in as_list(safe_get(raw, "m_hashtag")) if str(x).strip()))
        mentions = sorted(set(str(x).strip() for x in as_list(safe_get(raw, "m_mention")) if str(x).strip()))
        if hashtags:
            content_note["hashtags"] = hashtags
        if mentions:
            content_note["mentions"] = mentions

    def _get_external_references(self, raw, url, base_url) -> Optional[List[Dict]]:
        refs = super()._get_external_references(raw, url, base_url) or []
        channel_url = safe_get(raw, "m_channel_url")
        if channel_url and channel_url != url:
            refs.append({"source_name": "channel_url", "url": str(channel_url)})
        if safe_get(raw, "m_message_id"):
            refs.append({"source_name": "message_id", "external_id": str(safe_get(raw, "m_message_id"))})
        return refs or None

    def _get_report_custom_fields(self, raw: Any) -> Dict[str, Any]:
        return {
            "x_orion_platform": str(safe_get(raw, "m_platform")) if safe_get(raw, "m_platform") else None,
            "x_orion_channel_id": str(safe_get(raw, "m_channel_id")) if safe_get(raw, "m_channel_id") else None,
            "x_orion_channel_name": str(safe_get(raw, "m_channel_name")) if safe_get(raw, "m_channel_name") else None,
            "x_orion_views": str(safe_get(raw, "m_views")) if safe_get(raw, "m_views") else None,
            "x_orion_sender_is_bot": bool(safe_get(raw, "m_sender_is_bot")) if safe_get(raw, "m_sender_is_bot") is not None else None,
            "x_orion_is_forwarded": bool(safe_get(raw, "m_is_forwarded")) if safe_get(raw, "m_is_forwarded") is not None else None,
            "x_orion_is_reply": bool(safe_get(raw, "m_is_reply")) if safe_get(raw, "m_is_reply") is not None else None,
            "x_orion_pinned": bool(safe_get(raw, "m_pinned")) if safe_get(raw, "m_pinned") is not None else None,
        }


class StixManager:
    __instance: Optional["StixManager"] = None

    def __init__(self):
        if StixManager.__instance is not None:
            raise Exception("This class is a singleton!")
        if search_model is None:
            self._search_model = None
        else:
            self._search_model = search_model.getInstance()
        self._defacement = _DefacementConverter()
        self._exploit = _ExploitConverter()
        self._leak = _LeakConverter()
        self._social = _SocialConverter()
        self._general = _GeneralConverter()
        self._chat = _ChatConverter()
        StixManager.__instance = self

    @staticmethod
    def get_instance() -> "StixManager":
        if StixManager.__instance is None:
            StixManager()
        return StixManager.__instance

    async def _fetch_and_convert(self, fetch: Callable[[], Awaitable[Any]], converter: _BaseConverter) -> Dict[str, Any]:
        raw = await fetch()
        raw = _to_attr_obj(raw)
        return converter.convert(raw)

    async def get_defacement_stix(self, doc_id: str) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_defacement_doc(doc_id), self._defacement)

    async def get_exploit_stix(self, doc_id: str, lang) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_exploit_doc(doc_id, lang), self._exploit)

    async def get_leak_stix(self, doc_id: str, lang) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_leak_doc(doc_id, lang), self._leak)

    async def get_social_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_social_doc(doc_id, lang), self._social)

    async def get_general_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_general_doc(doc_id, lang), self._general)

    async def get_chat_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(lambda: self._search_model.request_chat_doc(doc_id, lang), self._chat)

    def _convert_defacement(self, raw: Any) -> Dict[str, Any]:
        return self._defacement.convert(raw)

    def _convert_exploit(self, raw: Any) -> Dict[str, Any]:
        return self._exploit.convert(raw)

    def _convert_leak(self, raw: Any) -> Dict[str, Any]:
        return self._leak.convert(raw)

    def _convert_social(self, raw: Any) -> Dict[str, Any]:
        return self._social.convert(raw)

    def _convert_general(self, raw: Any) -> Dict[str, Any]:
        return self._general.convert(raw)

    def _convert_chat(self, raw: Any) -> Dict[str, Any]:
        return self._chat.convert(raw)