from __future__ import annotations

from datetime import datetime, timezone
import re
import uuid
from typing import Any, Dict, List


def _as_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return [item for item in value if item not in (None, "")]
    if value == "":
        return []
    return [value]


def _get(raw: Any, key: str) -> Any:
    try:
        return getattr(raw, key)
    except Exception:
        return None


def _first(raw: Any, keys: List[str], default: Any = None) -> Any:
    for key in keys:
        value = _get(raw, key)
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        if isinstance(value, list) and len(value) == 0:
            continue
        return value
    return default


def _clean(values: List[Any]) -> List[str]:
    out: List[str] = []
    seen: set[str] = set()
    for value in values:
        text = str(value).strip()
        if not text:
            continue
        if text in seen:
            continue
        seen.add(text)
        out.append(text)
    return out


def _stix_id(stix_type: str, seed: str) -> str:
    return f"{stix_type}--{uuid.uuid5(uuid.NAMESPACE_URL, f'{stix_type}:{seed}')}"


def _parse_ts(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
            dt = datetime.fromisoformat(text).replace(tzinfo=timezone.utc)
        else:
            if text.endswith("Z"):
                text = text[:-1] + "+00:00"
            dt = datetime.fromisoformat(text)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            dt = dt.astimezone(timezone.utc)
        return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    except Exception:
        return None


def _now_ts() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


PROFILES: Dict[str, Dict[str, Any]] = {
    "general": {
        "title": ["m_title", "m_url", "m_base_url"],
        "summary": ["m_important_content", "m_meta_description", "m_content"],
        "url": ["m_url", "m_base_url"],
        "base_url": ["m_base_url"],
        "created": ["m_creation_date", "m_update_date"],
        "tag": "orion:general",
    },
    "leak": {
        "title": ["m_title", "m_url", "m_base_url"],
        "summary": ["m_important_content", "m_content"],
        "url": ["m_url", "m_base_url"],
        "base_url": ["m_base_url"],
        "created": ["m_creation_date", "m_update_date", "m_leak_date"],
        "tag": "orion:leak",
    },
    "defacement": {
        "title": ["m_title", "m_url", "m_base_url", "m_content"],
        "summary": ["m_content", "m_important_content"],
        "url": ["m_url", "m_base_url", "m_source_url"],
        "base_url": ["m_base_url"],
        "created": ["m_leak_date", "m_creation_date", "m_update_date"],
        "tag": "orion:defacement",
    },
    "exploit": {
        "title": ["m_title", "m_url", "m_name"],
        "summary": ["m_important_content", "m_content", "m_code_snippet"],
        "url": ["m_url", "m_weblink"],
        "base_url": ["m_base_url"],
        "created": ["m_creation_date", "m_update_date", "m_leak_date"],
        "tag": "orion:exploit",
    },
    "chat": {
        "title": ["m_caption", "m_content", "m_channel_name"],
        "summary": ["m_content", "m_media_caption"],
        "url": ["m_message_sharable_link", "m_media_url", "m_channel_url"],
        "base_url": ["m_channel_url"],
        "created": ["m_creation_date", "m_update_date", "m_message_date"],
        "tag": "orion:chat",
    },
    "social": {
        "title": ["m_title", "m_url", "m_channel_url"],
        "summary": ["m_content", "m_important_content", "m_meta_description"],
        "url": ["m_message_sharable_link", "m_channel_url", "m_url"],
        "base_url": ["m_channel_url", "m_base_url"],
        "created": ["m_creation_date", "m_update_date", "m_message_date"],
        "tag": "orion:social",
    },
}


IOC_KEYS = {
    "domains": ["m_domain"],
    "urls": ["m_url", "m_weblink", "m_social_media_profiles", "m_source_url", "m_mirror_links", "m_dumplink", "m_websites", "m_message_sharable_link", "m_channel_url", "m_base_url"],
    "ips": ["m_ip"],
    "emails": ["m_email"],
    "cves": ["m_cve", "m_cwe"],
}


def _extract_iocs(raw: Any, primary_url: str | None) -> Dict[str, List[str]]:
    values: Dict[str, List[str]] = {"domains": [], "urls": [], "ips": [], "emails": [], "cves": []}
    for target, keys in IOC_KEYS.items():
        collected: List[Any] = []
        for key in keys:
            collected.extend(_as_list(_get(raw, key)))
        values[target] = _clean(collected)

    if primary_url:
        values["urls"] = _clean(values["urls"] + [primary_url])

    http_urls: List[str] = []
    for url in values["urls"]:
        if url.startswith("http://") or url.startswith("https://"):
            http_urls.append(url)
    values["urls"] = _clean(http_urls)

    cve_tokens = []
    for token in values["cves"]:
        upper = token.upper()
        if upper.startswith("CVE-") or upper.startswith("CWE-"):
            cve_tokens.append(upper)
    values["cves"] = _clean(cve_tokens)
    return values


def _indicator_patterns(iocs: Dict[str, List[str]]) -> List[tuple[str, str]]:
    patterns: List[tuple[str, str]] = []
    if iocs["domains"]:
        vals = ", ".join(f"'{v}'" for v in iocs["domains"])
        patterns.append(("Domains", f"[domain-name:value IN ({vals})]"))
    if iocs["urls"]:
        vals = ", ".join(f"'{v}'" for v in iocs["urls"])
        patterns.append(("URLs", f"[url:value IN ({vals})]"))
    if iocs["ips"]:
        v4 = [ip for ip in iocs["ips"] if ":" not in ip]
        v6 = [ip for ip in iocs["ips"] if ":" in ip]
        if v4:
            vals = ", ".join(f"'{v}'" for v in _clean(v4))
            patterns.append(("IPv4", f"[ipv4-addr:value IN ({vals})]"))
        if v6:
            vals = ", ".join(f"'{v}'" for v in _clean(v6))
            patterns.append(("IPv6", f"[ipv6-addr:value IN ({vals})]"))
    if iocs["emails"]:
        vals = ", ".join(f"'{v}'" for v in iocs["emails"])
        patterns.append(("Emails", f"[email-addr:value IN ({vals})]"))
    return patterns


def convert_to_stix(kind: str, raw: Any) -> Dict[str, Any]:
    profile = PROFILES[kind]

    created = _now_ts()
    for key in profile["created"]:
        parsed = _parse_ts(_get(raw, key))
        if parsed:
            created = parsed
            break

    modified = _parse_ts(_get(raw, "m_update_date")) or created
    if modified < created:
        modified = created

    title = str(_first(raw, profile["title"], profile["default_title"] if "default_title" in profile else f"{kind.title()} - unknown title"))
    summary = str(_first(raw, profile["summary"], ""))
    url = _first(raw, profile["url"])
    base_url = _first(raw, profile["base_url"])
    network = _get(raw, "m_network")
    platform = _get(raw, "m_platform")
    doc_id = str(_first(raw, ["m_document_id", "m_hash"], url or base_url or title))
    lang_value = _as_list(_get(raw, "m_language"))
    lang = str(lang_value[0]).strip() if len(lang_value) == 1 and str(lang_value[0]).strip() else None

    content_types = _clean(_as_list(_get(raw, "m_content_type")) + _as_list(_get(raw, "content_type")))
    labels = _clean(content_types + ([str(network).strip().lower()] if network else []) + ([f"platform:{str(platform).strip().lower()}"] if platform else []) + [profile["tag"]])

    iocs = _extract_iocs(raw, str(url) if url else None)

    objects: List[Dict[str, Any]] = []
    seen: set[str] = set()

    def add_obj(obj: Dict[str, Any]) -> str:
        oid = obj["id"]
        if oid in seen:
            return oid
        seen.add(oid)
        objects.append(obj)
        return oid

    tlp_amber_id = _stix_id("marking-definition", "tlp:amber")
    add_obj({"type": "marking-definition", "spec_version": "2.1", "id": tlp_amber_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "amber"}})

    actor_ref: str | None = None
    actor_name = _first(raw, ["m_team", "m_author", "m_name"])
    if actor_name and str(actor_name).strip():
        actor = {
            "type": "intrusion-set",
            "spec_version": "2.1",
            "id": _stix_id("intrusion-set", f"team:{str(actor_name).strip()}"),
            "created": created,
            "modified": modified,
            "name": str(actor_name).strip(),
            "description": summary if summary else None,
            "object_marking_refs": [tlp_amber_id],
        }
        actor = {k: v for k, v in actor.items() if v is not None}
        actor_ref = add_obj(actor)

    created_by_ref: str | None = None
    author_name = _first(raw, ["m_sender_username", "m_author", "m_username", "m_users"])
    if author_name and str(author_name).strip():
        author_text = str(author_name).strip()
        created_by_ref = add_obj({
            "type": "identity",
            "spec_version": "2.1",
            "id": _stix_id("identity", f"author:{author_text}"),
            "created": created,
            "modified": modified,
            "name": author_text,
            "identity_class": "individual",
            "object_marking_refs": [tlp_amber_id],
        })

    sco_refs: List[str] = []
    for value in iocs["urls"]:
        sco_refs.append(add_obj({"type": "url", "id": _stix_id("url", value), "value": value}))
    for value in iocs["domains"]:
        sco_refs.append(add_obj({"type": "domain-name", "id": _stix_id("domain-name", value), "value": value}))
    for value in iocs["ips"]:
        if ":" in value:
            sco_refs.append(add_obj({"type": "ipv6-addr", "id": _stix_id("ipv6-addr", value), "value": value}))
        else:
            sco_refs.append(add_obj({"type": "ipv4-addr", "id": _stix_id("ipv4-addr", value), "value": value}))
    for value in iocs["emails"]:
        sco_refs.append(add_obj({"type": "email-addr", "id": _stix_id("email-addr", value.lower()), "value": value}))

    observed_ref: str | None = None
    if sco_refs:
        observed_ref = add_obj({
            "type": "observed-data",
            "spec_version": "2.1",
            "id": _stix_id("observed-data", f"{doc_id}|{created}"),
            "created": created,
            "modified": modified,
            "first_observed": created,
            "last_observed": modified,
            "number_observed": 1,
            "object_refs": _clean(sco_refs),
            "object_marking_refs": [tlp_amber_id],
        })

    indicator_refs: List[str] = []
    for name, pattern in _indicator_patterns(iocs):
        indicator = {
            "type": "indicator",
            "spec_version": "2.1",
            "id": _stix_id("indicator", f"{name}|{pattern}"),
            "created": created,
            "modified": modified,
            "name": name,
            "description": summary if summary else None,
            "indicator_types": ["malicious-activity"],
            "pattern_type": "stix",
            "pattern": pattern,
            "valid_from": created,
            "labels": labels,
            "object_marking_refs": [tlp_amber_id],
        }
        indicator_refs.append(add_obj(indicator))

    vuln_refs: List[str] = []
    for token in iocs["cves"]:
        if token.startswith("CVE-"):
            ref = {"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}
        elif token.startswith("CWE-"):
            cwe_num = token.replace("CWE-", "")
            if not cwe_num.isdigit():
                continue
            ref = {"source_name": "cwe", "external_id": token, "url": f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"}
        else:
            continue
        vuln_refs.append(add_obj({
            "type": "vulnerability",
            "spec_version": "2.1",
            "id": _stix_id("vulnerability", token),
            "created": created,
            "modified": modified,
            "name": token,
            "external_references": [ref],
            "object_marking_refs": [tlp_amber_id],
        }))

    infra_ref: str | None = None
    infra_seed = str(base_url or url or (iocs["domains"][0] if iocs["domains"] else "")).strip()
    if infra_seed:
        infra_ref = add_obj({
            "type": "infrastructure",
            "spec_version": "2.1",
            "id": _stix_id("infrastructure", f"infra:{infra_seed}"),
            "created": created,
            "modified": modified,
            "name": str(_first(raw, ["m_name", "m_channel_name"], title)),
            "description": summary if summary else None,
            "infrastructure_types": ["anonymization"] if str(network or "").lower() == "onion" else ["unknown"],
            "first_seen": created,
            "last_seen": modified,
            "labels": labels,
            "object_marking_refs": [tlp_amber_id],
            "x_orion_network": str(network) if network else None,
        })

    if actor_ref and infra_ref:
        add_obj({
            "type": "relationship",
            "spec_version": "2.1",
            "id": _stix_id("relationship", f"{actor_ref}|uses|{infra_ref}"),
            "created": created,
            "modified": modified,
            "relationship_type": "uses",
            "source_ref": actor_ref,
            "target_ref": infra_ref,
            "object_marking_refs": [tlp_amber_id],
        })

    note_content: Dict[str, Any] = {}
    hashtags = _clean([str(v).lstrip("#") for v in _as_list(_get(raw, "m_hashtag"))])
    mentions = _clean([str(v).lstrip("@") for v in _as_list(_get(raw, "m_mention"))])
    if hashtags:
        note_content["hashtags"] = hashtags
    if mentions:
        note_content["mentions"] = mentions

    note_ref: str | None = None
    if note_content:
        note_ref = add_obj({
            "type": "note",
            "spec_version": "2.1",
            "id": _stix_id("note", f"meta|{doc_id}|{created}"),
            "created": created,
            "modified": modified,
            "abstract": "Metadata",
            "content": str(note_content),
            "object_marking_refs": [tlp_amber_id],
        })

    external_refs: List[Dict[str, Any]] = []
    if url:
        external_refs.append({"source_name": "source", "url": str(url)})
    if base_url and base_url != url:
        external_refs.append({"source_name": "base_url", "url": str(base_url)})
    hash_val = _get(raw, "m_hash")
    if hash_val:
        external_refs.append({"source_name": "content-hash", "external_id": str(hash_val)})

    object_refs = _clean([
        actor_ref,
        infra_ref,
        observed_ref,
        note_ref,
        created_by_ref,
        *indicator_refs,
        *vuln_refs,
    ])

    report = {
        "type": "report",
        "spec_version": "2.1",
        "id": _stix_id("report", f"{kind}:{doc_id}"),
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
        "object_refs": object_refs,
        "object_marking_refs": [tlp_amber_id],
        "x_orion_doc_id": doc_id,
        "x_orion_network": str(network) if network else None,
        "x_orion_platform": str(platform) if platform else None,
    }
    report = {k: v for k, v in report.items() if v is not None}
    add_obj(report)

    return {
        "type": "bundle",
        "id": _stix_id("bundle", report["id"]),
        "spec_version": "2.1",
        "objects": objects,
    }
