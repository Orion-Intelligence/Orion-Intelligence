from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import re
import uuid
from typing import Any, Dict, Optional, List, Set, Tuple, Callable, Awaitable

try:
    from orion.api.interactive.search_manager.search_model import search_model  # type: ignore
except Exception:  # pragma: no cover
    search_model = None  # type: ignore

@dataclass
class _AttrObj:
    __data: Dict[str, Any]

    def __getattr__(self, item: str) -> Any:
        try:
            return self.__data[item]
        except KeyError:
            raise AttributeError(item)

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
        if v is None or (isinstance(v, str) and not v.strip()) or (isinstance(v, list) and not v):
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
        return dt.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
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
        return dt.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
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

def add_obj(objects: List[Dict[str, Any]], seen: Dict[Tuple[str, str], str], obj: Dict[str, Any], uniq: Optional[Tuple[str, str]] = None) -> str:
    oid = obj["id"]
    if uniq is not None and (existing := seen.get(uniq)):
        return existing
    if uniq is not None:
        seen[uniq] = oid
    objects.append(obj)
    return oid

def ensure_tlp_markings(objects: List[Dict[str, Any]], seen: Dict[Tuple[str, str], str], created: str) -> Tuple[str, str]:
    amber = stix_id("marking-definition", "tlp:amber")
    red = stix_id("marking-definition", "tlp:red")
    add_obj(objects, seen, {"type": "marking-definition", "spec_version": "2.1", "id": amber, "created": created, "definition_type": "tlp", "definition": {"tlp": "amber"}}, uniq=("marking-definition", amber))
    add_obj(objects, seen, {"type": "marking-definition", "spec_version": "2.1", "id": red, "created": created, "definition_type": "tlp", "definition": {"tlp": "red"}}, uniq=("marking-definition", red))
    return amber, red

