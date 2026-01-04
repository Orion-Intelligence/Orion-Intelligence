from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import re
import uuid
from typing import Any, Dict, Optional, List, Set, Tuple, Callable, Awaitable

try:
    # Optional dependency (only required for the async fetch helpers in StixManager).
    from orion.api.interactive.search_manager.search_model import search_model  # type: ignore
except Exception:  # pragma: no cover
    search_model = None  # type: ignore

STIX_TEMPLATE = {"Title": "", "Date": "", "Network": "", "Country": "", "SUMMARY": "", "TRENDS": {"Dates": None, "Scale": None, "Impacted Region": None, "Sector": None, "Volume": None, }, "INSIGHTS": {"Breach Type": None, "Attack Vector": None, "Data Exposed": None, "MITRE ATT&CK TTPs": None, }, "CONCLUSION": ""}

@dataclass
class _AttrObj:
    """Simple attribute container used when raw data arrives as a dict."""
    __data: Dict[str, Any]

    def __getattr__(self, item: str) -> Any:
        try:
            return self.__data[item]
        except KeyError:
            raise AttributeError(item)

    def to_dict(self) -> Dict[str, Any]:
        return dict(self.__data)


def _to_attr_obj(raw: Any) -> Any:
    """Normalize raw data so attribute access works (m_* fields)."""
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
    """Base class for converters. Subclasses only provide the conversion body."""

    parse_ts_func: Callable[[Optional[str]], Optional[str]] = staticmethod(parse_ts_full)

    def convert(self, raw: Any) -> Dict[str, Any]:
        raise NotImplementedError