class _BaseConverter:
    def __init__(self):
        self.parse_ts_func = parse_ts_full
        self.report_prefix = ""
        self.specific_labels: List[str] = []
        self.extra_url_fields: List[str] = []
        self.has_actor = False
        self.has_victims = False
        self.has_created_by = False
        self.has_chat_like_scos = False
        self.is_social_like = False
        self.strip_mention_at = False
        self.meta_type = ""
        self.include_screenshot_external = False

    def convert(self, raw: Any) -> Dict[str, Any]:
        self.raw = _to_attr_obj(raw)
        self.parse_ts = self.parse_ts_func
        self.created = (self.parse_ts(safe_get(self.raw, "m_creation_date")) or self.parse_ts(safe_get(self.raw, "m_update_date"))) or now_ts()
        self.modified = self.parse_ts(safe_get(self.raw, "m_update_date")) or self.created
        if self.modified < self.created:
            self.modified = self.created
        self.objects: List[Dict[str, Any]] = []
        self.seen: Dict[Tuple[str, str], str] = {}
        self.tlp_amber_id, self.tlp_red_id = ensure_tlp_markings(self.objects, self.seen, self.created)
        self.title = self._get_title()
        self.summary = self._get_summary()
        self.doc_id = self._get_doc_id()
        self.url = self._get_url()
        self.base_url = safe_get(self.raw, "m_base_url")
        self.network = safe_get(self.raw, "m_network")
        self.platform = safe_get(self.raw, "m_platform")
        self.content_types = self._get_content_types()
        self.labels = sorted(self._get_labels())
        self.lang = self._get_lang()
        self.location_refs = self._create_locations()
        self.infra_ref = self._create_infra()
        self.actor_ref = self._create_actor() if self.has_actor else None
        self.victim_refs = self._create_victims() if self.has_victims else []
        self.created_by_ref = self._create_created_by() if self.has_created_by else None
        self._create_relationships()
        self.domain_vals = self._get_domains()
        self.url_vals = self._get_urls()
        self.ip_vals = self._get_ips()
        self.email_vals = self._get_emails()
        self.asn_vals = self._get_asns()
        self.file_path_vals = self._get_file_paths()
        self.sco_refs = self._create_scos()
        self.observed_ref = self._create_observed() if self.sco_refs else None
        self.indicator_refs = self._create_indicators()
        self.vuln_refs = self._create_vulnerabilities()
        self.attack_refs = self._create_attack_patterns()
        self.sensitive = self._get_sensitive()
        self.note_content = self._get_note_content()
        self.note_ref = self._create_note() if self.note_content else None
        self.external_refs = self._get_external_refs()
        self.report_object_refs = self._get_report_objects()
        self.report = self._create_report()
        add_obj(self.objects, self.seen, self.report, uniq=("report", self.report["id"]))
        return {"type": "bundle", "id": stix_id("bundle", self.report["id"]), "spec_version": "2.1", "objects": self.objects}

    def _get_title(self) -> str:
        return str(first_nonempty(safe_get(self.raw, "m_title"), self.url, self.base_url, "Unknown title"))

    def _get_summary(self) -> str:
        src = first_nonempty(safe_get(self.raw, "m_important_content"), safe_get(self.raw, "m_content"), safe_get(self.raw, "m_meta_description"), "")
        summary = clean_text(str(src))
        return summary[:4000] + "…" if len(summary) > 4000 else summary

    def _get_doc_id(self) -> str:
        return str(first_nonempty(safe_get(self.raw, "m_document_id"), safe_get(self.raw, "m_hash"), self.url, self.base_url, self.title))

    def _get_url(self) -> Optional[str]:
        return first_nonempty(safe_get(self.raw, "m_url"), self.base_url)

    def _get_content_types(self) -> Set[str]:
        return {str(x).strip().lower() for x in as_list(safe_get(self.raw, "m_content_type")) + as_list(safe_get(self.raw, "content_type")) if str(x).strip()}

    def _get_labels(self) -> Set[str]:
        labels = set(self.content_types)
        if self.network:
            labels.add(str(self.network).strip().lower())
        if self.platform:
            labels.add(f"platform:{str(self.platform).strip().lower()}")
        labels.update(self.specific_labels)
        return labels

    def _get_lang(self) -> Optional[str]:
        langs = [str(x).strip() for x in as_list(safe_get(self.raw, "m_language")) if str(x).strip()]
        return langs[0] if len(langs) == 1 else None

    def _create_locations(self) -> List[str]:
        refs = []
        for c in as_list(safe_get(self.raw, "m_country")) or as_list(safe_get(self.raw, "m_location")):
            cc = str(c).strip()
            if cc:
                loc = {"type": "location", "spec_version": "2.1", "id": stix_id("location", f"country:{cc}"), "created": self.created, "modified": self.modified, "name": cc, "country": cc, "object_marking_refs": [self.tlp_amber_id]}
                refs.append(add_obj(self.objects, self.seen, loc, uniq=("location", f"country:{cc}")))
        return refs

    def _create_infra(self) -> Optional[str]:
        seed = first_nonempty(self.base_url, self.url, self.domain_vals[0] if self.domain_vals else None)
        if not seed:
            return None
        types = self._get_infra_types()
        name = self._get_infra_name()
        desc = self.summary or None
        infra = {"type": "infrastructure", "spec_version": "2.1", "id": stix_id("infrastructure", f"infra:{seed}"), "created": self.created, "modified": self.modified, "name": name, "description": desc, "infrastructure_types": types, "first_seen": self.created, "last_seen": self.modified, "labels": self.labels, "object_marking_refs": [self.tlp_amber_id], "x_orion_network": str(self.network) if self.network else None}
        infra = {k: v for k, v in infra.items() if v is not None}
        return add_obj(self.objects, self.seen, infra, uniq=("infrastructure", f"infra:{seed}"))

    def _get_infra_types(self) -> List[str]:
        return ["unknown"]

    def _get_infra_name(self) -> str:
        return self.title

    def _create_actor(self) -> Optional[str]:
        team = first_nonempty(safe_get(self.raw, "m_team"), safe_get(self.raw, "m_author"), safe_get(self.raw, "m_name"))
        if not team:
            return None
        tname = str(team).strip()
        if not tname:
            return None
        actor = {"type": "intrusion-set", "spec_version": "2.1", "id": stix_id("intrusion-set", f"team:{tname}"), "created": self.created, "modified": self.modified, "name": tname, "description": self.summary or None, "object_marking_refs": [self.tlp_amber_id]}
        actor = {k: v for k, v in actor.items() if v is not None}
        return add_obj(self.objects, self.seen, actor, uniq=("intrusion-set", f"team:{tname}"))

    def _create_victims(self) -> List[str]:
        refs = []
        sector = self._get_sector()
        for org in as_list(safe_get(self.raw, "m_org")) + as_list(safe_get(self.raw, "m_company_name")):
            name = str(org).strip()
            if name:
                ident = {"type": "identity", "spec_version": "2.1", "id": stix_id("identity", f"victim:{name}"), "created": self.created, "modified": self.modified, "name": name, "identity_class": "organization", "sectors": [sector] if sector else None, "object_marking_refs": [self.tlp_amber_id]}
                ident = {k: v for k, v in ident.items() if v is not None}
                refs.append(add_obj(self.objects, self.seen, ident, uniq=("identity", f"victim:{name}")))
        return refs

    def _get_sector(self) -> Optional[str]:
        industries = [str(x).strip() for x in as_list(safe_get(self.raw, "m_industry")) if str(x).strip()]
        return industries[0] if industries else None

    def _create_created_by(self) -> Optional[str]:
        author = first_nonempty(safe_get(self.raw, "m_author"), safe_get(self.raw, "m_username"), safe_get(self.raw, "m_sender_username"))
        if not author:
            return None
        name = str(author[0]).strip() if isinstance(author, list) else str(author).strip()
        if not name:
            return None
        ident = {"type": "identity", "spec_version": "2.1", "id": stix_id("identity", f"author:{name}"), "created": self.created, "modified": self.modified, "name": name, "identity_class": "individual", "object_marking_refs": [self.tlp_amber_id]}
        return add_obj(self.objects, self.seen, ident, uniq=("identity", f"author:{name}"))

    def _create_relationships(self):
        if self.actor_ref and self.infra_ref:
            rel = {"type": "relationship", "spec_version": "2.1", "id": stix_id("relationship", f"{self.actor_ref}|uses|{self.infra_ref}"), "created": self.created, "modified": self.modified, "relationship_type": "uses", "source_ref": self.actor_ref, "target_ref": self.infra_ref, "object_marking_refs": [self.tlp_amber_id]}
            add_obj(self.objects, self.seen, rel, uniq=("relationship", f"{self.actor_ref}|uses|{self.infra_ref}"))
        for vref in self.victim_refs:
            for lref in self.location_refs:
                rel = {"type": "relationship", "spec_version": "2.1", "id": stix_id("relationship", f"{vref}|located-at|{lref}"), "created": self.created, "modified": self.modified, "relationship_type": "located-at", "source_ref": vref, "target_ref": lref, "object_marking_refs": [self.tlp_amber_id]}
                add_obj(self.objects, self.seen, rel, uniq=("relationship", f"{vref}|located-at|{lref}"))

    def _get_domains(self) -> List[str]:
        return sorted({str(x).strip() for x in as_list(safe_get(self.raw, "m_domain")) if str(x).strip()})

    def _get_urls(self) -> List[str]:
        vals = {str(x).strip() for x in as_list(safe_get(self.raw, "m_url")) if str(x).strip()}
        for x in as_list(safe_get(self.raw, "m_encoded_urls")):
            xs = str(x).strip()
            if xs.startswith(("http://", "https://")):
                vals.add(xs)
        for field in self.extra_url_fields:
            for x in as_list(safe_get(self.raw, field)):
                xs = str(x).strip()
                if xs.startswith(("http://", "https://")):
                    vals.add(xs)
        if self.url:
            vals.add(str(self.url))
        return sorted(vals)

    def _get_ips(self) -> List[str]:
        return sorted({str(x).strip() for x in as_list(safe_get(self.raw, "m_ip")) if str(x).strip()})

    def _get_emails(self) -> List[str]:
        return sorted({str(x).strip() for x in as_list(safe_get(self.raw, "m_email")) if str(x).strip()})

    def _get_asns(self) -> List[str]:
        return sorted({a for a in (str(x).strip().upper().lstrip("AS") for x in as_list(safe_get(self.raw, "m_asns")) if str(x).strip()) if a.isdigit()})

    def _get_file_paths(self) -> List[str]:
        return sorted({str(x).strip() for x in as_list(safe_get(self.raw, "m_file_paths")) if str(x).strip()})

    def _create_scos(self) -> List[str]:
        refs = []
        for u in self.url_vals:
            refs.append(add_obj(self.objects, self.seen, {"type": "url", "id": sco_id("url", u), "value": u}, uniq=("url", u)))
        for d in self.domain_vals:
            refs.append(add_obj(self.objects, self.seen, {"type": "domain-name", "id": sco_id("domain-name", d), "value": d}, uniq=("domain-name", d)))
        for ip in self.ip_vals:
            typ = "ipv6-addr" if ":" in ip else "ipv4-addr"
            refs.append(add_obj(self.objects, self.seen, {"type": typ, "id": sco_id(typ, ip), "value": ip}, uniq=(typ, ip)))
        for e in self.email_vals:
            refs.append(add_obj(self.objects, self.seen, {"type": "email-addr", "id": sco_id("email-addr", e.lower()), "value": e}, uniq=("email-addr", e.lower())))
        for a in self.asn_vals:
            refs.append(add_obj(self.objects, self.seen, {"type": "autonomous-system", "id": sco_id("autonomous-system", a), "number": int(a)}, uniq=("autonomous-system", a)))
        for p in self.file_path_vals:
            refs.append(add_obj(self.objects, self.seen, {"type": "directory", "id": sco_id("directory", p), "path": p}, uniq=("directory", p)))
        if self.has_chat_like_scos:
            for x in sorted({str(x).strip() for x in as_list(safe_get(self.raw, "m_xmpp_addresses")) if str(x).strip()}):
                refs.append(add_obj(self.objects, self.seen, {"type": "x-mpp-addr", "id": sco_id("x-mpp-addr", x), "value": x}, uniq=("x-mpp-addr", x)))
            for c in sorted({str(c).strip() for c in as_list(safe_get(self.raw, "m_crypto_address")) if str(c).strip()}):
                refs.append(add_obj(self.objects, self.seen, {"type": "cryptocurrency-wallet", "id": sco_id("cryptocurrency-wallet", c), "address": c}, uniq=("cryptocurrency-wallet", c)))
            for ua in sorted({str(ua).strip() for ua in as_list(safe_get(self.raw, "m_user_agents")) if str(ua).strip()}):
                refs.append(add_obj(self.objects, self.seen, {"type": "user-agent", "id": sco_id("user-agent", ua), "string": ua}, uniq=("user-agent", ua)))
        return refs

    def _create_observed(self) -> Optional[str]:
        if not self.sco_refs:
            return None
        obs = {"type": "observed-data", "spec_version": "2.1", "id": stix_id("observed-data", f"{self.doc_id}|{self.created}"), "created": self.created, "modified": self.modified, "first_observed": self.created, "last_observed": self.modified, "number_observed": 1, "object_refs": sorted(self.sco_refs), "object_marking_refs": [self.tlp_amber_id]}
        return add_obj(self.objects, self.seen, obs, uniq=("observed-data", obs["id"]))

    def _create_indicators(self) -> List[str]:
        refs = []
        def add(name: str, pattern: str, types: List[str]):
            ind = {"type": "indicator", "spec_version": "2.1", "id": stix_id("indicator", f"{name}|{pattern}"), "created": self.created, "modified": self.modified, "name": name, "description": self.summary or None, "indicator_types": types, "pattern_type": "stix", "pattern": pattern, "valid_from": self.created, "labels": self.labels, "object_marking_refs": [self.tlp_amber_id]}
            ind = {k: v for k, v in ind.items() if v is not None}
            refs.append(add_obj(self.objects, self.seen, ind, uniq=("indicator", ind["id"])))
        if self.domain_vals:
            add("Domains", f"[domain-name:value IN ({', '.join(f'''{escape_pat(v)}''' for v in self.domain_vals)})]", ["malicious-activity"])
        if self.url_vals:
            add("URLs", f"[url:value IN ({', '.join(f'''{escape_pat(v)}''' for v in self.url_vals)})]", ["malicious-activity"])
        if self.ip_vals:
            v4 = [ip for ip in self.ip_vals if ":" not in ip]
            v6 = [ip for ip in self.ip_vals if ":" in ip]
            if v4:
                add("IPv4", f"[ipv4-addr:value IN ({', '.join(f'''{escape_pat(ip)}''' for ip in v4)})]", ["malicious-activity"])
            if v6:
                add("IPv6", f"[ipv6-addr:value IN ({', '.join(f'''{escape_pat(ip)}''' for ip in v6)})]", ["malicious-activity"])
        if self.email_vals:
            add("Emails", f"[email-addr:value IN ({', '.join(f'''{escape_pat(e)}''' for e in self.email_vals)})]", ["malicious-activity"])
        for rule in (str(r).strip() for r in as_list(safe_get(self.raw, "m_yara_rule")) if str(r).strip()):
            yara = {"type": "indicator", "spec_version": "2.1", "id": stix_id("indicator", f"yara|{sha256(rule)}"), "created": self.created, "modified": self.modified, "name": "YARA Rule", "pattern_type": "yara", "pattern": rule, "valid_from": self.created, "labels": self.labels, "object_marking_refs": [self.tlp_amber_id]}
            refs.append(add_obj(self.objects, self.seen, yara, uniq=("indicator", yara["id"])))
        return refs

    def _create_vulnerabilities(self) -> List[str]:
        refs = []
        for token in {str(c).strip().upper() for c in as_list(safe_get(self.raw, "m_cve")) if str(c).strip()}:
            if token.startswith("CVE-"):
                src, url = "nvd", f"https://nvd.nist.gov/vuln/detail/{token}"
            elif token.startswith("CWE-"):
                num = token[4:]
                if num.isdigit():
                    src, url = "cwe", f"https://cwe.mitre.org/data/definitions/{num}.html"
                else:
                    continue
            else:
                continue
            vuln = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id("vulnerability", token), "created": self.created, "modified": self.modified, "name": token, "external_references": [{"source_name": src, "external_id": token, "url": url}], "object_marking_refs": [self.tlp_amber_id]}
            refs.append(add_obj(self.objects, self.seen, vuln, uniq=("vulnerability", token)))
        return refs

    def _create_attack_patterns(self) -> List[str]:
        refs = []
        tactics = {str(t).strip().lower().replace(" ", "-") for t in as_list(safe_get(self.raw, "m_enterprise_attack_tactics")) if str(t).strip()}
        techniques = {str(t).strip().upper() for t in as_list(safe_get(self.raw, "m_enterprise_attack_techniques")) if str(t).strip()}
        for tech in sorted({t for t in techniques if re.match(r"^T\d{4}(\.\d{3})?$", t)}):
            base = tech.split(".")[0]
            ap = {"type": "attack-pattern", "spec_version": "2.1", "id": stix_id("attack-pattern", tech), "created": self.created, "modified": self.modified, "name": tech, "external_references": [{"source_name": "mitre-attack", "external_id": tech, "url": f"https://attack.mitre.org/techniques/{base}/"}], "kill_chain_phases": [{"kill_chain_name": "mitre-attack", "phase_name": t} for t in sorted(tactics)] if tactics else None, "object_marking_refs": [self.tlp_amber_id]}
            ap = {k: v for k, v in ap.items() if v is not None}
            refs.append(add_obj(self.objects, self.seen, ap, uniq=("attack-pattern", tech)))
        return refs

    def _get_sensitive(self) -> Optional[Dict[str, List[Dict[str, str]]]]:
        sensitive = {}
        for cat, field in [("credit_cards", "m_credit_card"), ("us_passport", "m_us_passport"), ("au_abn", "m_au_abn"), ("us_bank_number", "m_us_bank_number")]:
            vals = {str(v).strip() for v in as_list(safe_get(self.raw, field)) if str(v).strip()}
            if vals:
                sensitive[cat] = [{"sha256": sha256(v), "last4": v[-4:] if len(v) >= 4 else v} for v in sorted(vals)]
        return sensitive if sensitive else None

    def _get_note_content(self) -> Optional[Dict[str, Any]]:
        content = {}
        if self.sensitive:
            content["sensitive_hashed"] = self.sensitive
        if self.is_social_like:
            hashtags = sorted({str(h).strip().lstrip("#") for h in as_list(safe_get(self.raw, "m_hashtag")) if str(h).strip()})
            if hashtags:
                content["hashtags"] = hashtags
            mentions = sorted({m.lstrip("@") if self.strip_mention_at else m for m in {str(m).strip() for m in as_list(safe_get(self.raw, "m_mention")) if str(m).strip()} if m})
            if mentions:
                content["mentions"] = mentions
        return content if content else None

    def _create_note(self) -> Optional[str]:
        if not self.note_content:
            return None
        if self.is_social_like:
            abstract = f"{self.meta_type} metadata (and sensitive hashed)"
            prefix = f"{self.meta_type.lower()}-meta"
        else:
            abstract = "Sensitive artifacts (hashed)"
            prefix = "sensitive"
        marking = [self.tlp_red_id] if self.sensitive else [self.tlp_amber_id]
        note = {"type": "note", "spec_version": "2.1", "id": stix_id("note", f"{prefix}|{self.doc_id}|{self.created}"), "created": self.created, "modified": self.modified, "abstract": abstract, "content": str(self.note_content), "object_marking_refs": marking}
        return add_obj(self.objects, self.seen, note, uniq=("note", note["id"]))

    def _get_external_refs(self) -> Optional[List[Dict[str, Any]]]:
        refs = []
        if self.url:
            refs.append({"source_name": "source", "url": str(self.url)})
        if self.base_url and self.base_url != self.url:
            refs.append({"source_name": "base_url", "url": str(self.base_url)})
        if h := safe_get(self.raw, "m_hash"):
            refs.append({"source_name": "content-hash", "external_id": str(h)})
        if s := safe_get(self.raw, "m_scrap_file"):
            refs.append({"source_name": "scraper", "external_id": str(s)})
        if self.include_screenshot_external and (ss := safe_get(self.raw, "m_screenshot")):
            refs.append({"source_name": "screenshot", "external_id": str(ss)})
        return refs or None

    def _get_report_objects(self) -> List[str]:
        refs = [r for r in (self.infra_ref, self.actor_ref, self.observed_ref, self.note_ref, self.created_by_ref) if r]
        refs.extend(self.location_refs + self.victim_refs + self.indicator_refs + self.vuln_refs + self.attack_refs)
        return refs

    def _create_report(self) -> Dict[str, Any]:
        report = {"type": "report", "spec_version": "2.1", "id": stix_id("report", f"{self.report_prefix}{self.doc_id}"), "created": self.created, "modified": self.modified, "name": self.title, "description": self.summary or None, "report_types": ["threat-report"], "published": self.created, "labels": self.labels, "lang": self.lang, "created_by_ref": self.created_by_ref, "external_references": self.external_refs, "object_refs": sorted(set(self.report_object_refs)), "object_marking_refs": [self.tlp_amber_id], "x_orion_doc_id": self.doc_id, "x_orion_network": str(self.network) if self.network else None, "x_orion_platform": str(self.platform) if self.platform else None}
        report.update(self._get_custom_report_fields())
        return {k: v for k, v in report.items() if v is not None}

    def _get_custom_report_fields(self) -> Dict[str, Any]:
        return {}

class _DefacementConverter(_BaseConverter):
    def __init__(self):
        super().__init__()
        self.report_prefix = "defacement:"
        self.specific_labels = ["orion:defacement"]
        self.extra_url_fields = ["m_source_url", "m_mirror_links"]

    def _get_content_types(self) -> Set[str]:
        ct = super()._get_content_types()
        if not ct:
            ct.add("defacement")
        return ct

    def _get_title(self) -> str:
        return str(first_nonempty(safe_get(self.raw, "m_title"), safe_get(self.raw, "m_url"), safe_get(self.raw, "m_base_url"), as_list(safe_get(self.raw, "m_mirror_links"))[0] if as_list(safe_get(self.raw, "m_mirror_links")) else None, str(safe_get(self.raw, "m_content") or "").splitlines()[0], "Defacement - unknown title"))

    def _get_url(self) -> Optional[str]:
        return first_nonempty(safe_get(self.raw, "m_url"), safe_get(self.raw, "m_base_url"), as_list(safe_get(self.raw, "m_source_url"))[0], as_list(safe_get(self.raw, "m_mirror_links"))[0])

    def _get_summary(self) -> str:
        src = first_nonempty(safe_get(self.raw, "m_content"), safe_get(self.raw, "m_important_content"), "")
        return clean_text(str(src))[:4000] + "…" if src else ""

    def _get_custom_report_fields(self) -> Dict[str, Any]:
        vector = str(first_nonempty(as_list(safe_get(self.raw, "m_ioc_type"))[0], as_list(safe_get(self.raw, "m_web_server"))[0], "Unknown"))
        mirrors = len(as_list(safe_get(self.raw, "m_mirror_links")))
        return {"x_orion_attack_vector": vector, "x_orion_mirror_links_count": str(mirrors) if mirrors else None}