class _DefacementConverter(_BaseConverter):
    def convert(self, raw: Any) -> Dict[str, Any]:
        raw = _to_attr_obj(raw)
        parse_ts = parse_ts_full
        created = (parse_ts(safe_get(raw, "m_leak_date")) or parse_ts(safe_get(raw, "m_creation_date")) or parse_ts(
            safe_get(raw, "m_update_date")) or now_ts())
        modified = parse_ts(safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title = first_nonempty(
            safe_get(raw, "m_title"),
            safe_get(raw, "m_url"),
            safe_get(raw, "m_base_url"),
            (as_list(safe_get(raw, "m_mirror_links"))[0] if as_list(safe_get(raw, "m_mirror_links")) else None),
            (str(safe_get(raw, "m_content")).splitlines()[0] if safe_get(raw, "m_content") else None),
            "Defacement - unknown title", )
        title = str(title)

        url = first_nonempty(
            safe_get(raw, "m_url"),
            safe_get(raw, "m_base_url"),
            (as_list(safe_get(raw, "m_source_url"))[0] if as_list(safe_get(raw, "m_source_url")) else None),
            (as_list(safe_get(raw, "m_mirror_links"))[0] if as_list(safe_get(raw, "m_mirror_links")) else None), )
        base_url = safe_get(raw, "m_base_url")
        network = safe_get(raw, "m_network")
        platform = safe_get(raw, "m_platform")
        doc_id = first_nonempty(safe_get(raw, "m_document_id"), safe_get(raw, "m_hash"), url, base_url, title)

        content_src = first_nonempty(safe_get(raw, "m_content"), safe_get(raw, "m_important_content"), "")
        summary = clean_text(str(content_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        objects: List[Dict[str, Any]] = []
        seen: Dict[Tuple[str, str], str] = {}

        tlp_amber_id = stix_id("marking-definition", "tlp:amber")
        tlp_red_id = stix_id("marking-definition", "tlp:red")

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_amber_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "amber"}, },
            uniq=("marking-definition", "tlp:amber"))

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_red_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "red"}, },
            uniq=("marking-definition", "tlp:red"))

        content_types = set(
            str(x).strip().lower() for x in
                (as_list(safe_get(raw, "m_content_type")) + as_list(safe_get(raw, "content_type"))) if str(x).strip())
        if not content_types:
            content_types = {"defacement"}

        labels: Set[str] = set()
        for ct in sorted(content_types):
            labels.add(ct)
        if network:
            labels.add(str(network).strip().lower())
        if platform:
            labels.add(f"platform:{str(platform).strip().lower()}")
        labels.add("orion:defacement")

        langs = [str(x).strip() for x in as_list(safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None

        location_refs: List[str] = []
        for c in (as_list(safe_get(raw, "m_country")) or as_list(safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            loc = {"type": "location", "spec_version": "2.1", "id": stix_id(
                "location",
                f"country:{cc}"), "created": created, "modified": modified, "name": cc, "country": cc, "object_marking_refs": [
                tlp_amber_id], }
            location_refs.append(add_obj(objects, seen, loc, uniq=("location", f"country:{cc}")))

        domain_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_domain")) if str(x).strip()]
        url_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_url")) if str(x).strip()]
        ip_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_ip")) if str(x).strip()]
        email_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_email")) if str(x).strip()]
        asn_vals = [str(x).strip().upper().lstrip("AS") for x in as_list(safe_get(raw, "m_asns")) if str(x).strip()]
        file_paths = [str(x).strip() for x in as_list(safe_get(raw, "m_file_paths")) if str(x).strip()]
        encoded_urls = [str(x).strip() for x in as_list(safe_get(raw, "m_encoded_urls")) if str(x).strip()]
        mirror_links = [str(x).strip() for x in as_list(safe_get(raw, "m_mirror_links")) if str(x).strip()]
        source_urls = [str(x).strip() for x in as_list(safe_get(raw, "m_source_url")) if str(x).strip()]

        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)
        for ml in mirror_links:
            if ml.startswith(("http://", "https://")):
                url_vals.append(ml)
        for su in source_urls:
            if su.startswith(("http://", "https://")):
                url_vals.append(su)
        if url:
            url_vals.append(str(url))

        domain_vals = sorted(set(domain_vals))
        url_vals = sorted(set(url_vals))
        ip_vals = sorted(set(ip_vals))
        email_vals = sorted(set(email_vals))
        asn_vals = sorted(set([a for a in asn_vals if a.isdigit()]))
        file_paths = sorted(set(file_paths))

        infra_seed = first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_ref = None
        if infra_seed:
            infra = {"type": "infrastructure", "spec_version": "2.1", "id": stix_id(
                "infrastructure",
                f"infra:{infra_seed}"), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "infrastructure_types": [
                "unknown"], "first_seen": created, "last_seen": modified, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None, }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = add_obj(objects, seen, infra, uniq=("infrastructure", f"infra:{infra_seed}"))

        sco_refs: List[str] = []

        for u in url_vals:
            sco = {"type": "url", "id": sco_id("url", u), "value": u}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("url", u)))

        for d in domain_vals:
            sco = {"type": "domain-name", "id": sco_id("domain-name", d), "value": d}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("domain-name", d)))

        for ip in ip_vals:
            if ":" in ip:
                sco = {"type": "ipv6-addr", "id": sco_id("ipv6-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv6-addr", ip)))
            else:
                sco = {"type": "ipv4-addr", "id": sco_id("ipv4-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv4-addr", ip)))

        for e in email_vals:
            el = e.lower()
            sco = {"type": "email-addr", "id": sco_id("email-addr", el), "value": e}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("email-addr", el)))

        for a in asn_vals:
            sco = {"type": "autonomous-system", "id": sco_id("autonomous-system", a), "number": int(a)}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("autonomous-system", a)))

        for p in file_paths:
            sco = {"type": "directory", "id": sco_id("directory", p), "path": p}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("directory", p)))

        observed_ref = None
        if sco_refs:
            obs = {"type": "observed-data", "spec_version": "2.1", "id": stix_id(
                "observed-data",
                f"{doc_id}|{created}"), "created": created, "modified": modified, "first_observed": created, "last_observed": modified, "number_observed": 1, "object_refs": sorted(
                set(sco_refs)), "object_marking_refs": [tlp_amber_id], }
            observed_ref = add_obj(objects, seen, obs, uniq=("observed-data", obs["id"]))

        indicator_refs: List[str] = []

        def add_indicator(name: str, pattern: str, types: List[str]) -> str:
            ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"{name}|{pattern}"), "created": created, "modified": modified, "name": name, "description": summary if summary else None, "indicator_types": types, "pattern_type": "stix", "pattern": pattern, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            ind = {k: v for k, v in ind.items() if v is not None}
            return add_obj(objects, seen, ind, uniq=("indicator", ind["id"]))

        if domain_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in domain_vals)
            indicator_refs.append(add_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"]))

        if url_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in url_vals)
            indicator_refs.append(add_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"]))

        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v4)
                indicator_refs.append(add_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"]))
            if v6:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v6)
                indicator_refs.append(add_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"]))

        if email_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in email_vals)
            indicator_refs.append(add_indicator("Emails", f"[email-addr:value IN ({vals})]", ["malicious-activity"]))

        for yr in as_list(safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            yara_ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"yara|{sha256(rule)}"), "created": created, "modified": modified, "name": "YARA Rule", "pattern_type": "yara", "pattern": rule, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            indicator_refs.append(add_obj(objects, seen, yara_ind, uniq=("indicator", yara_ind["id"])))

        vuln_refs: List[str] = []
        for c in as_list(safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            if token.startswith("CVE-"):
                v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                    "vulnerability",
                    token), "created": created, "modified": modified, "name": token, "external_references": [
                    {"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}], "object_marking_refs": [
                    tlp_amber_id], }
                vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))
            elif token.startswith("CWE-"):
                cwe_num = token.replace("CWE-", "")
                if cwe_num.isdigit():
                    v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                        "vulnerability",
                        token), "created": created, "modified": modified, "name": token, "external_references": [
                        {"source_name": "cwe", "external_id": token, "url": f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"}], "object_marking_refs": [
                        tlp_amber_id], }
                    vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))

        attack_vector = first_nonempty(
            (as_list(safe_get(raw, "m_ioc_type"))[0] if as_list(safe_get(raw, "m_ioc_type")) else None),
            (as_list(safe_get(raw, "m_web_server"))[0] if as_list(safe_get(raw, "m_web_server")) else None),
            "Unknown", )
        attack_vector = str(attack_vector)

        inferred_ttps: List[str] = []
        if vuln_refs:
            inferred_ttps.append("T1190 (Exploit Public-Facing Application)")
        if "defacement" in content_types or "website" in summary.lower():
            inferred_ttps.append("T1491 (Defacement)")
        if not inferred_ttps:
            inferred_ttps = []

        tactics = [str(x).strip().lower().replace(" ", "-") for x in
            as_list(safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in as_list(safe_get(raw, "m_enterprise_attack_techniques")) if
            str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            if not re.match(r"^(T\d{4})(\.\d{3})?$", tech):
                continue
            base = tech.split(".")[0]
            ap: Dict[str, Any] = {"type": "attack-pattern", "spec_version": "2.1", "id": stix_id(
                "attack-pattern",
                tech), "created": created, "modified": modified, "name": tech, "external_references": [
                {"source_name": "mitre-attack", "external_id": tech, "url": f"https://attack.mitre.org/techniques/{base}/"}], "kill_chain_phases": [
                {"kill_chain_name": "mitre-attack", "phase_name": t} for t in
                sorted(set(tactics))] if tactics else None, "object_marking_refs": [tlp_amber_id], }
            ap = {k: v for k, v in ap.items() if v is not None}
            attack_refs.append(add_obj(objects, seen, ap, uniq=("attack-pattern", tech)))

        external_refs: List[Dict[str, Any]] = []
        if url:
            external_refs.append({"source_name": "source", "url": str(url)})
        if base_url and base_url != url:
            external_refs.append({"source_name": "base_url", "url": str(base_url)})
        if safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(safe_get(raw, "m_hash"))})
        if safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(safe_get(raw, "m_scrap_file"))})

        report_object_refs: List[str] = []
        for r in [infra_ref, observed_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report: Dict[str, Any] = {"type": "report", "spec_version": "2.1", "id": stix_id(
            "report",
            f"defacement:{doc_id}"), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": [
            "threat-report"], "published": created, "labels": sorted(
            labels), "lang": lang, "external_references": external_refs or None, "object_refs": sorted(
            set(report_object_refs)), "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(
            doc_id), "x_orion_network": str(
            network) if network else None, "x_orion_attack_vector": attack_vector, "x_orion_mirror_links_count": str(
            len(mirror_links)) if mirror_links else None, }
        report = {k: v for k, v in report.items() if v is not None}
        add_obj(objects, seen, report, uniq=("report", report["id"]))

        bundle = {"type": "bundle", "id": stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": objects, }
        return bundle

    

class _ExploitConverter(_BaseConverter):
    def convert(self, raw: Any) -> Dict[str, Any]:
        raw = _to_attr_obj(raw)
        parse_ts = parse_ts_full
        created = (parse_ts(safe_get(raw, "m_creation_date")) or parse_ts(safe_get(raw, "m_update_date")) or parse_ts(
            safe_get(raw, "m_leak_date")) or now_ts())
        modified = parse_ts(safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title = str(
            first_nonempty(
                safe_get(raw, "m_title"),
                safe_get(raw, "m_url"),
                safe_get(raw, "m_weblink"),
                "Exploit - unknown title"))
        url = first_nonempty(
            safe_get(raw, "m_url"),
            (as_list(safe_get(raw, "m_weblink"))[0] if as_list(safe_get(raw, "m_weblink")) else None), )
        base_url = safe_get(raw, "m_base_url")
        network = safe_get(raw, "m_network")
        platform = safe_get(raw, "m_platform")
        doc_id = first_nonempty(safe_get(raw, "m_document_id"), safe_get(raw, "m_hash"), url, base_url, title)

        content_src = first_nonempty(safe_get(raw, "m_important_content"), safe_get(raw, "m_content"), "")
        summary = clean_text(str(content_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        code_snips = [str(x) for x in as_list(safe_get(raw, "m_code_snippet")) if str(x).strip()]
        if code_snips and len(summary) < 600:
            extra = clean_text(code_snips[0])
            if extra:
                summary = (summary + "\n\n" + extra) if summary else extra
                if len(summary) > 4000:
                    summary = summary[:4000] + "…"

        objects: List[Dict[str, Any]] = []
        seen: Dict[Tuple[str, str], str] = {}

        tlp_amber_id = stix_id("marking-definition", "tlp:amber")
        tlp_red_id = stix_id("marking-definition", "tlp:red")

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_amber_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "amber"}, },
            uniq=("marking-definition", "tlp:amber"))

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_red_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "red"}, },
            uniq=("marking-definition", "tlp:red"))

        content_types = set(
            str(x).strip().lower() for x in
                (as_list(safe_get(raw, "m_content_type")) + as_list(safe_get(raw, "content_type"))) if str(x).strip())

        labels: Set[str] = set()
        for ct in sorted(content_types):
            labels.add(ct)
        if network:
            labels.add(str(network).strip().lower())
        if platform:
            labels.add(f"platform:{str(platform).strip().lower()}")
        labels.add("orion:exploit")

        langs = [str(x).strip() for x in as_list(safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None

        location_refs: List[str] = []
        for c in (as_list(safe_get(raw, "m_country")) or as_list(safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            loc = {"type": "location", "spec_version": "2.1", "id": stix_id(
                "location",
                f"country:{cc}"), "created": created, "modified": modified, "name": cc, "country": cc, "object_marking_refs": [
                tlp_amber_id], }
            location_refs.append(add_obj(objects, seen, loc, uniq=("location", f"country:{cc}")))

        team = first_nonempty(safe_get(raw, "m_team"), safe_get(raw, "m_author"), safe_get(raw, "m_name"))
        actor_ref = None
        if team:
            tname = str(team).strip()
            if tname:
                actor = {"type": "intrusion-set", "spec_version": "2.1", "id": stix_id(
                    "intrusion-set",
                    f"team:{tname}"), "created": created, "modified": modified, "name": tname, "description": summary if summary else None, "object_marking_refs": [
                    tlp_amber_id], }
                actor = {k: v for k, v in actor.items() if v is not None}
                actor_ref = add_obj(objects, seen, actor, uniq=("intrusion-set", f"team:{tname}"))

        domain_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_domain")) if str(x).strip()]
        url_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_url")) if str(x).strip()]
        ip_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_ip")) if str(x).strip()]
        email_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_email")) if str(x).strip()]
        asn_vals = [str(x).strip().upper().lstrip("AS") for x in as_list(safe_get(raw, "m_asns")) if str(x).strip()]
        file_paths = [str(x).strip() for x in as_list(safe_get(raw, "m_file_paths")) if str(x).strip()]
        encoded_urls = [str(x).strip() for x in as_list(safe_get(raw, "m_encoded_urls")) if str(x).strip()]
        weblinks = [str(x).strip() for x in as_list(safe_get(raw, "m_weblink")) if str(x).strip()]

        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)
        for wl in weblinks:
            if wl.startswith(("http://", "https://")):
                url_vals.append(wl)
        if url:
            url_vals.append(str(url))

        domain_vals = sorted(set(domain_vals))
        url_vals = sorted(set(url_vals))
        ip_vals = sorted(set(ip_vals))
        email_vals = sorted(set(email_vals))
        asn_vals = sorted(set([a for a in asn_vals if a.isdigit()]))
        file_paths = sorted(set(file_paths))

        infra_seed = first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if "c2" in content_types:
                infra_types = ["command-and-control"]
            elif str(network).lower() == "onion":
                infra_types = ["anonymization"]
            infra = {"type": "infrastructure", "spec_version": "2.1", "id": stix_id(
                "infrastructure", f"infra:{infra_seed}"), "created": created, "modified": modified, "name": str(
                first_nonempty(
                    titled := title,
                    safe_get(raw, "m_name"),
                    "Exploit infrastructure")), "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None, }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = add_obj(objects, seen, infra, uniq=("infrastructure", f"infra:{infra_seed}"))

        sco_refs: List[str] = []

        for u in url_vals:
            sco = {"type": "url", "id": sco_id("url", u), "value": u}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("url", u)))

        for d in domain_vals:
            sco = {"type": "domain-name", "id": sco_id("domain-name", d), "value": d}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("domain-name", d)))

        for ip in ip_vals:
            if ":" in ip:
                sco = {"type": "ipv6-addr", "id": sco_id("ipv6-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv6-addr", ip)))
            else:
                sco = {"type": "ipv4-addr", "id": sco_id("ipv4-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv4-addr", ip)))

        for e in email_vals:
            el = e.lower()
            sco = {"type": "email-addr", "id": sco_id("email-addr", el), "value": e}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("email-addr", el)))

        for a in asn_vals:
            sco = {"type": "autonomous-system", "id": sco_id("autonomous-system", a), "number": int(a)}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("autonomous-system", a)))

        for p in file_paths:
            sco = {"type": "directory", "id": sco_id("directory", p), "path": p}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("directory", p)))

        observed_ref = None
        if sco_refs:
            obs = {"type": "observed-data", "spec_version": "2.1", "id": stix_id(
                "observed-data",
                f"{doc_id}|{created}"), "created": created, "modified": modified, "first_observed": created, "last_observed": modified, "number_observed": 1, "object_refs": sorted(
                set(sco_refs)), "object_marking_refs": [tlp_amber_id], }
            observed_ref = add_obj(objects, seen, obs, uniq=("observed-data", obs["id"]))

        indicator_refs: List[str] = []

        def add_indicator(name: str, pattern: str, types: List[str]) -> str:
            ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"{name}|{pattern}"), "created": created, "modified": modified, "name": name, "description": summary if summary else None, "indicator_types": types, "pattern_type": "stix", "pattern": pattern, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            ind = {k: v for k, v in ind.items() if v is not None}
            return add_obj(objects, seen, ind, uniq=("indicator", ind["id"]))

        if domain_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in domain_vals)
            indicator_refs.append(add_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"]))

        if url_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in url_vals)
            indicator_refs.append(add_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"]))

        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v4)
                indicator_refs.append(add_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"]))
            if v6:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v6)
                indicator_refs.append(add_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"]))

        if email_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in email_vals)
            indicator_refs.append(add_indicator("Emails", f"[email-addr:value IN ({vals})]", ["phishing"]))

        for yr in as_list(safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            yara_ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"yara|{sha256(rule)}"), "created": created, "modified": modified, "name": "YARA Rule", "pattern_type": "yara", "pattern": rule, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            indicator_refs.append(add_obj(objects, seen, yara_ind, uniq=("indicator", yara_ind["id"])))

        vuln_refs: List[str] = []
        for c in as_list(safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            if token.startswith("CVE-"):
                v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                    "vulnerability",
                    token), "created": created, "modified": modified, "name": token, "external_references": [
                    {"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}], "object_marking_refs": [
                    tlp_amber_id], }
                vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))
            elif token.startswith("CWE-"):
                cwe_num = token.replace("CWE-", "")
                if cwe_num.isdigit():
                    v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                        "vulnerability",
                        token), "created": created, "modified": modified, "name": token, "external_references": [
                        {"source_name": "cwe", "external_id": token, "url": f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"}], "object_marking_refs": [
                        tlp_amber_id], }
                    vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in
            as_list(safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in as_list(safe_get(raw, "m_enterprise_attack_techniques")) if
            str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            if not re.match(r"^(T\d{4})(\.\d{3})?$", tech):
                continue
            base = tech.split(".")[0]
            ap: Dict[str, Any] = {"type": "attack-pattern", "spec_version": "2.1", "id": stix_id(
                "attack-pattern",
                tech), "created": created, "modified": modified, "name": tech, "external_references": [
                {"source_name": "mitre-attack", "external_id": tech, "url": f"https://attack.mitre.org/techniques/{base}/"}], "kill_chain_phases": [
                {"kill_chain_name": "mitre-attack", "phase_name": t} for t in
                sorted(set(tactics))] if tactics else None, "object_marking_refs": [tlp_amber_id], }
            ap = {k: v for k, v in ap.items() if v is not None}
            attack_refs.append(add_obj(objects, seen, ap, uniq=("attack-pattern", tech)))

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        def add_sensitive(cat: str, values: List[Any]) -> None:
            vals = [str(v).strip() for v in values if str(v).strip()]
            if not vals:
                return
            out: List[Dict[str, str]] = []
            for v in sorted(set(vals)):
                last4 = v[-4:] if len(v) >= 4 else v
                out.append({"sha256": sha256(v), "last4": last4})
            sensitive[cat] = out

        add_sensitive("credit_cards", as_list(safe_get(raw, "m_credit_card")))
        add_sensitive("us_passport", as_list(safe_get(raw, "m_us_passport")))
        add_sensitive("au_abn", as_list(safe_get(raw, "m_au_abn")))
        add_sensitive("us_bank_number", as_list(safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive:
            note = {"type": "note", "spec_version": "2.1", "id": stix_id(
                "note",
                f"sensitive|{doc_id}|{created}"), "created": created, "modified": modified, "abstract": "Sensitive artifacts (hashed)", "content": str(
                sensitive), "object_marking_refs": [tlp_red_id], }
            note_ref = add_obj(objects, seen, note, uniq=("note", note["id"]))

        external_refs: List[Dict[str, Any]] = []
        if url:
            external_refs.append({"source_name": "source", "url": str(url)})
        if base_url and base_url != url:
            external_refs.append({"source_name": "base_url", "url": str(base_url)})
        if safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(safe_get(raw, "m_hash"))})
        if safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(safe_get(raw, "m_scrap_file"))})

        report_object_refs: List[str] = []
        for r in [actor_ref, infra_ref, observed_ref, note_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report: Dict[str, Any] = {"type": "report", "spec_version": "2.1", "id": stix_id(
            "report",
            f"exploit:{doc_id}"), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": [
            "threat-report"], "published": created, "labels": sorted(
            labels), "lang": lang, "external_references": external_refs or None, "object_refs": sorted(
            set(report_object_refs)), "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(
            doc_id), "x_orion_network": str(network) if network else None, "x_orion_platform": str(
            platform) if platform else None, }
        report = {k: v for k, v in report.items() if v is not None}
        add_obj(objects, seen, report, uniq=("report", report["id"]))

        bundle = {"type": "bundle", "id": stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": objects, }
        return bundle

    

class _LeakConverter(_BaseConverter):
    def convert(self, raw: Any) -> Dict[str, Any]:
        raw = _to_attr_obj(raw)
        parse_ts = parse_ts_full
        created = (parse_ts(safe_get(raw, "m_creation_date")) or parse_ts(safe_get(raw, "m_update_date")) or now_ts())
        modified = parse_ts(safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title = str(
            first_nonempty(
                safe_get(raw, "m_title"), safe_get(raw, "m_url"), safe_get(raw, "m_base_url"), "Leak - unknown title"))
        url = first_nonempty(safe_get(raw, "m_url"), safe_get(raw, "m_base_url"))
        base_url = safe_get(raw, "m_base_url")
        network = safe_get(raw, "m_network")
        platform = safe_get(raw, "m_platform")
        doc_id = first_nonempty(safe_get(raw, "m_document_id"), safe_get(raw, "m_hash"), url, base_url, title)

        content_src = first_nonempty(safe_get(raw, "m_important_content"), safe_get(raw, "m_content"), "")
        summary = clean_text(str(content_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        objects: List[Dict[str, Any]] = []
        seen: Dict[Tuple[str, str], str] = {}

        tlp_amber_id = stix_id("marking-definition", "tlp:amber")
        tlp_red_id = stix_id("marking-definition", "tlp:red")

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_amber_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "amber"}, },
            uniq=("marking-definition", "tlp:amber"))

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_red_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "red"}, },
            uniq=("marking-definition", "tlp:red"))

        content_types = set(
            str(x).strip().lower() for x in
                (as_list(safe_get(raw, "m_content_type")) + as_list(safe_get(raw, "content_type"))) if str(x).strip())

        labels: Set[str] = set()
        for ct in sorted(content_types):
            labels.add(ct)
        if network:
            labels.add(str(network).strip().lower())
        if platform:
            labels.add(f"platform:{str(platform).strip().lower()}")
        labels.add("orion:leak")

        langs = [str(x).strip() for x in as_list(safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None

        industries = [str(x).strip() for x in as_list(safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else None

        location_refs: List[str] = []
        for c in (as_list(safe_get(raw, "m_country")) or as_list(safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            loc = {"type": "location", "spec_version": "2.1", "id": stix_id(
                "location",
                f"country:{cc}"), "created": created, "modified": modified, "name": cc, "country": cc, "object_marking_refs": [
                tlp_amber_id], }
            location_refs.append(add_obj(objects, seen, loc, uniq=("location", f"country:{cc}")))

        victim_refs: List[str] = []
        for org in (as_list(safe_get(raw, "m_org")) + as_list(safe_get(raw, "m_company_name"))):
            name = str(org).strip()
            if not name:
                continue
            ident: Dict[str, Any] = {"type": "identity", "spec_version": "2.1", "id": stix_id(
                "identity",
                f"victim:{name}"), "created": created, "modified": modified, "name": name, "identity_class": "organization", "sectors": [
                sector] if sector else None, "object_marking_refs": [tlp_amber_id], }
            ident = {k: v for k, v in ident.items() if v is not None}
            victim_refs.append(add_obj(objects, seen, ident, uniq=("identity", f"victim:{name}")))

        for vref in victim_refs:
            for lref in location_refs:
                rel = {"type": "relationship", "spec_version": "2.1", "id": stix_id(
                    "relationship",
                    f"{vref}|located-at|{lref}"), "created": created, "modified": modified, "relationship_type": "located-at", "source_ref": vref, "target_ref": lref, "object_marking_refs": [
                    tlp_amber_id], }
                add_obj(objects, seen, rel, uniq=("relationship", f"{vref}|located-at|{lref}"))

        team = first_nonempty(safe_get(raw, "m_team"), safe_get(raw, "m_author"))
        actor_ref = None
        if team:
            tname = str(team).strip()
            if tname:
                actor = {"type": "intrusion-set", "spec_version": "2.1", "id": stix_id(
                    "intrusion-set",
                    f"team:{tname}"), "created": created, "modified": modified, "name": tname, "description": summary if summary else None, "object_marking_refs": [
                    tlp_amber_id], }
                actor = {k: v for k, v in actor.items() if v is not None}
                actor_ref = add_obj(objects, seen, actor, uniq=("intrusion-set", f"team:{tname}"))

        infra_seed = first_nonempty(
            base_url, url, (as_list(safe_get(raw, "m_domain"))[0] if as_list(safe_get(raw, "m_domain")) else None))
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(network).lower() == "onion":
                infra_types = ["anonymization"]
            if "ransomware" in content_types:
                infra_types = ["command-and-control"]
            infra = {"type": "infrastructure", "spec_version": "2.1", "id": stix_id(
                "infrastructure", f"infra:{infra_seed}"), "created": created, "modified": modified, "name": str(
                first_nonempty(
                    safe_get(raw, "m_team"),
                    title,
                    "Leak infrastructure")), "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None, }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = add_obj(objects, seen, infra, uniq=("infrastructure", f"infra:{infra_seed}"))

        if actor_ref and infra_ref:
            rel = {"type": "relationship", "spec_version": "2.1", "id": stix_id(
                "relationship",
                f"{actor_ref}|uses|{infra_ref}"), "created": created, "modified": modified, "relationship_type": "uses", "source_ref": actor_ref, "target_ref": infra_ref, "object_marking_refs": [
                tlp_amber_id], }
            add_obj(objects, seen, rel, uniq=("relationship", f"{actor_ref}|uses|{infra_ref}"))

        domain_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_domain")) if str(x).strip()]
        url_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_url")) if str(x).strip()]
        ip_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_ip")) if str(x).strip()]
        email_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_email")) if str(x).strip()]
        asn_vals = [str(x).strip().upper().lstrip("AS") for x in as_list(safe_get(raw, "m_asns")) if str(x).strip()]
        file_paths = [str(x).strip() for x in as_list(safe_get(raw, "m_file_paths")) if str(x).strip()]
        encoded_urls = [str(x).strip() for x in as_list(safe_get(raw, "m_encoded_urls")) if str(x).strip()]
        dump_links = [str(x).strip() for x in as_list(safe_get(raw, "m_dumplink")) if str(x).strip()]
        websites = [str(x).strip() for x in as_list(safe_get(raw, "m_websites")) if str(x).strip()]

        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)
        for dl in dump_links:
            if dl.startswith(("http://", "https://")):
                url_vals.append(dl)
        for ws in websites:
            if ws.startswith(("http://", "https://")):
                url_vals.append(ws)

        domain_vals = sorted(set(domain_vals))
        url_vals = sorted(set(url_vals))
        ip_vals = sorted(set(ip_vals))
        email_vals = sorted(set(email_vals))
        asn_vals = sorted(set([a for a in asn_vals if a.isdigit()]))
        file_paths = sorted(set(file_paths))

        sco_refs: List[str] = []

        for u in url_vals:
            sco = {"type": "url", "id": sco_id("url", u), "value": u}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("url", u)))

        for d in domain_vals:
            sco = {"type": "domain-name", "id": sco_id("domain-name", d), "value": d}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("domain-name", d)))

        for ip in ip_vals:
            if ":" in ip:
                sco = {"type": "ipv6-addr", "id": sco_id("ipv6-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv6-addr", ip)))
            else:
                sco = {"type": "ipv4-addr", "id": sco_id("ipv4-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv4-addr", ip)))

        for e in email_vals:
            el = e.lower()
            sco = {"type": "email-addr", "id": sco_id("email-addr", el), "value": e}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("email-addr", el)))

        for a in asn_vals:
            sco = {"type": "autonomous-system", "id": sco_id("autonomous-system", a), "number": int(a)}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("autonomous-system", a)))

        for p in file_paths:
            sco = {"type": "directory", "id": sco_id("directory", p), "path": p}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("directory", p)))

        observed_ref = None
        if sco_refs:
            obs = {"type": "observed-data", "spec_version": "2.1", "id": stix_id(
                "observed-data",
                f"{doc_id}|{created}"), "created": created, "modified": modified, "first_observed": created, "last_observed": modified, "number_observed": 1, "object_refs": sorted(
                set(sco_refs)), "object_marking_refs": [tlp_amber_id], }
            observed_ref = add_obj(objects, seen, obs, uniq=("observed-data", obs["id"]))

        indicator_refs: List[str] = []

        def add_indicator(name: str, pattern: str, types: List[str]) -> str:
            ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"{name}|{pattern}"), "created": created, "modified": modified, "name": name, "description": summary if summary else None, "indicator_types": types, "pattern_type": "stix", "pattern": pattern, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            ind = {k: v for k, v in ind.items() if v is not None}
            return add_obj(objects, seen, ind, uniq=("indicator", ind["id"]))

        if domain_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in domain_vals)
            indicator_refs.append(add_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"]))

        if url_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in url_vals)
            indicator_refs.append(add_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"]))

        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v4)
                indicator_refs.append(add_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"]))
            if v6:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v6)
                indicator_refs.append(add_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"]))

        if email_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in email_vals)
            indicator_refs.append(add_indicator("Emails", f"[email-addr:value IN ({vals})]", ["phishing"]))

        for yr in as_list(safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            yara_ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"yara|{sha256(rule)}"), "created": created, "modified": modified, "name": "YARA Rule", "pattern_type": "yara", "pattern": rule, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            indicator_refs.append(add_obj(objects, seen, yara_ind, uniq=("indicator", yara_ind["id"])))

        vuln_refs: List[str] = []
        for c in as_list(safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            if token.startswith("CVE-"):
                v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                    "vulnerability",
                    token), "created": created, "modified": modified, "name": token, "external_references": [
                    {"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}], "object_marking_refs": [
                    tlp_amber_id], }
                vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))
            elif token.startswith("CWE-"):
                cwe_num = token.replace("CWE-", "")
                if cwe_num.isdigit():
                    v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                        "vulnerability",
                        token), "created": created, "modified": modified, "name": token, "external_references": [
                        {"source_name": "cwe", "external_id": token, "url": f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"}], "object_marking_refs": [
                        tlp_amber_id], }
                    vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in
            as_list(safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in as_list(safe_get(raw, "m_enterprise_attack_techniques")) if
            str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            if not re.match(r"^(T\d{4})(\.\d{3})?$", tech):
                continue
            base = tech.split(".")[0]
            ap: Dict[str, Any] = {"type": "attack-pattern", "spec_version": "2.1", "id": stix_id(
                "attack-pattern",
                tech), "created": created, "modified": modified, "name": tech, "external_references": [
                {"source_name": "mitre-attack", "external_id": tech, "url": f"https://attack.mitre.org/techniques/{base}/"}], "kill_chain_phases": [
                {"kill_chain_name": "mitre-attack", "phase_name": t} for t in
                sorted(set(tactics))] if tactics else None, "object_marking_refs": [tlp_amber_id], }
            ap = {k: v for k, v in ap.items() if v is not None}
            attack_refs.append(add_obj(objects, seen, ap, uniq=("attack-pattern", tech)))

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        def add_sensitive(cat: str, values: List[Any]) -> None:
            vals = [str(v).strip() for v in values if str(v).strip()]
            if not vals:
                return
            out: List[Dict[str, str]] = []
            for v in sorted(set(vals)):
                last4 = v[-4:] if len(v) >= 4 else v
                out.append({"sha256": sha256(v), "last4": last4})
            sensitive[cat] = out

        add_sensitive("credit_cards", as_list(safe_get(raw, "m_credit_card")))
        add_sensitive("us_passport", as_list(safe_get(raw, "m_us_passport")))
        add_sensitive("au_abn", as_list(safe_get(raw, "m_au_abn")))
        add_sensitive("us_bank_number", as_list(safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive:
            note = {"type": "note", "spec_version": "2.1", "id": stix_id(
                "note",
                f"sensitive|{doc_id}|{created}"), "created": created, "modified": modified, "abstract": "Sensitive artifacts (hashed)", "content": str(
                sensitive), "object_marking_refs": [tlp_red_id], }
            note_ref = add_obj(objects, seen, note, uniq=("note", note["id"]))

        external_refs: List[Dict[str, Any]] = []
        if url:
            external_refs.append({"source_name": "source", "url": str(url)})
        if base_url and base_url != url:
            external_refs.append({"source_name": "base_url", "url": str(base_url)})
        if safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(safe_get(raw, "m_hash"))})
        if safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(safe_get(raw, "m_scrap_file"))})
        if safe_get(raw, "m_screenshot"):
            external_refs.append({"source_name": "screenshot", "external_id": str(safe_get(raw, "m_screenshot"))})

        report_object_refs: List[str] = []
        for r in [actor_ref, infra_ref, observed_ref, note_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(victim_refs)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report: Dict[str, Any] = {"type": "report", "spec_version": "2.1", "id": stix_id(
            "report",
            f"leak:{doc_id}"), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": [
            "threat-report"], "published": created, "labels": sorted(
            labels), "lang": lang, "external_references": external_refs or None, "object_refs": sorted(
            set(report_object_refs)), "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(
            doc_id), "x_orion_network": str(network) if network else None, "x_orion_platform": str(
            platform) if platform else None, "x_orion_dumplink_count": str(len(dump_links)) if dump_links else None, }
        report = {k: v for k, v in report.items() if v is not None}

        add_obj(objects, seen, report, uniq=("report", report["id"]))

        bundle = {"type": "bundle", "id": stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": objects, }
        return bundle

    

class _SocialConverter(_BaseConverter):
    def convert(self, raw: Any) -> Dict[str, Any]:
        raw = _to_attr_obj(raw)
        parse_ts = parse_ts_full
        created = (parse_ts(safe_get(raw, "m_creation_date")) or parse_ts(safe_get(raw, "m_update_date")) or parse_ts(
            safe_get(raw, "m_message_date")) or now_ts())
        modified = parse_ts(safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title = str(
            first_nonempty(
                safe_get(raw, "m_title"),
                safe_get(raw, "m_url"),
                safe_get(raw, "m_channel_url"),
                "Social - unknown title"))
        url = first_nonempty(
            safe_get(raw, "m_message_sharable_link"), safe_get(raw, "m_channel_url"), safe_get(raw, "m_url"))
        base_url = safe_get(raw, "m_channel_url")
        network = safe_get(raw, "m_network")
        platform = safe_get(raw, "m_platform")
        doc_id = first_nonempty(safe_get(raw, "m_document_id"), safe_get(raw, "m_hash"), url, base_url, title)

        content_src = first_nonempty(
            safe_get(raw, "m_content"), safe_get(raw, "m_important_content"), safe_get(raw, "m_meta_description"), "")
        summary = clean_text(str(content_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        objects: List[Dict[str, Any]] = []
        seen: Dict[Tuple[str, str], str] = {}

        tlp_amber_id = stix_id("marking-definition", "tlp:amber")
        tlp_red_id = stix_id("marking-definition", "tlp:red")

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_amber_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "amber"}, },
            uniq=("marking-definition", "tlp:amber"))

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_red_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "red"}, },
            uniq=("marking-definition", "tlp:red"))

        content_types = set(
            str(x).strip().lower() for x in
                (as_list(safe_get(raw, "m_content_type")) + as_list(safe_get(raw, "content_type"))) if str(x).strip())

        labels: Set[str] = set()
        for ct in sorted(content_types):
            labels.add(ct)
        if network:
            labels.add(str(network).strip().lower())
        if platform:
            labels.add(f"platform:{str(platform).strip().lower()}")
        labels.add("orion:social")

        langs = [str(x).strip() for x in as_list(safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None

        industries = [str(x).strip() for x in as_list(safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else "Social Media"

        location_refs: List[str] = []
        for c in (as_list(safe_get(raw, "m_country")) or as_list(safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            loc = {"type": "location", "spec_version": "2.1", "id": stix_id(
                "location",
                f"country:{cc}"), "created": created, "modified": modified, "name": cc, "country": cc, "object_marking_refs": [
                tlp_amber_id], }
            location_refs.append(add_obj(objects, seen, loc, uniq=("location", f"country:{cc}")))

        author = first_nonempty(safe_get(raw, "m_author"), safe_get(raw, "m_username"))
        created_by_ref = None
        if author:
            if isinstance(author, list):
                author_name = str(author[0]).strip() if author else ""
            else:
                author_name = str(author).strip()
            if author_name:
                ident = {"type": "identity", "spec_version": "2.1", "id": stix_id(
                    "identity",
                    f"author:{author_name}"), "created": created, "modified": modified, "name": author_name, "identity_class": "individual", "object_marking_refs": [
                    tlp_amber_id], }
                created_by_ref = add_obj(objects, seen, ident, uniq=("identity", f"author:{author_name}"))

        domain_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_domain")) if str(x).strip()]
        url_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_url")) if str(x).strip()]
        ip_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_ip")) if str(x).strip()]
        email_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_email")) if str(x).strip()]
        asn_vals = [str(x).strip().upper().lstrip("AS") for x in as_list(safe_get(raw, "m_asns")) if str(x).strip()]
        path_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_file_paths")) if str(x).strip()]
        social_profiles = [str(x).strip() for x in as_list(safe_get(raw, "m_social_media_profiles")) if str(x).strip()]
        encoded_urls = [str(x).strip() for x in as_list(safe_get(raw, "m_encoded_urls")) if str(x).strip()]
        xmpp_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_xmpp_addresses")) if str(x).strip()]
        crypto_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_crypto_address")) if str(x).strip()]
        user_agents = [str(x).strip() for x in as_list(safe_get(raw, "m_user_agents")) if str(x).strip()]
        hashtags = [str(x).strip().lstrip("#") for x in as_list(safe_get(raw, "m_hashtag")) if str(x).strip()]
        mentions = [str(x).strip().lstrip("@") for x in as_list(safe_get(raw, "m_mention")) if str(x).strip()]

        if url:
            url_vals.append(str(url))

        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)

        for sp in social_profiles:
            if sp.startswith(("http://", "https://")):
                url_vals.append(sp)

        domain_vals = sorted(set(domain_vals))
        url_vals = sorted(set(url_vals))
        ip_vals = sorted(set(ip_vals))
        email_vals = sorted(set([e for e in email_vals]))
        asn_vals = sorted(set([a for a in asn_vals if a.isdigit()]))
        path_vals = sorted(set(path_vals))
        xmpp_vals = sorted(set(xmpp_vals))
        crypto_vals = sorted(set(crypto_vals))
        user_agents = sorted(set(user_agents))

        infra_seed = first_nonempty(base_url, url, domain_vals[0] if domain_vals else None)
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(network).lower() == "onion":
                infra_types = ["anonymization"]
            infra = {"type": "infrastructure", "spec_version": "2.1", "id": stix_id(
                "infrastructure", f"infra:{infra_seed}"), "created": created, "modified": modified, "name": str(
                first_nonempty(
                    platform,
                    title,
                    "Social infrastructure")), "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], "x_orion_network": str(
                network) if network else None, "x_orion_platform": str(platform) if platform else None, }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = add_obj(objects, seen, infra, uniq=("infrastructure", f"infra:{infra_seed}"))

        sco_refs: List[str] = []

        for u in url_vals:
            sco = {"type": "url", "id": sco_id("url", u), "value": u}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("url", u)))

        for d in domain_vals:
            sco = {"type": "domain-name", "id": sco_id("domain-name", d), "value": d}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("domain-name", d)))

        for ip in ip_vals:
            if ":" in ip:
                sco = {"type": "ipv6-addr", "id": sco_id("ipv6-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv6-addr", ip)))
            else:
                sco = {"type": "ipv4-addr", "id": sco_id("ipv4-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv4-addr", ip)))

        for e in email_vals:
            el = e.lower()
            sco = {"type": "email-addr", "id": sco_id("email-addr", el), "value": e}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("email-addr", el)))

        for a in asn_vals:
            sco = {"type": "autonomous-system", "id": sco_id("autonomous-system", a), "number": int(a)}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("autonomous-system", a)))

        for p in path_vals:
            sco = {"type": "directory", "id": sco_id("directory", p), "path": p}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("directory", p)))

        for x in xmpp_vals:
            sco = {"type": "x-mpp-addr", "id": sco_id("x-mpp-addr", x), "value": x}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("x-mpp-addr", x)))

        for c in crypto_vals:
            sco = {"type": "cryptocurrency-wallet", "id": sco_id("cryptocurrency-wallet", c), "address": c}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("cryptocurrency-wallet", c)))

        for ua in user_agents:
            sco = {"type": "user-agent", "id": sco_id("user-agent", ua), "string": ua}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("user-agent", ua)))

        observed_ref = None
        if sco_refs:
            obs = {"type": "observed-data", "spec_version": "2.1", "id": stix_id(
                "observed-data",
                f"{doc_id}|{created}"), "created": created, "modified": modified, "first_observed": created, "last_observed": modified, "number_observed": 1, "object_refs": sorted(
                set(sco_refs)), "object_marking_refs": [tlp_amber_id], }
            observed_ref = add_obj(objects, seen, obs, uniq=("observed-data", obs["id"]))

        indicator_refs: List[str] = []

        def add_indicator(name: str, pattern: str, types: List[str]) -> str:
            ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"{name}|{pattern}"), "created": created, "modified": modified, "name": name, "description": summary if summary else None, "indicator_types": types, "pattern_type": "stix", "pattern": pattern, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            ind = {k: v for k, v in ind.items() if v is not None}
            return add_obj(objects, seen, ind, uniq=("indicator", ind["id"]))

        if domain_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in domain_vals)
            indicator_refs.append(add_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"]))

        if url_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in url_vals)
            indicator_refs.append(add_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"]))

        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v4)
                indicator_refs.append(add_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"]))
            if v6:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v6)
                indicator_refs.append(add_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"]))

        if email_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in email_vals)
            indicator_refs.append(add_indicator("Emails", f"[email-addr:value IN ({vals})]", ["phishing"]))

        for yr in as_list(safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            yara_ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"yara|{sha256(rule)}"), "created": created, "modified": modified, "name": "YARA Rule", "pattern_type": "yara", "pattern": rule, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            indicator_refs.append(add_obj(objects, seen, yara_ind, uniq=("indicator", yara_ind["id"])))

        vuln_refs: List[str] = []
        for c in as_list(safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            if token.startswith("CVE-"):
                v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                    "vulnerability",
                    token), "created": created, "modified": modified, "name": token, "external_references": [
                    {"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}], "object_marking_refs": [
                    tlp_amber_id], }
                vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))
            elif token.startswith("CWE-"):
                cwe_num = token.replace("CWE-", "")
                if cwe_num.isdigit():
                    v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                        "vulnerability",
                        token), "created": created, "modified": modified, "name": token, "external_references": [
                        {"source_name": "cwe", "external_id": token, "url": f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"}], "object_marking_refs": [
                        tlp_amber_id], }
                    vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in
            as_list(safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in as_list(safe_get(raw, "m_enterprise_attack_techniques")) if
            str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            if not re.match(r"^(T\d{4})(\.\d{3})?$", tech):
                continue
            base = tech.split(".")[0]
            ap: Dict[str, Any] = {"type": "attack-pattern", "spec_version": "2.1", "id": stix_id(
                "attack-pattern",
                tech), "created": created, "modified": modified, "name": tech, "external_references": [
                {"source_name": "mitre-attack", "external_id": tech, "url": f"https://attack.mitre.org/techniques/{base}/"}], "kill_chain_phases": [
                {"kill_chain_name": "mitre-attack", "phase_name": t} for t in
                sorted(set(tactics))] if tactics else None, "object_marking_refs": [tlp_amber_id], }
            ap = {k: v for k, v in ap.items() if v is not None}
            attack_refs.append(add_obj(objects, seen, ap, uniq=("attack-pattern", tech)))

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        def add_sensitive(cat: str, values: List[Any]) -> None:
            vals = [str(v).strip() for v in values if str(v).strip()]
            if not vals:
                return
            out: List[Dict[str, str]] = []
            for v in sorted(set(vals)):
                last4 = v[-4:] if len(v) >= 4 else v
                out.append({"sha256": sha256(v), "last4": last4})
            sensitive[cat] = out

        add_sensitive("credit_cards", as_list(safe_get(raw, "m_credit_card")))
        add_sensitive("us_passport", as_list(safe_get(raw, "m_us_passport")))
        add_sensitive("au_abn", as_list(safe_get(raw, "m_au_abn")))
        add_sensitive("us_bank_number", as_list(safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive or hashtags or mentions:
            content_note: Dict[str, Any] = {}
            if sensitive:
                content_note["sensitive_hashed"] = sensitive
            if hashtags:
                content_note["hashtags"] = sorted(set([h for h in hashtags if h]))
            if mentions:
                content_note["mentions"] = sorted(set([m for m in mentions if m]))
            note = {"type": "note", "spec_version": "2.1", "id": stix_id(
                "note",
                f"social-meta|{doc_id}|{created}"), "created": created, "modified": modified, "abstract": "Social metadata (and sensitive hashed)", "content": str(
                content_note), "object_marking_refs": [tlp_red_id] if sensitive else [tlp_amber_id], }
            note_ref = add_obj(objects, seen, note, uniq=("note", note["id"]))

        external_refs: List[Dict[str, Any]] = []
        if url:
            external_refs.append({"source_name": "source", "url": str(url)})
        if base_url and base_url != url:
            external_refs.append({"source_name": "channel_url", "url": str(base_url)})
        if safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(safe_get(raw, "m_hash"))})
        if safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(safe_get(raw, "m_scrap_file"))})
        if safe_get(raw, "m_message_sharable_link"):
            external_refs.append({"source_name": "share_link", "url": str(safe_get(raw, "m_message_sharable_link"))})

        report_object_refs: List[str] = []
        for r in [infra_ref, observed_ref, note_ref, created_by_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report: Dict[str, Any] = {"type": "report", "spec_version": "2.1", "id": stix_id(
            "report",
            f"social:{doc_id}"), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": [
            "threat-report"], "published": created, "labels": sorted(
            labels), "lang": lang, "created_by_ref": created_by_ref, "external_references": external_refs or None, "object_refs": sorted(
            set(report_object_refs)), "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(
            doc_id), "x_orion_network": str(network) if network else None, "x_orion_platform": str(
            platform) if platform else None, "x_orion_post_comments_count": str(
            safe_get(raw, "m_post_comments_count")) if safe_get(raw, "m_post_comments_count") else None, }
        report = {k: v for k, v in report.items() if v is not None}
        add_obj(objects, seen, report, uniq=("report", report["id"]))

        bundle = {"type": "bundle", "id": stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": objects, }
        return bundle

    

class _GeneralConverter(_BaseConverter):
    def convert(self, raw: Any) -> Dict[str, Any]:
        raw = _to_attr_obj(raw)
        parse_ts = parse_ts_general
        created = parse_ts(safe_get(raw, "m_creation_date")) or parse_ts(safe_get(raw, "m_update_date")) or now_ts()
        modified = parse_ts(safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title = str(
            first_nonempty(
                safe_get(raw, "m_title"),
                safe_get(raw, "m_url"),
                safe_get(raw, "m_base_url"),
                "General - unknown title"))
        url = first_nonempty(safe_get(raw, "m_url"), safe_get(raw, "m_base_url"))
        base_url = safe_get(raw, "m_base_url")
        network = safe_get(raw, "m_network")
        doc_id = first_nonempty(safe_get(raw, "m_document_id"), safe_get(raw, "m_hash"), url, base_url, title)

        summary_src = first_nonempty(
            safe_get(raw, "m_important_content"), safe_get(raw, "m_meta_description"), safe_get(raw, "m_content"), "")
        summary = clean_text(str(summary_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        objects: List[Dict[str, Any]] = []
        seen: Dict[Tuple[str, str], str] = {}

        tlp_amber_id = stix_id("marking-definition", "tlp:amber")
        tlp_red_id = stix_id("marking-definition", "tlp:red")

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_amber_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "amber"}, },
            uniq=("marking-definition", "tlp:amber"))

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_red_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "red"}, },
            uniq=("marking-definition", "tlp:red"))

        content_types = set(
            str(x).strip().lower() for x in
                (as_list(safe_get(raw, "m_content_type")) + as_list(safe_get(raw, "content_type"))) if str(x).strip())

        labels: Set[str] = set()
        for ct in sorted(content_types):
            labels.add(ct)
        if network:
            labels.add(str(network).strip().lower())
        for p in as_list(safe_get(raw, "m_platform")):
            sp = str(p).strip().lower()
            if sp:
                labels.add(f"platform:{sp}")
        for h in as_list(safe_get(raw, "m_hashtag")):
            sh = str(h).strip().lstrip("#").lower()
            if sh:
                labels.add(f"tag:{sh}")
        labels.add("orion:general")

        lang = None
        langs = [str(x).strip() for x in as_list(safe_get(raw, "m_language")) if str(x).strip()]
        if len(langs) == 1:
            lang = langs[0]

        industries = [str(x).strip() for x in as_list(safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else None

        location_refs: List[str] = []
        for c in (as_list(safe_get(raw, "m_country")) or as_list(safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            loc = {"type": "location", "spec_version": "2.1", "id": stix_id(
                "location",
                f"country:{cc}"), "created": created, "modified": modified, "name": cc, "country": cc, "object_marking_refs": [
                tlp_amber_id], }
            location_refs.append(add_obj(objects, seen, loc, uniq=("location", f"country:{cc}")))

        victim_refs: List[str] = []
        for org in (as_list(safe_get(raw, "m_org")) + as_list(safe_get(raw, "m_company_name"))):
            name = str(org).strip()
            if not name:
                continue
            ident: Dict[str, Any] = {"type": "identity", "spec_version": "2.1", "id": stix_id(
                "identity",
                f"victim:{name}"), "created": created, "modified": modified, "name": name, "identity_class": "organization", "sectors": [
                sector] if sector else None, "object_marking_refs": [tlp_amber_id], }
            ident = {k: v for k, v in ident.items() if v is not None}
            victim_refs.append(add_obj(objects, seen, ident, uniq=("identity", f"victim:{name}")))

        for vref in victim_refs:
            for lref in location_refs:
                rel = {"type": "relationship", "spec_version": "2.1", "id": stix_id(
                    "relationship",
                    f"{vref}|located-at|{lref}"), "created": created, "modified": modified, "relationship_type": "located-at", "source_ref": vref, "target_ref": lref, "object_marking_refs": [
                    tlp_amber_id], }
                add_obj(objects, seen, rel, uniq=("relationship", f"{vref}|located-at|{lref}"))

        team = first_nonempty(safe_get(raw, "m_team"), safe_get(raw, "m_author"))
        actor_ref = None
        if team:
            tname = str(team).strip()
            if tname:
                actor = {"type": "intrusion-set", "spec_version": "2.1", "id": stix_id(
                    "intrusion-set",
                    f"team:{tname}"), "created": created, "modified": modified, "name": tname, "description": summary if summary else None, "object_marking_refs": [
                    tlp_amber_id], }
                actor = {k: v for k, v in actor.items() if v is not None}
                actor_ref = add_obj(objects, seen, actor, uniq=("intrusion-set", f"team:{tname}"))

        domain_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_domain")) if str(x).strip()]
        url_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_url")) if str(x).strip()]
        ip_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_ip")) if str(x).strip()]
        email_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_email")) if str(x).strip()]
        asn_vals = [str(x).strip().upper().lstrip("AS") for x in as_list(safe_get(raw, "m_asns")) if str(x).strip()]
        path_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_file_paths")) if str(x).strip()]

        encoded_urls = [str(x).strip() for x in as_list(safe_get(raw, "m_encoded_urls")) if str(x).strip()]
        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)

        url_vals = sorted(set(url_vals))
        domain_vals = sorted(set(domain_vals))
        ip_vals = sorted(set(ip_vals))
        email_vals = sorted(set(email_vals))
        asn_vals = sorted(set([a for a in asn_vals if a.isdigit()]))
        path_vals = sorted(set(path_vals))

        infra_seed = first_nonempty(url, base_url, domain_vals[0] if domain_vals else None)
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(network).lower() == "onion":
                infra_types = ["anonymization"]
            elif "darkweb" in content_types:
                infra_types = ["hosting-malware"]
            infra = {"type": "infrastructure", "spec_version": "2.1", "id": stix_id(
                "infrastructure", f"infra:{infra_seed}"), "created": created, "modified": modified, "name": str(
                first_nonempty(
                    safe_get(raw, "m_team"),
                    title,
                    "Observed infrastructure")), "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], "x_orion_network": str(network) if network else None, }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = add_obj(objects, seen, infra, uniq=("infrastructure", f"infra:{infra_seed}"))

        if actor_ref and infra_ref:
            rel = {"type": "relationship", "spec_version": "2.1", "id": stix_id(
                "relationship",
                f"{actor_ref}|uses|{infra_ref}"), "created": created, "modified": modified, "relationship_type": "uses", "source_ref": actor_ref, "target_ref": infra_ref, "object_marking_refs": [
                tlp_amber_id], }
            add_obj(objects, seen, rel, uniq=("relationship", f"{actor_ref}|uses|{infra_ref}"))

        sco_refs: List[str] = []

        for u in url_vals:
            sco = {"type": "url", "id": sco_id("url", u), "value": u}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("url", u)))

        for d in domain_vals:
            sco = {"type": "domain-name", "id": sco_id("domain-name", d), "value": d}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("domain-name", d)))

        for ip in ip_vals:
            if ":" in ip:
                sco = {"type": "ipv6-addr", "id": sco_id("ipv6-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv6-addr", ip)))
            else:
                sco = {"type": "ipv4-addr", "id": sco_id("ipv4-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv4-addr", ip)))

        for e in email_vals:
            el = e.lower()
            sco = {"type": "email-addr", "id": sco_id("email-addr", el), "value": e}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("email-addr", el)))

        for a in asn_vals:
            sco = {"type": "autonomous-system", "id": sco_id("autonomous-system", a), "number": int(a)}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("autonomous-system", a)))

        for p in path_vals:
            sco = {"type": "directory", "id": sco_id("directory", p), "path": p}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("directory", p)))

        observed_ref = None
        if sco_refs:
            obs = {"type": "observed-data", "spec_version": "2.1", "id": stix_id(
                "observed-data",
                f"{doc_id}|{created}"), "created": created, "modified": modified, "first_observed": created, "last_observed": modified, "number_observed": 1, "object_refs": sorted(
                set(sco_refs)), "object_marking_refs": [tlp_amber_id], }
            observed_ref = add_obj(objects, seen, obs, uniq=("observed-data", obs["id"]))

        indicator_refs: List[str] = []

        def add_indicator(name: str, pattern: str, types: List[str]) -> str:
            ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"{name}|{pattern}"), "created": created, "modified": modified, "name": name, "description": summary if summary else None, "indicator_types": types, "pattern_type": "stix", "pattern": pattern, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            ind = {k: v for k, v in ind.items() if v is not None}
            return add_obj(objects, seen, ind, uniq=("indicator", ind["id"]))

        if domain_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in domain_vals)
            indicator_refs.append(add_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"]))

        if url_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in url_vals)
            indicator_refs.append(add_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"]))

        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v4)
                indicator_refs.append(add_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"]))
            if v6:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v6)
                indicator_refs.append(add_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"]))

        if email_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in email_vals)
            indicator_refs.append(add_indicator("Emails", f"[email-addr:value IN ({vals})]", ["phishing"]))

        for yr in as_list(safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            yara_ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"yara|{sha256(rule)}"), "created": created, "modified": modified, "name": "YARA Rule", "pattern_type": "yara", "pattern": rule, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            indicator_refs.append(add_obj(objects, seen, yara_ind, uniq=("indicator", yara_ind["id"])))

        vuln_refs: List[str] = []
        for c in as_list(safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            if token.startswith("CVE-"):
                v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                    "vulnerability",
                    token), "created": created, "modified": modified, "name": token, "external_references": [
                    {"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}], "object_marking_refs": [
                    tlp_amber_id], }
                vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))
            elif token.startswith("CWE-"):
                cwe_num = token.replace("CWE-", "")
                if cwe_num.isdigit():
                    v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                        "vulnerability",
                        token), "created": created, "modified": modified, "name": token, "external_references": [
                        {"source_name": "cwe", "external_id": token, "url": f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"}], "object_marking_refs": [
                        tlp_amber_id], }
                    vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in
            as_list(safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in as_list(safe_get(raw, "m_enterprise_attack_techniques")) if
            str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            if not re.match(r"^(T\d{4})(\.\d{3})?$", tech):
                continue
            base = tech.split(".")[0]
            ap: Dict[str, Any] = {"type": "attack-pattern", "spec_version": "2.1", "id": stix_id(
                "attack-pattern",
                tech), "created": created, "modified": modified, "name": tech, "external_references": [
                {"source_name": "mitre-attack", "external_id": tech, "url": f"https://attack.mitre.org/techniques/{base}/"}], "kill_chain_phases": [
                {"kill_chain_name": "mitre-attack", "phase_name": t} for t in
                sorted(set(tactics))] if tactics else None, "object_marking_refs": [tlp_amber_id], }
            ap = {k: v for k, v in ap.items() if v is not None}
            attack_refs.append(add_obj(objects, seen, ap, uniq=("attack-pattern", tech)))

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        def add_sensitive(cat: str, values: List[Any]) -> None:
            vals = [str(v).strip() for v in values if str(v).strip()]
            if not vals:
                return
            out: List[Dict[str, str]] = []
            for v in sorted(set(vals)):
                last4 = v[-4:] if len(v) >= 4 else v
                out.append({"sha256": sha256(v), "last4": last4})
            sensitive[cat] = out

        add_sensitive("credit_cards", as_list(safe_get(raw, "m_credit_card")))
        add_sensitive("us_passport", as_list(safe_get(raw, "m_us_passport")))
        add_sensitive("au_abn", as_list(safe_get(raw, "m_au_abn")))
        add_sensitive("us_bank_number", as_list(safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive:
            note = {"type": "note", "spec_version": "2.1", "id": stix_id(
                "note",
                f"sensitive|{doc_id}|{created}"), "created": created, "modified": modified, "abstract": "Sensitive artifacts (hashed)", "content": str(
                sensitive), "object_marking_refs": [tlp_red_id], }
            note_ref = add_obj(objects, seen, note, uniq=("note", note["id"]))

        external_refs: List[Dict[str, Any]] = []
        if url:
            external_refs.append({"source_name": "source", "url": str(url)})
        if base_url and base_url != url:
            external_refs.append({"source_name": "base_url", "url": str(base_url)})
        if safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(safe_get(raw, "m_hash"))})
        if safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(safe_get(raw, "m_scrap_file"))})
        if safe_get(raw, "m_screenshot"):
            external_refs.append({"source_name": "screenshot", "external_id": str(safe_get(raw, "m_screenshot"))})

        report_object_refs: List[str] = []
        for r in [actor_ref, infra_ref, observed_ref, note_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(victim_refs)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report: Dict[str, Any] = {"type": "report", "spec_version": "2.1", "id": stix_id(
            "report", str(
                doc_id)), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": [
            "threat-report"], "published": created, "labels": sorted(
            labels), "lang": lang, "external_references": external_refs or None, "object_refs": sorted(
            set(report_object_refs)), "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(
            doc_id), "x_orion_network": str(network) if network else None, }
        report = {k: v for k, v in report.items() if v is not None}
        add_obj(objects, seen, report, uniq=("report", report["id"]))

        bundle = {"type": "bundle", "id": stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": objects, }
        return bundle

    

class _ChatConverter(_BaseConverter):
    def convert(self, raw: Any) -> Dict[str, Any]:
        raw = _to_attr_obj(raw)
        parse_ts = parse_ts_full
        created = (parse_ts(safe_get(raw, "m_creation_date")) or parse_ts(safe_get(raw, "m_update_date")) or parse_ts(
            safe_get(raw, "m_message_date")) or now_ts())
        modified = parse_ts(safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        caption = str(first_nonempty(safe_get(raw, "m_caption"), safe_get(raw, "m_content"), "Chat - unknown title"))
        url = first_nonempty(safe_get(raw, "m_message_sharable_link"), safe_get(raw, "m_media_url"))
        channel_url = safe_get(raw, "m_channel_url")
        channel_id = safe_get(raw, "m_channel_id")
        platform = safe_get(raw, "m_platform")
        network = safe_get(raw, "m_network") or (str(platform).strip().lower() if platform else None)
        doc_id = first_nonempty(
            safe_get(raw, "m_document_id"),
            safe_get(raw, "m_hash"),
            safe_get(raw, "m_message_id"),
            url,
            channel_id,
            caption)

        content_src = first_nonempty(safe_get(raw, "m_content"), safe_get(raw, "m_media_caption"), "")
        summary = clean_text(str(content_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        objects: List[Dict[str, Any]] = []
        seen: Dict[Tuple[str, str], str] = {}

        tlp_amber_id = stix_id("marking-definition", "tlp:amber")
        tlp_red_id = stix_id("marking-definition", "tlp:red")

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_amber_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "amber"}, },
            uniq=("marking-definition", "tlp:amber"))

        add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_red_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "red"}, },
            uniq=("marking-definition", "tlp:red"))

        content_types = set(
            str(x).strip().lower() for x in
                (as_list(safe_get(raw, "m_content_type")) + as_list(safe_get(raw, "content_type"))) if str(x).strip())

        labels: Set[str] = set()
        for ct in sorted(content_types):
            labels.add(ct)
        if platform:
            labels.add(f"platform:{str(platform).strip().lower()}")
        if network:
            labels.add(str(network).strip().lower())
        labels.add("orion:chat")

        langs = [str(x).strip() for x in as_list(safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None

        sender = first_nonempty(safe_get(raw, "m_sender_username"), safe_get(raw, "m_users"), safe_get(raw, "m_author"))
        created_by_ref = None
        if sender:
            if isinstance(sender, list):
                sender_name = str(sender[0]).strip() if sender else ""
            else:
                sender_name = str(sender).strip()
            if sender_name:
                ident = {"type": "identity", "spec_version": "2.1", "id": stix_id(
                    "identity",
                    f"sender:{sender_name}"), "created": created, "modified": modified, "name": sender_name, "identity_class": "individual", "object_marking_refs": [
                    tlp_amber_id], }
                created_by_ref = add_obj(objects, seen, ident, uniq=("identity", f"sender:{sender_name}"))

        channel_name = first_nonempty(safe_get(raw, "m_channel_name"), channel_id, channel_url, "Chat channel")
        infra_seed = first_nonempty(channel_url, channel_id)
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(platform).strip().lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)):
                infra_types = ["communications"]
            infra = {"type": "infrastructure", "spec_version": "2.1", "id": stix_id(
                "infrastructure", f"channel:{infra_seed}"), "created": created, "modified": modified, "name": str(
                channel_name), "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], "x_orion_network": str(
                network) if network else None, "x_orion_channel_id": str(channel_id) if channel_id else None, }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = add_obj(objects, seen, infra, uniq=("infrastructure", f"channel:{infra_seed}"))

        domain_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_domain")) if str(x).strip()]
        url_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_url")) if str(x).strip()]
        ip_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_ip")) if str(x).strip()]
        email_vals = [str(x).strip() for x in as_list(safe_get(raw, "m_email")) if str(x).strip()]
        asn_vals = [str(x).strip().upper().lstrip("AS") for x in as_list(safe_get(raw, "m_asns")) if str(x).strip()]
        file_paths = [str(x).strip() for x in as_list(safe_get(raw, "m_file_paths")) if str(x).strip()]
        encoded_urls = [str(x).strip() for x in as_list(safe_get(raw, "m_encoded_urls")) if str(x).strip()]
        weblinks = [str(x).strip() for x in as_list(safe_get(raw, "m_weblink")) if str(x).strip()]
        mentions = [str(x).strip() for x in as_list(safe_get(raw, "m_mention")) if str(x).strip()]
        hashtags = [str(x).strip().lstrip("#") for x in as_list(safe_get(raw, "m_hashtag")) if str(x).strip()]
        user_agents = [str(x).strip() for x in as_list(safe_get(raw, "m_user_agents")) if str(x).strip()]
        cves = [str(x).strip().upper() for x in as_list(safe_get(raw, "m_cve")) if str(x).strip()]

        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)
        for wl in weblinks:
            if wl.startswith(("http://", "https://")):
                url_vals.append(wl)
        if url:
            url_vals.append(str(url))
        if channel_url:
            url_vals.append(str(channel_url))

        domain_vals = sorted(set(domain_vals))
        url_vals = sorted(set(url_vals))
        ip_vals = sorted(set(ip_vals))
        email_vals = sorted(set(email_vals))
        asn_vals = sorted(set([a for a in asn_vals if a.isdigit()]))
        file_paths = sorted(set(file_paths))
        user_agents = sorted(set(user_agents))

        sco_refs: List[str] = []

        for u in url_vals:
            sco = {"type": "url", "id": sco_id("url", u), "value": u}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("url", u)))

        for d in domain_vals:
            sco = {"type": "domain-name", "id": sco_id("domain-name", d), "value": d}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("domain-name", d)))

        for ip in ip_vals:
            if ":" in ip:
                sco = {"type": "ipv6-addr", "id": sco_id("ipv6-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv6-addr", ip)))
            else:
                sco = {"type": "ipv4-addr", "id": sco_id("ipv4-addr", ip), "value": ip}
                sco_refs.append(add_obj(objects, seen, sco, uniq=("ipv4-addr", ip)))

        for e in email_vals:
            el = e.lower()
            sco = {"type": "email-addr", "id": sco_id("email-addr", el), "value": e}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("email-addr", el)))

        for a in asn_vals:
            sco = {"type": "autonomous-system", "id": sco_id("autonomous-system", a), "number": int(a)}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("autonomous-system", a)))

        for p in file_paths:
            sco = {"type": "directory", "id": sco_id("directory", p), "path": p}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("directory", p)))

        for ua in user_agents:
            sco = {"type": "user-agent", "id": sco_id("user-agent", ua), "string": ua}
            sco_refs.append(add_obj(objects, seen, sco, uniq=("user-agent", ua)))

        observed_ref = None
        if sco_refs:
            obs = {"type": "observed-data", "spec_version": "2.1", "id": stix_id(
                "observed-data",
                f"{doc_id}|{created}"), "created": created, "modified": modified, "first_observed": created, "last_observed": modified, "number_observed": 1, "object_refs": sorted(
                set(sco_refs)), "object_marking_refs": [tlp_amber_id], }
            observed_ref = add_obj(objects, seen, obs, uniq=("observed-data", obs["id"]))

        indicator_refs: List[str] = []

        def add_indicator(name: str, pattern: str, types: List[str]) -> str:
            ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"{name}|{pattern}"), "created": created, "modified": modified, "name": name, "description": summary if summary else None, "indicator_types": types, "pattern_type": "stix", "pattern": pattern, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            ind = {k: v for k, v in ind.items() if v is not None}
            return add_obj(objects, seen, ind, uniq=("indicator", ind["id"]))

        if domain_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in domain_vals)
            indicator_refs.append(add_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"]))

        if url_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in url_vals)
            indicator_refs.append(add_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"]))

        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v4)
                indicator_refs.append(add_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"]))
            if v6:
                vals = ", ".join(f"'{escape_pat(v)}'" for v in v6)
                indicator_refs.append(add_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"]))

        if email_vals:
            vals = ", ".join(f"'{escape_pat(v)}'" for v in email_vals)
            indicator_refs.append(add_indicator("Emails", f"[email-addr:value IN ({vals})]", ["malicious-activity"]))

        for yr in as_list(safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            yara_ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": stix_id(
                "indicator",
                f"yara|{sha256(rule)}"), "created": created, "modified": modified, "name": "YARA Rule", "pattern_type": "yara", "pattern": rule, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            indicator_refs.append(add_obj(objects, seen, yara_ind, uniq=("indicator", yara_ind["id"])))

        vuln_refs: List[str] = []
        for token in sorted(set([c for c in cves if c.startswith("CVE-")])):
            v = {"type": "vulnerability", "spec_version": "2.1", "id": stix_id(
                "vulnerability",
                token), "created": created, "modified": modified, "name": token, "external_references": [
                {"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}], "object_marking_refs": [
                tlp_amber_id], }
            vuln_refs.append(add_obj(objects, seen, v, uniq=("vulnerability", token)))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in
            as_list(safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in as_list(safe_get(raw, "m_enterprise_attack_techniques")) if
            str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            if not re.match(r"^(T\d{4})(\.\d{3})?$", tech):
                continue
            base = tech.split(".")[0]
            ap: Dict[str, Any] = {"type": "attack-pattern", "spec_version": "2.1", "id": stix_id(
                "attack-pattern",
                tech), "created": created, "modified": modified, "name": tech, "external_references": [
                {"source_name": "mitre-attack", "external_id": tech, "url": f"https://attack.mitre.org/techniques/{base}/"}], "kill_chain_phases": [
                {"kill_chain_name": "mitre-attack", "phase_name": t} for t in
                sorted(set(tactics))] if tactics else None, "object_marking_refs": [tlp_amber_id], }
            ap = {k: v for k, v in ap.items() if v is not None}
            attack_refs.append(add_obj(objects, seen, ap, uniq=("attack-pattern", tech)))

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        def add_sensitive(cat: str, values: List[Any]) -> None:
            vals = [str(v).strip() for v in values if str(v).strip()]
            if not vals:
                return
            out: List[Dict[str, str]] = []
            for v in sorted(set(vals)):
                last4 = v[-4:] if len(v) >= 4 else v
                out.append({"sha256": sha256(v), "last4": last4})
            sensitive[cat] = out

        add_sensitive("credit_cards", as_list(safe_get(raw, "m_credit_card")))
        add_sensitive("us_passport", as_list(safe_get(raw, "m_us_passport")))
        add_sensitive("au_abn", as_list(safe_get(raw, "m_au_abn")))
        add_sensitive("us_bank_number", as_list(safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive or hashtags or mentions:
            content_note: Dict[str, Any] = {}
            if sensitive:
                content_note["sensitive_hashed"] = sensitive
            if hashtags:
                content_note["hashtags"] = sorted(set([h for h in hashtags if h]))
            if mentions:
                content_note["mentions"] = sorted(set([m for m in mentions if m]))
            note = {"type": "note", "spec_version": "2.1", "id": stix_id(
                "note",
                f"chat-meta|{doc_id}|{created}"), "created": created, "modified": modified, "abstract": "Chat metadata (and sensitive hashed)", "content": str(
                content_note), "object_marking_refs": [tlp_red_id] if sensitive else [tlp_amber_id], }
            note_ref = add_obj(objects, seen, note, uniq=("note", note["id"]))

        external_refs: List[Dict[str, Any]] = []
        if url:
            external_refs.append({"source_name": "source", "url": str(url)})
        if channel_url and channel_url != url:
            external_refs.append({"source_name": "channel_url", "url": str(channel_url)})
        if safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(safe_get(raw, "m_hash"))})
        if safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(safe_get(raw, "m_scrap_file"))})
        if safe_get(raw, "m_message_id"):
            external_refs.append({"source_name": "message_id", "external_id": str(safe_get(raw, "m_message_id"))})

        report_object_refs: List[str] = []
        for r in [infra_ref, observed_ref, note_ref, created_by_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(attack_refs)

        report: Dict[str, Any] = {"type": "report", "spec_version": "2.1", "id": stix_id(
            "report",
            f"chat:{doc_id}"), "created": created, "modified": modified, "name": caption, "description": summary if summary else None, "report_types": [
            "threat-report"], "published": created, "labels": sorted(
            labels), "lang": lang, "created_by_ref": created_by_ref, "external_references": external_refs or None, "object_refs": sorted(
            set(report_object_refs)), "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(
            doc_id), "x_orion_network": str(network) if network else None, "x_orion_platform": str(
            platform) if platform else None, "x_orion_channel_id": str(
            channel_id) if channel_id else None, "x_orion_channel_name": str(
            safe_get(raw, "m_channel_name")) if safe_get(
            raw, "m_channel_name") else None, "x_orion_views": str(safe_get(raw, "m_views")) if safe_get(
            raw, "m_views") else None, "x_orion_sender_is_bot": bool(safe_get(raw, "m_sender_is_bot")) if safe_get(
            raw, "m_sender_is_bot") is not None else None, "x_orion_is_forwarded": bool(
            safe_get(raw, "m_is_forwarded")) if safe_get(
            raw, "m_is_forwarded") is not None else None, "x_orion_is_reply": bool(
            safe_get(raw, "m_is_reply")) if safe_get(
            raw, "m_is_reply") is not None else None, "x_orion_pinned": bool(safe_get(raw, "m_pinned")) if safe_get(
            raw, "m_pinned") is not None else None, }
        report = {k: v for k, v in report.items() if v is not None}
        add_obj(objects, seen, report, uniq=("report", report["id"]))

        bundle = {"type": "bundle", "id": stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": objects, }
        return bundle

# noinspection PyArgumentList
class StixManager:
    __instance: Optional["StixManager"] = None

    def __init__(self):
        if StixManager.__instance is not None:
            raise Exception("This class is a singleton!")

        if search_model is None:
            # Allow the conversion helpers to be used even when Orion is not installed.
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

    async def _fetch_and_convert(self,
                                 fetch: Callable[[], Awaitable[Any]],
                                 converter: _BaseConverter) -> Dict[str, Any]:
        raw = await fetch()
        # Preserve the original behavior where raw is coerced into an attribute-access object.
        raw = _to_attr_obj(raw)
        return converter.convert(raw)

    async def get_defacement_stix(self, doc_id: str) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(
            lambda: self._search_model.request_defacement_doc(doc_id),
            self._defacement,
        )

    async def get_exploit_stix(self, doc_id: str) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(
            lambda: self._search_model.request_exploit_doc(doc_id),
            self._exploit,
        )

    async def get_leak_stix(self, doc_id: str) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(
            lambda: self._search_model.request_leak_doc(doc_id),
            self._leak,
        )

    async def get_social_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(
            lambda: self._search_model.request_social_doc(doc_id, lang),
            self._social,
        )

    async def get_general_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(
            lambda: self._search_model.request_general_doc(doc_id, lang),
            self._general,
        )

    async def get_chat_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        if self._search_model is None:
            raise RuntimeError("search_model is unavailable (Orion is not installed).")
        return await self._fetch_and_convert(
            lambda: self._search_model.request_chat_doc(doc_id, lang),
            self._chat,
        )

    # Backwards-compatible private wrappers (some callers may still use these).
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