class _ExploitConverter(_BaseConverter):
    def __init__(self):
        super().__init__()
        self.report_prefix = "exploit:"
        self.specific_labels = ["orion:exploit"]
        self.has_actor = True
        self.extra_url_fields = ["m_weblink"]

    def _get_title(self) -> str:
        return str(first_nonempty(safe_get(self.raw, "m_title"), safe_get(self.raw, "m_url"), as_list(safe_get(self.raw, "m_weblink"))[0], "Exploit - unknown title"))

    def _get_url(self) -> Optional[str]:
        return first_nonempty(safe_get(self.raw, "m_url"), as_list(safe_get(self.raw, "m_weblink"))[0])

    def _get_summary(self) -> str:
        summary = super()._get_summary()
        if len(summary) < 600:
            snippet = clean_text(as_list(safe_get(self.raw, "m_code_snippet"))[0] or "")
            if snippet:
                summary = (summary + "\n\n" + snippet) if summary else snippet
                if len(summary) > 4000:
                    summary = summary[:4000] + "…"
        return summary

    def _get_infra_types(self) -> List[str]:
        if "c2" in self.content_types:
            return ["command-and-control"]
        if str(self.network or "").lower() == "onion":
            return ["anonymization"]
        return ["unknown"]

    def _get_infra_name(self) -> str:
        return str(first_nonempty(self.title, safe_get(self.raw, "m_name"), "Exploit infrastructure"))

class _LeakConverter(_BaseConverter):
    def __init__(self):
        super().__init__()
        self.report_prefix = "leak:"
        self.specific_labels = ["orion:leak"]
        self.has_actor = True
        self.has_victims = True
        self.extra_url_fields = ["m_dumplink", "m_websites"]
        self.include_screenshot_external = True

    def _get_infra_types(self) -> List[str]:
        if "ransomware" in self.content_types:
            return ["command-and-control"]
        if str(self.network or "").lower() == "onion":
            return ["anonymization"]
        return ["unknown"]

    def _get_infra_name(self) -> str:
        return str(first_nonempty(safe_get(self.raw, "m_team"), self.title, "Leak infrastructure"))

    def _get_custom_report_fields(self) -> Dict[str, Any]:
        dumps = len(as_list(safe_get(self.raw, "m_dumplink")))
        return {"x_orion_dumplink_count": str(dumps) if dumps else None}

class _SocialConverter(_BaseConverter):
    def __init__(self):
        super().__init__()
        self.report_prefix = "social:"
        self.specific_labels = ["orion:social"]
        self.has_created_by = True
        self.extra_url_fields = ["m_social_media_profiles"]
        self.has_chat_like_scos = True
        self.is_social_like = True
        self.meta_type = "Social"
        self.strip_mention_at = True

    def _get_title(self) -> str:
        return str(first_nonempty(safe_get(self.raw, "m_title"), safe_get(self.raw, "m_url"), safe_get(self.raw, "m_channel_url"), "Social - unknown title"))

    def _get_url(self) -> Optional[str]:
        return first_nonempty(safe_get(self.raw, "m_message_sharable_link"), safe_get(self.raw, "m_channel_url"), safe_get(self.raw, "m_url"))

    def _get_summary(self) -> str:
        src = first_nonempty(safe_get(self.raw, "m_content"), safe_get(self.raw, "m_important_content"), safe_get(self.raw, "m_meta_description"), "")
        return clean_text(str(src))[:4000] + "…" if src else ""

    def _get_infra_types(self) -> List[str]:
        return ["anonymization"] if str(self.network or "").lower() == "onion" else ["unknown"]

    def _get_infra_name(self) -> str:
        return str(first_nonempty(self.platform, self.title, "Social infrastructure"))

    def _get_external_refs(self) -> Optional[List[Dict[str, Any]]]:
        refs = super()._get_external_refs() or []
        if share := safe_get(self.raw, "m_message_sharable_link"):
            refs.append({"source_name": "share_link", "url": str(share)})
        return refs or None

    def _get_custom_report_fields(self) -> Dict[str, Any]:
        return {"x_orion_post_comments_count": str(safe_get(self.raw, "m_post_comments_count")) if safe_get(self.raw, "m_post_comments_count") else None}

class _GeneralConverter(_BaseConverter):
    def __init__(self):
        super().__init__()
        self.parse_ts_func = parse_ts_general
        self.report_prefix = ""
        self.specific_labels = ["orion:general"]
        self.include_screenshot_external = True

    def _get_labels(self) -> Set[str]:
        labels = super()._get_labels()
        for p in as_list(safe_get(self.raw, "m_platform")):
            if sp := str(p).strip().lower():
                labels.add(f"platform:{sp}")
        for h in as_list(safe_get(self.raw, "m_hashtag")):
            if sh := str(h).strip().lstrip("#").lower():
                labels.add(f"tag:{sh}")
        return labels

    def _get_infra_types(self) -> List[str]:
        if "darkweb" in self.content_types:
            return ["hosting-malware"]
        return ["anonymization"] if str(self.network or "").lower() == "onion" else ["unknown"]

    def _get_infra_name(self) -> str:
        return str(first_nonempty(safe_get(self.raw, "m_team"), self.title, "Observed infrastructure"))

class _ChatConverter(_BaseConverter):
    def __init__(self):
        super().__init__()
        self.report_prefix = "chat:"
        self.specific_labels = ["orion:chat"]
        self.has_created_by = True
        self.extra_url_fields = ["m_weblink"]
        self.has_chat_like_scos = True
        self.is_social_like = True
        self.meta_type = "Chat"
        self.strip_mention_at = False

    def _get_title(self) -> str:
        return str(first_nonempty(safe_get(self.raw, "m_caption"), safe_get(self.raw, "m_content"), "Chat - unknown title"))

    def _get_url(self) -> Optional[str]:
        return first_nonempty(safe_get(self.raw, "m_message_sharable_link"), safe_get(self.raw, "m_media_url"))

    def _get_urls(self) -> List[str]:
        vals = set(super()._get_urls())
        channel_url = safe_get(self.raw, "m_channel_url")
        if channel_url:
            vals.add(str(channel_url))
        return sorted(vals)

    def _create_infra(self) -> Optional[str]:
        channel_url = safe_get(self.raw, "m_channel_url")
        channel_id = safe_get(self.raw, "m_channel_id")
        seed = first_nonempty(channel_url, channel_id)
        if not seed:
            return None
        types = ["communications"] if str(self.platform or "").lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)) else ["unknown"]
        name = str(first_nonempty(safe_get(self.raw, "m_channel_name"), channel_id, channel_url, "Chat channel"))
        infra = {"type": "infrastructure", "spec_version": "2.1", "id": stix_id("infrastructure", f"channel:{seed}"), "created": self.created, "modified": self.modified, "name": name, "description": self.summary or None, "infrastructure_types": types, "first_seen": self.created, "last_seen": self.modified, "labels": self.labels, "object_marking_refs": [self.tlp_amber_id], "x_orion_network": str(self.network) if self.network else None, "x_orion_channel_id": str(channel_id) if channel_id else None}
        infra = {k: v for k, v in infra.items() if v is not None}
        return add_obj(self.objects, self.seen, infra, uniq=("infrastructure", f"channel:{seed}"))

    def _get_external_refs(self) -> Optional[List[Dict[str, Any]]]:
        refs = super()._get_external_refs() or []
        channel_url = safe_get(self.raw, "m_channel_url")
        if channel_url and channel_url != self.url:
            refs.append({"source_name": "channel_url", "url": str(channel_url)})
        if msg_id := safe_get(self.raw, "m_message_id"):
            refs.append({"source_name": "message_id", "external_id": str(msg_id)})
        return refs or None

    def _get_custom_report_fields(self) -> Dict[str, Any]:
        return {k: v for k, v in {
            "x_orion_channel_id": str(safe_get(self.raw, "m_channel_id")) if safe_get(self.raw, "m_channel_id") else None,
            "x_orion_channel_name": str(safe_get(self.raw, "m_channel_name")) if safe_get(self.raw, "m_channel_name") else None,
            "x_orion_views": str(safe_get(self.raw, "m_views")) if safe_get(self.raw, "m_views") else None,
            "x_orion_sender_is_bot": bool(safe_get(self.raw, "m_sender_is_bot")) if safe_get(self.raw, "m_sender_is_bot") is not None else None,
            "x_orion_is_forwarded": bool(safe_get(self.raw, "m_is_forwarded")) if safe_get(self.raw, "m_is_forwarded") is not None else None,
            "x_orion_is_reply": bool(safe_get(self.raw, "m_is_reply")) if safe_get(self.raw, "m_is_reply") is not None else None,
            "x_orion_pinned": bool(safe_get(self.raw, "m_pinned")) if safe_get(self.raw, "m_pinned") is not None else None,
        }.items() if v is not None}

class StixManager:
    __instance: Optional["StixManager"] = None
    def __init__(self):
        if StixManager.__instance:
            raise Exception("Singleton")
        self._search_model = search_model.getInstance() if search_model else None
        self._defacement = _DefacementConverter()
        self._exploit = _ExploitConverter()
        self._leak = _LeakConverter()
        self._social = _SocialConverter()
        self._general = _GeneralConverter()
        self._chat = _ChatConverter()
        StixManager.__instance = self

    @staticmethod
    def get_instance() -> "StixManager":
        if not StixManager.__instance:
            StixManager()
        return StixManager.__instance

    async def _fetch_and_convert(self, fetch: Callable[[], Awaitable[Any]], converter: _BaseConverter) -> Dict[str, Any]:
        return converter.convert(_to_attr_obj(await fetch()))

    async def get_defacement_stix(self, doc_id: str) -> Dict[str, Any]:
        if not self._search_model:
            raise RuntimeError("Orion not installed")
        return await self._fetch_and_convert(lambda: self._search_model.request_defacement_doc(doc_id), self._defacement)

    async def get_exploit_stix(self, doc_id: str) -> Dict[str, Any]:
        if not self._search_model:
            raise RuntimeError("Orion not installed")
        return await self._fetch_and_convert(lambda: self._search_model.request_exploit_doc(doc_id), self._exploit)

    async def get_leak_stix(self, doc_id: str) -> Dict[str, Any]:
        if not self._search_model:
            raise RuntimeError("Orion not installed")
        return await self._fetch_and_convert(lambda: self._search_model.request_leak_doc(doc_id), self._leak)

    async def get_social_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if not self._search_model:
            raise RuntimeError("Orion not installed")
        return await self._fetch_and_convert(lambda: self._search_model.request_social_doc(doc_id, lang), self._social)

    async def get_general_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if not self._search_model:
            raise RuntimeError("Orion not installed")
        return await self._fetch_and_convert(lambda: self._search_model.request_general_doc(doc_id, lang), self._general)

    async def get_chat_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if not self._search_model:
            raise RuntimeError("Orion not installed")
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