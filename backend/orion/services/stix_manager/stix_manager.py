from __future__ import annotations

import hashlib
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple, Type, TypeVar

from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import (
    result_item as DefacementResultItem,
)
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import (
    result_item as ExploitResultItem,
)
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import (
    result_item as LeakResultItem,
)
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import (
    result_item as SocialResultItem,
)
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import (
    result_item as GeneralResultItem,
)
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import (
    result_item as ChatResultItem,
)
from orion.api.interactive.search_manager.search_model import search_model

STIX_TEMPLATE = {
    "Title": "",
    "Date": "",
    "Network": "",
    "Country": "",
    "SUMMARY": "",
    "TRENDS": {
        "Dates": None,
        "Scale": None,
        "Impacted Region": None,
        "Sector": None,
        "Volume": None,
    },
    "INSIGHTS": {
        "Breach Type": None,
        "Attack Vector": None,
        "Data Exposed": None,
        "MITRE ATT&CK TTPs": None,
    },
    "CONCLUSION": "",
}

_T = TypeVar("_T")


def _safe_get(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _as_list(v: Any) -> List[Any]:
    if v is None:
        return []
    if isinstance(v, list):
        return [x for x in v if x is not None and x != ""]
    return [v] if v != "" else []


def _first_nonempty(*vals: Any) -> Optional[Any]:
    for v in vals:
        if v is None:
            continue
        if isinstance(v, str) and not v.strip():
            continue
        if isinstance(v, list) and len(v) == 0:
            continue
        return v
    return None


def _clean_text(s: str) -> str:
    if not s:
        return ""
    s = s.replace("\r\n", "\n")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def _parse_ts(value: Any, *, allow_date_only: bool = True) -> Optional[str]:
    if value is None:
        return None
    try:
        v = str(value).strip()
        if not v:
            return None
        if allow_date_only and re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
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


def _now_ts() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _uuid5(seed: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, seed))


def _stix_id(stix_type: str, seed: str) -> str:
    return f"{stix_type}--{_uuid5(f'{stix_type}:{seed}')}"


def _sco_id(sco_type: str, seed: str) -> str:
    return f"{sco_type}--{_uuid5(f'{sco_type}:{seed}')}"


def _sha256(v: str) -> str:
    return hashlib.sha256(v.encode("utf-8", errors="ignore")).hexdigest()


def _escape_pat(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def _dedup_sorted_str(items: Iterable[Any]) -> List[str]:
    out: List[str] = []
    seen: Set[str] = set()
    for it in items:
        if it is None:
            continue
        s = str(it).strip()
        if not s:
            continue
        if s in seen:
            continue
        seen.add(s)
        out.append(s)
    return sorted(out)


def _filter_http_urls(items: Iterable[Any]) -> List[str]:
    out: List[str] = []
    for it in items:
        if it is None:
            continue
        s = str(it).strip()
        if not s:
            continue
        if s.startswith(("http://", "https://")):
            out.append(s)
    return out


def _asn_digits(items: Iterable[Any]) -> List[str]:
    raw = []
    for it in items:
        if it is None:
            continue
        s = str(it).strip().upper().lstrip("AS")
        if not s:
            continue
        raw.append(s)
    return sorted(set([a for a in raw if a.isdigit()]))


def _content_types(raw: Any, *, default: Optional[Set[str]] = None) -> Set[str]:
    cts = set(
        str(x).strip().lower()
        for x in (_as_list(_safe_get(raw, "m_content_type")) + _as_list(_safe_get(raw, "content_type")))
        if str(x).strip()
    )
    if not cts and default:
        return set(default)
    return cts


def _labels_for(raw: Any, *, content_types: Set[str], network: Any, platform: Any, tag: str) -> Set[str]:
    labels: Set[str] = set()
    for ct in sorted(content_types):
        labels.add(ct)
    if network:
        labels.add(str(network).strip().lower())
    if platform:
        labels.add(f"platform:{str(platform).strip().lower()}")
    labels.add(tag)
    return labels


def _single_lang(raw: Any) -> Optional[str]:
    langs = [str(x).strip() for x in _as_list(_safe_get(raw, "m_language")) if str(x).strip()]
    return langs[0] if len(langs) == 1 else None


def _external_refs(
    *,
    url: Any = None,
    base_url: Any = None,
    channel_url: Any = None,
    share_link: Any = None,
    content_hash: Any = None,
    scrap_file: Any = None,
    screenshot: Any = None,
    message_id: Any = None,
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    if url:
        out.append({"source_name": "source", "url": str(url)})
    if base_url and str(base_url) != str(url):
        out.append({"source_name": "base_url", "url": str(base_url)})
    if channel_url and str(channel_url) != str(url):
        out.append({"source_name": "channel_url", "url": str(channel_url)})
    if share_link:
        out.append({"source_name": "share_link", "url": str(share_link)})
    if content_hash:
        out.append({"source_name": "content-hash", "external_id": str(content_hash)})
    if scrap_file:
        out.append({"source_name": "scraper", "external_id": str(scrap_file)})
    if screenshot:
        out.append({"source_name": "screenshot", "external_id": str(screenshot)})
    if message_id:
        out.append({"source_name": "message_id", "external_id": str(message_id)})
    return out


def _coerce_model(model_cls: Type[_T], raw: Any) -> Optional[_T]:
    if raw is None:
        return None
    if isinstance(raw, model_cls):
        return raw
    if isinstance(raw, dict):
        return model_cls(**raw)  # type: ignore[misc]
    if hasattr(raw, "model_dump"):
        return model_cls(**raw.model_dump())  # type: ignore[misc]
    if hasattr(raw, "dict"):
        return model_cls(**raw.dict())  # type: ignore[misc]
    d = getattr(raw, "__dict__", None)
    if isinstance(d, dict):
        return model_cls(**d)  # type: ignore[misc]
    return model_cls(**{"value": raw})  # type: ignore[misc]


class _StixBuilder:
    def __init__(self, created: str, modified: str):
        self.created = created
        self.modified = modified
        self.objects: List[Dict[str, Any]] = []
        self.seen: Dict[Tuple[str, str], str] = {}
        self.tlp_amber_id = _stix_id("marking-definition", "tlp:amber")
        self.tlp_red_id = _stix_id("marking-definition", "tlp:red")
        self._add(
            {
                "type": "marking-definition",
                "spec_version": "2.1",
                "id": self.tlp_amber_id,
                "created": created,
                "definition_type": "tlp",
                "definition": {"tlp": "amber"},
            },
            uniq=("marking-definition", "tlp:amber"),
        )
        self._add(
            {
                "type": "marking-definition",
                "spec_version": "2.1",
                "id": self.tlp_red_id,
                "created": created,
                "definition_type": "tlp",
                "definition": {"tlp": "red"},
            },
            uniq=("marking-definition", "tlp:red"),
        )

    def _add(self, obj: Dict[str, Any], *, uniq: Optional[Tuple[str, str]] = None) -> str:
        oid = obj["id"]
        if uniq is not None:
            existing = self.seen.get(uniq)
            if existing:
                return existing
            self.seen[uniq] = oid
        self.objects.append(obj)
        return oid

    def add_clean(self, obj: Dict[str, Any], *, uniq: Optional[Tuple[str, str]] = None) -> str:
        obj = {k: v for k, v in obj.items() if v is not None}
        return self._add(obj, uniq=uniq)

    def add_location(self, country: str) -> str:
        cc = str(country).strip()
        return self.add_clean(
            {
                "type": "location",
                "spec_version": "2.1",
                "id": _stix_id("location", f"country:{cc}"),
                "created": self.created,
                "modified": self.modified,
                "name": cc,
                "country": cc,
                "object_marking_refs": [self.tlp_amber_id],
            },
            uniq=("location", f"country:{cc}"),
        )

    def add_identity(self, *, seed: str, name: str, identity_class: str, sectors: Optional[List[str]] = None) -> str:
        return self.add_clean(
            {
                "type": "identity",
                "spec_version": "2.1",
                "id": _stix_id("identity", seed),
                "created": self.created,
                "modified": self.modified,
                "name": name,
                "identity_class": identity_class,
                "sectors": sectors,
                "object_marking_refs": [self.tlp_amber_id],
            },
            uniq=("identity", seed),
        )

    def add_intrusion_set(self, *, seed: str, name: str, description: Optional[str]) -> str:
        return self.add_clean(
            {
                "type": "intrusion-set",
                "spec_version": "2.1",
                "id": _stix_id("intrusion-set", seed),
                "created": self.created,
                "modified": self.modified,
                "name": name,
                "description": description,
                "object_marking_refs": [self.tlp_amber_id],
            },
            uniq=("intrusion-set", seed),
        )

    def add_infrastructure(
        self,
        *,
        seed: str,
        name: str,
        description: Optional[str],
        infra_types: List[str],
        labels: List[str],
        x_fields: Optional[Dict[str, Any]] = None,
        marking_refs: Optional[List[str]] = None,
    ) -> str:
        obj: Dict[str, Any] = {
            "type": "infrastructure",
            "spec_version": "2.1",
            "id": _stix_id("infrastructure", seed),
            "created": self.created,
            "modified": self.modified,
            "name": name,
            "description": description,
            "infrastructure_types": infra_types,
            "first_seen": self.created,
            "last_seen": self.modified,
            "labels": labels,
            "object_marking_refs": marking_refs or [self.tlp_amber_id],
        }
        if x_fields:
            obj.update(x_fields)
        return self.add_clean(obj, uniq=("infrastructure", seed))

    def add_relationship(self, *, seed: str, relationship_type: str, source_ref: str, target_ref: str) -> str:
        return self.add_clean(
            {
                "type": "relationship",
                "spec_version": "2.1",
                "id": _stix_id("relationship", seed),
                "created": self.created,
                "modified": self.modified,
                "relationship_type": relationship_type,
                "source_ref": source_ref,
                "target_ref": target_ref,
                "object_marking_refs": [self.tlp_amber_id],
            },
            uniq=("relationship", seed),
        )

    def add_sco(self, obj: Dict[str, Any], *, uniq: Tuple[str, str]) -> str:
        return self._add(obj, uniq=uniq)

    def add_observed_data(self, *, seed: str, object_refs: List[str]) -> str:
        obs = {
            "type": "observed-data",
            "spec_version": "2.1",
            "id": _stix_id("observed-data", seed),
            "created": self.created,
            "modified": self.modified,
            "first_observed": self.created,
            "last_observed": self.modified,
            "number_observed": 1,
            "object_refs": sorted(set(object_refs)),
            "object_marking_refs": [self.tlp_amber_id],
        }
        return self._add(obs, uniq=("observed-data", obs["id"]))

    def add_indicator(
        self,
        *,
        seed: str,
        name: str,
        description: Optional[str],
        indicator_types: List[str],
        pattern_type: str,
        pattern: str,
        labels: List[str],
        marking_refs: Optional[List[str]] = None,
    ) -> str:
        ind: Dict[str, Any] = {
            "type": "indicator",
            "spec_version": "2.1",
            "id": _stix_id("indicator", seed),
            "created": self.created,
            "modified": self.modified,
            "name": name,
            "description": description,
            "indicator_types": indicator_types,
            "pattern_type": pattern_type,
            "pattern": pattern,
            "valid_from": self.created,
            "labels": labels,
            "object_marking_refs": marking_refs or [self.tlp_amber_id],
        }
        ind = {k: v for k, v in ind.items() if v is not None}
        return self._add(ind, uniq=("indicator", ind["id"]))

    def add_vulnerability(self, *, token: str) -> str:
        t = token.strip().upper()
        if t.startswith("CVE-"):
            v = {
                "type": "vulnerability",
                "spec_version": "2.1",
                "id": _stix_id("vulnerability", t),
                "created": self.created,
                "modified": self.modified,
                "name": t,
                "external_references": [{"source_name": "nvd", "external_id": t, "url": f"https://nvd.nist.gov/vuln/detail/{t}"}],
                "object_marking_refs": [self.tlp_amber_id],
            }
            return self._add(v, uniq=("vulnerability", t))
        if t.startswith("CWE-"):
            cwe_num = t.replace("CWE-", "")
            if cwe_num.isdigit():
                v = {
                    "type": "vulnerability",
                    "spec_version": "2.1",
                    "id": _stix_id("vulnerability", t),
                    "created": self.created,
                    "modified": self.modified,
                    "name": t,
                    "external_references": [
                        {"source_name": "cwe", "external_id": t, "url": f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"}
                    ],
                    "object_marking_refs": [self.tlp_amber_id],
                }
                return self._add(v, uniq=("vulnerability", t))
        v = {
            "type": "vulnerability",
            "spec_version": "2.1",
            "id": _stix_id("vulnerability", t),
            "created": self.created,
            "modified": self.modified,
            "name": t,
            "object_marking_refs": [self.tlp_amber_id],
        }
        return self._add(v, uniq=("vulnerability", t))

    def add_attack_pattern(self, *, tech: str, tactics: List[str]) -> Optional[str]:
        t = tech.strip().upper()
        if not re.match(r"^(T\d{4})(\.\d{3})?$", t):
            return None
        base = t.split(".")[0]
        ap: Dict[str, Any] = {
            "type": "attack-pattern",
            "spec_version": "2.1",
            "id": _stix_id("attack-pattern", t),
            "created": self.created,
            "modified": self.modified,
            "name": t,
            "external_references": [{"source_name": "mitre-attack", "external_id": t, "url": f"https://attack.mitre.org/techniques/{base}/"}],
            "kill_chain_phases": [{"kill_chain_name": "mitre-attack", "phase_name": ph} for ph in sorted(set(tactics))] if tactics else None,
            "object_marking_refs": [self.tlp_amber_id],
        }
        ap = {k: v for k, v in ap.items() if v is not None}
        return self._add(ap, uniq=("attack-pattern", t))

    def add_note(self, *, seed: str, abstract: str, content: str, tlp: str) -> str:
        refs = [self.tlp_red_id] if tlp == "red" else [self.tlp_amber_id]
        note = {
            "type": "note",
            "spec_version": "2.1",
            "id": _stix_id("note", seed),
            "created": self.created,
            "modified": self.modified,
            "abstract": abstract,
            "content": content,
            "object_marking_refs": refs,
        }
        return self._add(note, uniq=("note", note["id"]))

    def add_report(
        self,
        *,
        seed: str,
        name: str,
        description: Optional[str],
        report_types: List[str],
        labels: List[str],
        lang: Optional[str],
        external_references: Optional[List[Dict[str, Any]]],
        object_refs: List[str],
        created_by_ref: Optional[str] = None,
        x_fields: Optional[Dict[str, Any]] = None,
    ) -> str:
        report: Dict[str, Any] = {
            "type": "report",
            "spec_version": "2.1",
            "id": _stix_id("report", seed),
            "created": self.created,
            "modified": self.modified,
            "name": name,
            "description": description,
            "report_types": report_types,
            "published": self.created,
            "labels": labels,
            "lang": lang,
            "created_by_ref": created_by_ref,
            "external_references": external_references or None,
            "object_refs": sorted(set(object_refs)),
            "object_marking_refs": [self.tlp_amber_id],
        }
        if x_fields:
            report.update(x_fields)
        report = {k: v for k, v in report.items() if v is not None}
        return self._add(report, uniq=("report", report["id"]))

    def bundle(self, report_id: str) -> Dict[str, Any]:
        return {
            "type": "bundle",
            "id": _stix_id("bundle", report_id),
            "spec_version": "2.1",
            "objects": self.objects,
        }


class StixManager:
    __instance = None

    def __init__(self):
        if StixManager.__instance is not None:
            raise Exception("This class is a singleton!")
        self._search_model = search_model.getInstance()
        StixManager.__instance = self

    @staticmethod
    def get_instance():
        if StixManager.__instance is None:
            StixManager()
        return StixManager.__instance

    async def get_defacement_stix(self, doc_id: str) -> Dict[str, Any]:
        raw = await self._search_model.request_defacement_doc(doc_id)
        model = _coerce_model(DefacementResultItem, raw)
        if model is None:
            return {"error": "No defacement document found", "doc_id": doc_id}
        return self._convert_defacement(model)

    async def get_exploit_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_exploit_doc(doc_id, lang)
        model = _coerce_model(ExploitResultItem, raw)
        if model is None:
            return {"error": "No exploit document found", "doc_id": doc_id}
        return self._convert_exploit(model)

    async def get_leak_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_leak_doc(doc_id, lang)
        model = _coerce_model(LeakResultItem, raw)
        if model is None:
            return {"error": "No leak document found", "doc_id": doc_id}
        return self._convert_leak(model)

    async def get_social_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_social_doc(doc_id, lang)
        model = _coerce_model(SocialResultItem, raw)
        if model is None:
            return {"error": "No social document found", "doc_id": doc_id}
        return self._convert_social(model)

    async def get_general_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_general_doc(doc_id, lang)
        model = _coerce_model(GeneralResultItem, raw)
        if model is None:
            return {"error": "No general document found", "doc_id": doc_id}
        return self._convert_general(model)

    async def get_chat_stix(self, doc_id: str, lang: Optional[str] = None) -> Dict[str, Any]:
        raw = await self._search_model.request_chat_doc(doc_id, lang)
        model = _coerce_model(ChatResultItem, raw)
        if model is None:
            return {"error": "No chat document found", "doc_id": doc_id}
        return self._convert_chat(model)

    def _convert_defacement(self, raw: DefacementResultItem) -> Dict[str, Any]:
        created = (
            _parse_ts(_safe_get(raw, "m_leak_date"))
            or _parse_ts(_safe_get(raw, "m_creation_date"))
            or _parse_ts(_safe_get(raw, "m_update_date"))
            or _now_ts()
        )
        modified = _parse_ts(_safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title = _first_nonempty(
            _safe_get(raw, "m_title"),
            _safe_get(raw, "m_url"),
            _safe_get(raw, "m_base_url"),
            (_as_list(_safe_get(raw, "m_mirror_links"))[0] if _as_list(_safe_get(raw, "m_mirror_links")) else None),
            (str(_safe_get(raw, "m_content")).splitlines()[0] if _safe_get(raw, "m_content") else None),
            "Defacement - unknown title",
        )
        title = str(title)

        url = _first_nonempty(
            _safe_get(raw, "m_url"),
            _safe_get(raw, "m_base_url"),
            (_as_list(_safe_get(raw, "m_source_url"))[0] if _as_list(_safe_get(raw, "m_source_url")) else None),
            (_as_list(_safe_get(raw, "m_mirror_links"))[0] if _as_list(_safe_get(raw, "m_mirror_links")) else None),
        )
        base_url = _safe_get(raw, "m_base_url")
        network = _safe_get(raw, "m_network")
        platform = _safe_get(raw, "m_platform")
        doc_seed = _first_nonempty(_safe_get(raw, "m_document_id"), _safe_get(raw, "m_hash"), url, base_url, title)
        doc_seed = str(doc_seed)

        content_src = _first_nonempty(_safe_get(raw, "m_content"), _safe_get(raw, "m_important_content"), "")
        summary = _clean_text(str(content_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        cts = _content_types(raw, default={"defacement"})
        labels = _labels_for(raw, content_types=cts, network=network, platform=platform, tag="orion:defacement")
        lang = _single_lang(raw)

        b = _StixBuilder(created, modified)

        location_refs: List[str] = []
        for c in (_as_list(_safe_get(raw, "m_country")) or _as_list(_safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            location_refs.append(b.add_location(cc))

        domain_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_domain")))
        url_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_url")))
        ip_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_ip")))
        email_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_email")))
        asn_vals = _asn_digits(_as_list(_safe_get(raw, "m_asns")))
        file_paths = _dedup_sorted_str(_as_list(_safe_get(raw, "m_file_paths")))

        encoded_urls = _filter_http_urls(_as_list(_safe_get(raw, "m_encoded_urls")))
        mirror_links = _filter_http_urls(_as_list(_safe_get(raw, "m_mirror_links")))
        source_urls = _filter_http_urls(_as_list(_safe_get(raw, "m_source_url")))

        url_vals = _dedup_sorted_str(list(url_vals) + encoded_urls + mirror_links + source_urls + ([str(url)] if url else []))

        infra_seed = _first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_ref = None
        if infra_seed:
            infra_ref = b.add_infrastructure(
                seed=f"infra:{infra_seed}",
                name=title,
                description=summary if summary else None,
                infra_types=["unknown"],
                labels=sorted(labels),
                x_fields={"x_orion_network": str(network) if network else None},
            )

        sco_refs: List[str] = []

        for u in url_vals:
            sco_refs.append(b.add_sco({"type": "url", "id": _sco_id("url", u), "value": u}, uniq=("url", u)))

        for d in domain_vals:
            sco_refs.append(b.add_sco({"type": "domain-name", "id": _sco_id("domain-name", d), "value": d}, uniq=("domain-name", d)))

        for ip in ip_vals:
            if ":" in ip:
                sco_refs.append(b.add_sco({"type": "ipv6-addr", "id": _sco_id("ipv6-addr", ip), "value": ip}, uniq=("ipv6-addr", ip)))
            else:
                sco_refs.append(b.add_sco({"type": "ipv4-addr", "id": _sco_id("ipv4-addr", ip), "value": ip}, uniq=("ipv4-addr", ip)))

        for e in email_vals:
            el = e.lower()
            sco_refs.append(b.add_sco({"type": "email-addr", "id": _sco_id("email-addr", el), "value": e}, uniq=("email-addr", el)))

        for a in asn_vals:
            sco_refs.append(b.add_sco({"type": "autonomous-system", "id": _sco_id("autonomous-system", a), "number": int(a)}, uniq=("autonomous-system", a)))

        for p in file_paths:
            sco_refs.append(b.add_sco({"type": "directory", "id": _sco_id("directory", p), "path": p}, uniq=("directory", p)))

        observed_ref = None
        if sco_refs:
            observed_ref = b.add_observed_data(seed=f"{doc_seed}|{created}", object_refs=sco_refs)

        indicator_refs: List[str] = []

        def add_stix_indicator(name: str, pattern: str, types: List[str]) -> None:
            indicator_refs.append(
                b.add_indicator(
                    seed=f"{name}|{pattern}",
                    name=name,
                    description=summary if summary else None,
                    indicator_types=types,
                    pattern_type="stix",
                    pattern=pattern,
                    labels=sorted(labels),
                )
            )

        if domain_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in domain_vals)
            add_stix_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"])

        if url_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in url_vals)
            add_stix_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"])

        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v4)
                add_stix_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"])
            if v6:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v6)
                add_stix_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"])

        if email_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in email_vals)
            add_stix_indicator("Emails", f"[email-addr:value IN ({vals})]", ["malicious-activity"])

        for yr in _as_list(_safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            indicator_refs.append(
                b.add_indicator(
                    seed=f"yara|{_sha256(rule)}",
                    name="YARA Rule",
                    description=None,
                    indicator_types=[],
                    pattern_type="yara",
                    pattern=rule,
                    labels=sorted(labels),
                )
            )

        vuln_refs: List[str] = []
        for c in _as_list(_safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            vuln_refs.append(b.add_vulnerability(token=token))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in _as_list(_safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in _as_list(_safe_get(raw, "m_enterprise_attack_techniques")) if str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            ap = b.add_attack_pattern(tech=tech, tactics=tactics)
            if ap:
                attack_refs.append(ap)

        attack_vector = _first_nonempty(
            (_as_list(_safe_get(raw, "m_ioc_type"))[0] if _as_list(_safe_get(raw, "m_ioc_type")) else None),
            (_as_list(_safe_get(raw, "m_web_server"))[0] if _as_list(_safe_get(raw, "m_web_server")) else None),
            "Unknown",
        )
        attack_vector = str(attack_vector)

        ext_refs = _external_refs(
            url=url,
            base_url=base_url,
            content_hash=_safe_get(raw, "m_hash"),
            scrap_file=_safe_get(raw, "m_scrap_file"),
        )

        report_object_refs: List[str] = []
        for r in [infra_ref, observed_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report_id = b.add_report(
            seed=f"defacement:{doc_seed}",
            name=title,
            description=summary if summary else None,
            report_types=["threat-report"],
            labels=sorted(labels),
            lang=lang,
            external_references=ext_refs or None,
            object_refs=report_object_refs,
            x_fields={
                "x_orion_doc_id": str(doc_seed),
                "x_orion_network": str(network) if network else None,
                "x_orion_attack_vector": attack_vector,
                "x_orion_mirror_links_count": str(len(_filter_http_urls(_as_list(_safe_get(raw, "m_mirror_links"))))) if _safe_get(raw, "m_mirror_links") else None,
            },
        )
        return b.bundle(report_id)

    def _convert_exploit(self, raw: ExploitResultItem) -> Dict[str, Any]:
        created = (
            _parse_ts(_safe_get(raw, "m_creation_date"))
            or _parse_ts(_safe_get(raw, "m_update_date"))
            or _parse_ts(_safe_get(raw, "m_leak_date"))
            or _now_ts()
        )
        modified = _parse_ts(_safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title = str(_first_nonempty(_safe_get(raw, "m_title"), _safe_get(raw, "m_url"), _safe_get(raw, "m_weblink"), "Exploit - unknown title"))
        url = _first_nonempty(_safe_get(raw, "m_url"), (_as_list(_safe_get(raw, "m_weblink"))[0] if _as_list(_safe_get(raw, "m_weblink")) else None))
        base_url = _safe_get(raw, "m_base_url")
        network = _safe_get(raw, "m_network")
        platform = _safe_get(raw, "m_platform")
        doc_seed = _first_nonempty(_safe_get(raw, "m_document_id"), _safe_get(raw, "m_hash"), url, base_url, title)
        doc_seed = str(doc_seed)

        content_src = _first_nonempty(_safe_get(raw, "m_important_content"), _safe_get(raw, "m_content"), "")
        summary = _clean_text(str(content_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        code_snips = [str(x) for x in _as_list(_safe_get(raw, "m_code_snippet")) if str(x).strip()]
        if code_snips and len(summary) < 600:
            extra = _clean_text(code_snips[0])
            if extra:
                summary = (summary + "\n\n" + extra) if summary else extra
                if len(summary) > 4000:
                    summary = summary[:4000] + "…"

        cts = _content_types(raw)
        labels = _labels_for(raw, content_types=cts, network=network, platform=platform, tag="orion:exploit")
        lang = _single_lang(raw)

        b = _StixBuilder(created, modified)

        location_refs: List[str] = []
        for c in (_as_list(_safe_get(raw, "m_country")) or _as_list(_safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            location_refs.append(b.add_location(cc))

        team = _first_nonempty(_safe_get(raw, "m_team"), _safe_get(raw, "m_author"), _safe_get(raw, "m_name"))
        actor_ref = None
        if team:
            tname = str(team).strip()
            if tname:
                actor_ref = b.add_intrusion_set(seed=f"team:{tname}", name=tname, description=summary if summary else None)

        domain_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_domain")))
        url_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_url")))
        ip_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_ip")))
        email_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_email")))
        asn_vals = _asn_digits(_as_list(_safe_get(raw, "m_asns")))
        file_paths = _dedup_sorted_str(_as_list(_safe_get(raw, "m_file_paths")))

        encoded_urls = _filter_http_urls(_as_list(_safe_get(raw, "m_encoded_urls")))
        weblinks = _filter_http_urls(_as_list(_safe_get(raw, "m_weblink")))
        url_vals = _dedup_sorted_str(list(url_vals) + encoded_urls + weblinks + ([str(url)] if url else []))

        infra_seed = _first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if "c2" in cts:
                infra_types = ["command-and-control"]
            elif str(network).lower() == "onion":
                infra_types = ["anonymization"]
            infra_ref = b.add_infrastructure(
                seed=f"infra:{infra_seed}",
                name=str(_first_nonempty(title, _safe_get(raw, "m_name"), "Exploit infrastructure")),
                description=summary if summary else None,
                infra_types=infra_types,
                labels=sorted(labels),
                x_fields={"x_orion_network": str(network) if network else None},
            )

        sco_refs: List[str] = []
        for u in url_vals:
            sco_refs.append(b.add_sco({"type": "url", "id": _sco_id("url", u), "value": u}, uniq=("url", u)))
        for d in domain_vals:
            sco_refs.append(b.add_sco({"type": "domain-name", "id": _sco_id("domain-name", d), "value": d}, uniq=("domain-name", d)))
        for ip in ip_vals:
            if ":" in ip:
                sco_refs.append(b.add_sco({"type": "ipv6-addr", "id": _sco_id("ipv6-addr", ip), "value": ip}, uniq=("ipv6-addr", ip)))
            else:
                sco_refs.append(b.add_sco({"type": "ipv4-addr", "id": _sco_id("ipv4-addr", ip), "value": ip}, uniq=("ipv4-addr", ip)))
        for e in email_vals:
            el = e.lower()
            sco_refs.append(b.add_sco({"type": "email-addr", "id": _sco_id("email-addr", el), "value": e}, uniq=("email-addr", el)))
        for a in asn_vals:
            sco_refs.append(b.add_sco({"type": "autonomous-system", "id": _sco_id("autonomous-system", a), "number": int(a)}, uniq=("autonomous-system", a)))
        for p in file_paths:
            sco_refs.append(b.add_sco({"type": "directory", "id": _sco_id("directory", p), "path": p}, uniq=("directory", p)))

        observed_ref = None
        if sco_refs:
            observed_ref = b.add_observed_data(seed=f"{doc_seed}|{created}", object_refs=sco_refs)

        indicator_refs: List[str] = []

        def add_stix_indicator(name: str, pattern: str, types: List[str]) -> None:
            indicator_refs.append(
                b.add_indicator(
                    seed=f"{name}|{pattern}",
                    name=name,
                    description=summary if summary else None,
                    indicator_types=types,
                    pattern_type="stix",
                    pattern=pattern,
                    labels=sorted(labels),
                )
            )

        if domain_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in domain_vals)
            add_stix_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"])
        if url_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in url_vals)
            add_stix_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"])
        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v4)
                add_stix_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"])
            if v6:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v6)
                add_stix_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"])
        if email_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in email_vals)
            add_stix_indicator("Emails", f"[email-addr:value IN ({vals})]", ["phishing"])

        for yr in _as_list(_safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            indicator_refs.append(
                b.add_indicator(
                    seed=f"yara|{_sha256(rule)}",
                    name="YARA Rule",
                    description=None,
                    indicator_types=[],
                    pattern_type="yara",
                    pattern=rule,
                    labels=sorted(labels),
                )
            )

        vuln_refs: List[str] = []
        for c in _as_list(_safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            vuln_refs.append(b.add_vulnerability(token=token))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in _as_list(_safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in _as_list(_safe_get(raw, "m_enterprise_attack_techniques")) if str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            ap = b.add_attack_pattern(tech=tech, tactics=tactics)
            if ap:
                attack_refs.append(ap)

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        def add_sensitive(cat: str, values: List[Any]) -> None:
            vals = [str(v).strip() for v in values if str(v).strip()]
            if not vals:
                return
            out: List[Dict[str, str]] = []
            for v in sorted(set(vals)):
                last4 = v[-4:] if len(v) >= 4 else v
                out.append({"sha256": _sha256(v), "last4": last4})
            sensitive[cat] = out

        add_sensitive("credit_cards", _as_list(_safe_get(raw, "m_credit_card")))
        add_sensitive("us_passport", _as_list(_safe_get(raw, "m_us_passport")))
        add_sensitive("au_abn", _as_list(_safe_get(raw, "m_au_abn")))
        add_sensitive("us_bank_number", _as_list(_safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive:
            note_ref = b.add_note(seed=f"sensitive|{doc_seed}|{created}", abstract="Sensitive artifacts (hashed)", content=str(sensitive), tlp="red")

        ext_refs = _external_refs(
            url=url,
            base_url=base_url,
            content_hash=_safe_get(raw, "m_hash"),
            scrap_file=_safe_get(raw, "m_scrap_file"),
        )

        report_object_refs: List[str] = []
        for r in [actor_ref, infra_ref, observed_ref, note_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report_id = b.add_report(
            seed=f"exploit:{doc_seed}",
            name=title,
            description=summary if summary else None,
            report_types=["threat-report"],
            labels=sorted(labels),
            lang=lang,
            external_references=ext_refs or None,
            object_refs=report_object_refs,
            x_fields={
                "x_orion_doc_id": str(doc_seed),
                "x_orion_network": str(network) if network else None,
                "x_orion_platform": str(platform) if platform else None,
            },
        )
        return b.bundle(report_id)

    def _convert_leak(self, raw: LeakResultItem) -> Dict[str, Any]:
        created = _parse_ts(_safe_get(raw, "m_creation_date")) or _parse_ts(_safe_get(raw, "m_update_date")) or _now_ts()
        modified = _parse_ts(_safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title = str(_first_nonempty(_safe_get(raw, "m_title"), _safe_get(raw, "m_url"), _safe_get(raw, "m_base_url"), "Leak - unknown title"))
        url = _first_nonempty(_safe_get(raw, "m_url"), _safe_get(raw, "m_base_url"))
        base_url = _safe_get(raw, "m_base_url")
        network = _safe_get(raw, "m_network")
        platform = _safe_get(raw, "m_platform")
        doc_seed = _first_nonempty(_safe_get(raw, "m_document_id"), _safe_get(raw, "m_hash"), url, base_url, title)
        doc_seed = str(doc_seed)

        content_src = _first_nonempty(_safe_get(raw, "m_important_content"), _safe_get(raw, "m_content"), "")
        summary = _clean_text(str(content_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        cts = _content_types(raw)
        labels = _labels_for(raw, content_types=cts, network=network, platform=platform, tag="orion:leak")
        lang = _single_lang(raw)

        industries = [str(x).strip() for x in _as_list(_safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else None

        b = _StixBuilder(created, modified)

        location_refs: List[str] = []
        for c in (_as_list(_safe_get(raw, "m_country")) or _as_list(_safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            location_refs.append(b.add_location(cc))

        victim_refs: List[str] = []
        for org in (_as_list(_safe_get(raw, "m_org")) + _as_list(_safe_get(raw, "m_company_name"))):
            name = str(org).strip()
            if not name:
                continue
            victim_refs.append(
                b.add_identity(
                    seed=f"victim:{name}",
                    name=name,
                    identity_class="organization",
                    sectors=[sector] if sector else None,
                )
            )

        for vref in victim_refs:
            for lref in location_refs:
                b.add_relationship(seed=f"{vref}|located-at|{lref}", relationship_type="located-at", source_ref=vref, target_ref=lref)

        team = _first_nonempty(_safe_get(raw, "m_team"), _safe_get(raw, "m_author"))
        actor_ref = None
        if team:
            tname = str(team).strip()
            if tname:
                actor_ref = b.add_intrusion_set(seed=f"team:{tname}", name=tname, description=summary if summary else None)

        infra_seed = _first_nonempty(base_url, url, (_as_list(_safe_get(raw, "m_domain"))[0] if _as_list(_safe_get(raw, "m_domain")) else None))
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(network).lower() == "onion":
                infra_types = ["anonymization"]
            if "ransomware" in cts:
                infra_types = ["command-and-control"]
            infra_ref = b.add_infrastructure(
                seed=f"infra:{infra_seed}",
                name=str(_first_nonempty(_safe_get(raw, "m_team"), title, "Leak infrastructure")),
                description=summary if summary else None,
                infra_types=infra_types,
                labels=sorted(labels),
                x_fields={"x_orion_network": str(network) if network else None},
            )

        if actor_ref and infra_ref:
            b.add_relationship(seed=f"{actor_ref}|uses|{infra_ref}", relationship_type="uses", source_ref=actor_ref, target_ref=infra_ref)

        domain_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_domain")))
        url_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_url")))
        ip_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_ip")))
        email_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_email")))
        asn_vals = _asn_digits(_as_list(_safe_get(raw, "m_asns")))
        file_paths = _dedup_sorted_str(_as_list(_safe_get(raw, "m_file_paths")))

        encoded_urls = _filter_http_urls(_as_list(_safe_get(raw, "m_encoded_urls")))
        dump_links = _filter_http_urls(_as_list(_safe_get(raw, "m_dumplink")))
        websites = _filter_http_urls(_as_list(_safe_get(raw, "m_websites")))
        url_vals = _dedup_sorted_str(list(url_vals) + encoded_urls + dump_links + websites)

        sco_refs: List[str] = []
        for u in url_vals:
            sco_refs.append(b.add_sco({"type": "url", "id": _sco_id("url", u), "value": u}, uniq=("url", u)))
        for d in domain_vals:
            sco_refs.append(b.add_sco({"type": "domain-name", "id": _sco_id("domain-name", d), "value": d}, uniq=("domain-name", d)))
        for ip in ip_vals:
            if ":" in ip:
                sco_refs.append(b.add_sco({"type": "ipv6-addr", "id": _sco_id("ipv6-addr", ip), "value": ip}, uniq=("ipv6-addr", ip)))
            else:
                sco_refs.append(b.add_sco({"type": "ipv4-addr", "id": _sco_id("ipv4-addr", ip), "value": ip}, uniq=("ipv4-addr", ip)))
        for e in email_vals:
            el = e.lower()
            sco_refs.append(b.add_sco({"type": "email-addr", "id": _sco_id("email-addr", el), "value": e}, uniq=("email-addr", el)))
        for a in asn_vals:
            sco_refs.append(b.add_sco({"type": "autonomous-system", "id": _sco_id("autonomous-system", a), "number": int(a)}, uniq=("autonomous-system", a)))
        for p in file_paths:
            sco_refs.append(b.add_sco({"type": "directory", "id": _sco_id("directory", p), "path": p}, uniq=("directory", p)))

        observed_ref = None
        if sco_refs:
            observed_ref = b.add_observed_data(seed=f"{doc_seed}|{created}", object_refs=sco_refs)

        indicator_refs: List[str] = []

        def add_stix_indicator(name: str, pattern: str, types: List[str]) -> None:
            indicator_refs.append(
                b.add_indicator(
                    seed=f"{name}|{pattern}",
                    name=name,
                    description=summary if summary else None,
                    indicator_types=types,
                    pattern_type="stix",
                    pattern=pattern,
                    labels=sorted(labels),
                )
            )

        if domain_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in domain_vals)
            add_stix_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"])
        if url_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in url_vals)
            add_stix_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"])
        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v4)
                add_stix_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"])
            if v6:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v6)
                add_stix_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"])
        if email_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in email_vals)
            add_stix_indicator("Emails", f"[email-addr:value IN ({vals})]", ["phishing"])

        for yr in _as_list(_safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            indicator_refs.append(
                b.add_indicator(
                    seed=f"yara|{_sha256(rule)}",
                    name="YARA Rule",
                    description=None,
                    indicator_types=[],
                    pattern_type="yara",
                    pattern=rule,
                    labels=sorted(labels),
                )
            )

        vuln_refs: List[str] = []
        for c in _as_list(_safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            vuln_refs.append(b.add_vulnerability(token=token))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in _as_list(_safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in _as_list(_safe_get(raw, "m_enterprise_attack_techniques")) if str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            ap = b.add_attack_pattern(tech=tech, tactics=tactics)
            if ap:
                attack_refs.append(ap)

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        def add_sensitive(cat: str, values: List[Any]) -> None:
            vals = [str(v).strip() for v in values if str(v).strip()]
            if not vals:
                return
            out: List[Dict[str, str]] = []
            for v in sorted(set(vals)):
                last4 = v[-4:] if len(v) >= 4 else v
                out.append({"sha256": _sha256(v), "last4": last4})
            sensitive[cat] = out

        add_sensitive("credit_cards", _as_list(_safe_get(raw, "m_credit_card")))
        add_sensitive("us_passport", _as_list(_safe_get(raw, "m_us_passport")))
        add_sensitive("au_abn", _as_list(_safe_get(raw, "m_au_abn")))
        add_sensitive("us_bank_number", _as_list(_safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive:
            note_ref = b.add_note(seed=f"sensitive|{doc_seed}|{created}", abstract="Sensitive artifacts (hashed)", content=str(sensitive), tlp="red")

        ext_refs = _external_refs(
            url=url,
            base_url=base_url,
            content_hash=_safe_get(raw, "m_hash"),
            scrap_file=_safe_get(raw, "m_scrap_file"),
            screenshot=_safe_get(raw, "m_screenshot"),
        )

        report_object_refs: List[str] = []
        for r in [actor_ref, infra_ref, observed_ref, note_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(victim_refs)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report_id = b.add_report(
            seed=f"leak:{doc_seed}",
            name=title,
            description=summary if summary else None,
            report_types=["threat-report"],
            labels=sorted(labels),
            lang=lang,
            external_references=ext_refs or None,
            object_refs=report_object_refs,
            x_fields={
                "x_orion_doc_id": str(doc_seed),
                "x_orion_network": str(network) if network else None,
                "x_orion_platform": str(platform) if platform else None,
                "x_orion_dumplink_count": str(len(_filter_http_urls(_as_list(_safe_get(raw, "m_dumplink"))))) if _safe_get(raw, "m_dumplink") else None,
            },
        )
        return b.bundle(report_id)

    def _convert_social(self, raw: SocialResultItem) -> Dict[str, Any]:
        created = (
            _parse_ts(_safe_get(raw, "m_creation_date"))
            or _parse_ts(_safe_get(raw, "m_update_date"))
            or _parse_ts(_safe_get(raw, "m_message_date"))
            or _now_ts()
        )
        modified = _parse_ts(_safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title = str(_first_nonempty(_safe_get(raw, "m_title"), _safe_get(raw, "m_url"), _safe_get(raw, "m_channel_url"), "Social - unknown title"))
        url = _first_nonempty(_safe_get(raw, "m_message_sharable_link"), _safe_get(raw, "m_channel_url"), _safe_get(raw, "m_url"))
        base_url = _safe_get(raw, "m_channel_url")
        network = _safe_get(raw, "m_network")
        platform = _safe_get(raw, "m_platform")
        doc_seed = _first_nonempty(_safe_get(raw, "m_document_id"), _safe_get(raw, "m_hash"), url, base_url, title)
        doc_seed = str(doc_seed)

        content_src = _first_nonempty(_safe_get(raw, "m_content"), _safe_get(raw, "m_important_content"), _safe_get(raw, "m_meta_description"), "")
        summary = _clean_text(str(content_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        cts = _content_types(raw)
        labels = _labels_for(raw, content_types=cts, network=network, platform=platform, tag="orion:social")
        lang = _single_lang(raw)

        industries = [str(x).strip() for x in _as_list(_safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else "Social Media"

        b = _StixBuilder(created, modified)

        location_refs: List[str] = []
        for c in (_as_list(_safe_get(raw, "m_country")) or _as_list(_safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            location_refs.append(b.add_location(cc))

        author = _first_nonempty(_safe_get(raw, "m_author"), _safe_get(raw, "m_username"))
        created_by_ref = None
        if author:
            author_name = str(author[0]).strip() if isinstance(author, list) and author else str(author).strip()
            if author_name:
                created_by_ref = b.add_identity(seed=f"author:{author_name}", name=author_name, identity_class="individual")

        domain_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_domain")))
        url_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_url")))
        ip_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_ip")))
        email_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_email")))
        asn_vals = _asn_digits(_as_list(_safe_get(raw, "m_asns")))
        path_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_file_paths")))
        social_profiles = _filter_http_urls(_as_list(_safe_get(raw, "m_social_media_profiles")))
        encoded_urls = _filter_http_urls(_as_list(_safe_get(raw, "m_encoded_urls")))
        xmpp_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_xmpp_addresses")))
        crypto_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_crypto_address")))
        user_agents = _dedup_sorted_str(_as_list(_safe_get(raw, "m_user_agents")))
        hashtags = [str(x).strip().lstrip("#") for x in _as_list(_safe_get(raw, "m_hashtag")) if str(x).strip()]
        mentions = [str(x).strip().lstrip("@") for x in _as_list(_safe_get(raw, "m_mention")) if str(x).strip()]

        url_vals = _dedup_sorted_str(list(url_vals) + ([str(url)] if url else []) + encoded_urls + social_profiles)

        infra_seed = _first_nonempty(base_url, url, (domain_vals[0] if domain_vals else None))
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(network).lower() == "onion":
                infra_types = ["anonymization"]
            infra_ref = b.add_infrastructure(
                seed=f"infra:{infra_seed}",
                name=str(_first_nonempty(platform, title, "Social infrastructure")),
                description=summary if summary else None,
                infra_types=infra_types,
                labels=sorted(labels),
                x_fields={"x_orion_network": str(network) if network else None, "x_orion_platform": str(platform) if platform else None},
            )

        sco_refs: List[str] = []
        for u in url_vals:
            sco_refs.append(b.add_sco({"type": "url", "id": _sco_id("url", u), "value": u}, uniq=("url", u)))
        for d in domain_vals:
            sco_refs.append(b.add_sco({"type": "domain-name", "id": _sco_id("domain-name", d), "value": d}, uniq=("domain-name", d)))
        for ip in ip_vals:
            if ":" in ip:
                sco_refs.append(b.add_sco({"type": "ipv6-addr", "id": _sco_id("ipv6-addr", ip), "value": ip}, uniq=("ipv6-addr", ip)))
            else:
                sco_refs.append(b.add_sco({"type": "ipv4-addr", "id": _sco_id("ipv4-addr", ip), "value": ip}, uniq=("ipv4-addr", ip)))
        for e in email_vals:
            el = e.lower()
            sco_refs.append(b.add_sco({"type": "email-addr", "id": _sco_id("email-addr", el), "value": e}, uniq=("email-addr", el)))
        for a in asn_vals:
            sco_refs.append(b.add_sco({"type": "autonomous-system", "id": _sco_id("autonomous-system", a), "number": int(a)}, uniq=("autonomous-system", a)))
        for p in path_vals:
            sco_refs.append(b.add_sco({"type": "directory", "id": _sco_id("directory", p), "path": p}, uniq=("directory", p)))
        for x in xmpp_vals:
            sco_refs.append(b.add_sco({"type": "x-mpp-addr", "id": _sco_id("x-mpp-addr", x), "value": x}, uniq=("x-mpp-addr", x)))
        for c in crypto_vals:
            sco_refs.append(b.add_sco({"type": "cryptocurrency-wallet", "id": _sco_id("cryptocurrency-wallet", c), "address": c}, uniq=("cryptocurrency-wallet", c)))
        for ua in user_agents:
            sco_refs.append(b.add_sco({"type": "user-agent", "id": _sco_id("user-agent", ua), "string": ua}, uniq=("user-agent", ua)))

        observed_ref = None
        if sco_refs:
            observed_ref = b.add_observed_data(seed=f"{doc_seed}|{created}", object_refs=sco_refs)

        indicator_refs: List[str] = []

        def add_stix_indicator(name: str, pattern: str, types: List[str]) -> None:
            indicator_refs.append(
                b.add_indicator(
                    seed=f"{name}|{pattern}",
                    name=name,
                    description=summary if summary else None,
                    indicator_types=types,
                    pattern_type="stix",
                    pattern=pattern,
                    labels=sorted(labels),
                )
            )

        if domain_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in domain_vals)
            add_stix_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"])
        if url_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in url_vals)
            add_stix_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"])
        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v4)
                add_stix_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"])
            if v6:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v6)
                add_stix_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"])
        if email_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in email_vals)
            add_stix_indicator("Emails", f"[email-addr:value IN ({vals})]", ["phishing"])

        for yr in _as_list(_safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            indicator_refs.append(
                b.add_indicator(
                    seed=f"yara|{_sha256(rule)}",
                    name="YARA Rule",
                    description=None,
                    indicator_types=[],
                    pattern_type="yara",
                    pattern=rule,
                    labels=sorted(labels),
                )
            )

        vuln_refs: List[str] = []
        for c in _as_list(_safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            vuln_refs.append(b.add_vulnerability(token=token))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in _as_list(_safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in _as_list(_safe_get(raw, "m_enterprise_attack_techniques")) if str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            ap = b.add_attack_pattern(tech=tech, tactics=tactics)
            if ap:
                attack_refs.append(ap)

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        def add_sensitive(cat: str, values: List[Any]) -> None:
            vals = [str(v).strip() for v in values if str(v).strip()]
            if not vals:
                return
            out: List[Dict[str, str]] = []
            for v in sorted(set(vals)):
                last4 = v[-4:] if len(v) >= 4 else v
                out.append({"sha256": _sha256(v), "last4": last4})
            sensitive[cat] = out

        add_sensitive("credit_cards", _as_list(_safe_get(raw, "m_credit_card")))
        add_sensitive("us_passport", _as_list(_safe_get(raw, "m_us_passport")))
        add_sensitive("au_abn", _as_list(_safe_get(raw, "m_au_abn")))
        add_sensitive("us_bank_number", _as_list(_safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive or hashtags or mentions:
            content_note: Dict[str, Any] = {}
            if sensitive:
                content_note["sensitive_hashed"] = sensitive
            if hashtags:
                content_note["hashtags"] = sorted(set([h for h in hashtags if h]))
            if mentions:
                content_note["mentions"] = sorted(set([m for m in mentions if m]))
            note_ref = b.add_note(
                seed=f"social-meta|{doc_seed}|{created}",
                abstract="Social metadata (and sensitive hashed)",
                content=str(content_note),
                tlp="red" if sensitive else "amber",
            )

        ext_refs = _external_refs(
            url=url,
            channel_url=base_url,
            share_link=_safe_get(raw, "m_message_sharable_link"),
            content_hash=_safe_get(raw, "m_hash"),
            scrap_file=_safe_get(raw, "m_scrap_file"),
        )

        report_object_refs: List[str] = []
        for r in [infra_ref, observed_ref, note_ref, created_by_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report_id = b.add_report(
            seed=f"social:{doc_seed}",
            name=title,
            description=summary if summary else None,
            report_types=["threat-report"],
            labels=sorted(labels),
            lang=lang,
            created_by_ref=created_by_ref,
            external_references=ext_refs or None,
            object_refs=report_object_refs,
            x_fields={
                "x_orion_doc_id": str(doc_seed),
                "x_orion_network": str(network) if network else None,
                "x_orion_platform": str(platform) if platform else None,
                "x_orion_post_comments_count": str(_safe_get(raw, "m_post_comments_count")) if _safe_get(raw, "m_post_comments_count") else None,
            },
        )
        return b.bundle(report_id)

    def _convert_general(self, raw: GeneralResultItem) -> Dict[str, Any]:
        created = _parse_ts(_safe_get(raw, "m_creation_date"), allow_date_only=False) or _parse_ts(_safe_get(raw, "m_update_date"), allow_date_only=False) or _now_ts()
        modified = _parse_ts(_safe_get(raw, "m_update_date"), allow_date_only=False) or created
        if modified < created:
            modified = created

        title = str(_first_nonempty(_safe_get(raw, "m_title"), _safe_get(raw, "m_url"), _safe_get(raw, "m_base_url"), "General - unknown title"))
        url = _first_nonempty(_safe_get(raw, "m_url"), _safe_get(raw, "m_base_url"))
        base_url = _safe_get(raw, "m_base_url")
        network = _safe_get(raw, "m_network")
        doc_seed = _first_nonempty(_safe_get(raw, "m_document_id"), _safe_get(raw, "m_hash"), url, base_url, title)
        doc_seed = str(doc_seed)

        summary_src = _first_nonempty(_safe_get(raw, "m_important_content"), _safe_get(raw, "m_meta_description"), _safe_get(raw, "m_content"), "")
        summary = _clean_text(str(summary_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        cts = _content_types(raw)
        labels: Set[str] = set()
        for ct in sorted(cts):
            labels.add(ct)
        if network:
            labels.add(str(network).strip().lower())
        for p in _as_list(_safe_get(raw, "m_platform")):
            sp = str(p).strip().lower()
            if sp:
                labels.add(f"platform:{sp}")
        for h in _as_list(_safe_get(raw, "m_hashtag")):
            sh = str(h).strip().lstrip("#").lower()
            if sh:
                labels.add(f"tag:{sh}")
        labels.add("orion:general")

        lang = None
        langs = [str(x).strip() for x in _as_list(_safe_get(raw, "m_language")) if str(x).strip()]
        if len(langs) == 1:
            lang = langs[0]

        industries = [str(x).strip() for x in _as_list(_safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else None

        b = _StixBuilder(created, modified)

        location_refs: List[str] = []
        for c in (_as_list(_safe_get(raw, "m_country")) or _as_list(_safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            location_refs.append(b.add_location(cc))

        victim_refs: List[str] = []
        for org in (_as_list(_safe_get(raw, "m_org")) + _as_list(_safe_get(raw, "m_company_name"))):
            name = str(org).strip()
            if not name:
                continue
            victim_refs.append(
                b.add_identity(
                    seed=f"victim:{name}",
                    name=name,
                    identity_class="organization",
                    sectors=[sector] if sector else None,
                )
            )

        for vref in victim_refs:
            for lref in location_refs:
                b.add_relationship(seed=f"{vref}|located-at|{lref}", relationship_type="located-at", source_ref=vref, target_ref=lref)

        team = _first_nonempty(_safe_get(raw, "m_team"), _safe_get(raw, "m_author"))
        actor_ref = None
        if team:
            tname = str(team).strip()
            if tname:
                actor_ref = b.add_intrusion_set(seed=f"team:{tname}", name=tname, description=summary if summary else None)

        domain_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_domain")))
        url_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_url")))
        ip_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_ip")))
        email_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_email")))
        asn_vals = _asn_digits(_as_list(_safe_get(raw, "m_asns")))
        path_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_file_paths")))

        encoded_urls = _filter_http_urls(_as_list(_safe_get(raw, "m_encoded_urls")))
        url_vals = _dedup_sorted_str(list(url_vals) + encoded_urls)

        infra_seed = _first_nonempty(url, base_url, (domain_vals[0] if domain_vals else None))
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(network).lower() == "onion":
                infra_types = ["anonymization"]
            elif "darkweb" in cts:
                infra_types = ["hosting-malware"]
            infra_ref = b.add_infrastructure(
                seed=f"infra:{infra_seed}",
                name=str(_first_nonempty(_safe_get(raw, "m_team"), title, "Observed infrastructure")),
                description=summary if summary else None,
                infra_types=infra_types,
                labels=sorted(labels),
                x_fields={"x_orion_network": str(network) if network else None},
            )

        if actor_ref and infra_ref:
            b.add_relationship(seed=f"{actor_ref}|uses|{infra_ref}", relationship_type="uses", source_ref=actor_ref, target_ref=infra_ref)

        sco_refs: List[str] = []
        for u in url_vals:
            sco_refs.append(b.add_sco({"type": "url", "id": _sco_id("url", u), "value": u}, uniq=("url", u)))
        for d in domain_vals:
            sco_refs.append(b.add_sco({"type": "domain-name", "id": _sco_id("domain-name", d), "value": d}, uniq=("domain-name", d)))
        for ip in ip_vals:
            if ":" in ip:
                sco_refs.append(b.add_sco({"type": "ipv6-addr", "id": _sco_id("ipv6-addr", ip), "value": ip}, uniq=("ipv6-addr", ip)))
            else:
                sco_refs.append(b.add_sco({"type": "ipv4-addr", "id": _sco_id("ipv4-addr", ip), "value": ip}, uniq=("ipv4-addr", ip)))
        for e in email_vals:
            el = e.lower()
            sco_refs.append(b.add_sco({"type": "email-addr", "id": _sco_id("email-addr", el), "value": e}, uniq=("email-addr", el)))
        for a in asn_vals:
            sco_refs.append(b.add_sco({"type": "autonomous-system", "id": _sco_id("autonomous-system", a), "number": int(a)}, uniq=("autonomous-system", a)))
        for p in path_vals:
            sco_refs.append(b.add_sco({"type": "directory", "id": _sco_id("directory", p), "path": p}, uniq=("directory", p)))

        observed_ref = None
        if sco_refs:
            observed_ref = b.add_observed_data(seed=f"{doc_seed}|{created}", object_refs=sco_refs)

        indicator_refs: List[str] = []

        def add_stix_indicator(name: str, pattern: str, types: List[str]) -> None:
            indicator_refs.append(
                b.add_indicator(
                    seed=f"{name}|{pattern}",
                    name=name,
                    description=summary if summary else None,
                    indicator_types=types,
                    pattern_type="stix",
                    pattern=pattern,
                    labels=sorted(labels),
                )
            )

        if domain_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in domain_vals)
            add_stix_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"])
        if url_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in url_vals)
            add_stix_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"])
        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v4)
                add_stix_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"])
            if v6:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v6)
                add_stix_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"])
        if email_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in email_vals)
            add_stix_indicator("Emails", f"[email-addr:value IN ({vals})]", ["phishing"])

        for yr in _as_list(_safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            indicator_refs.append(
                b.add_indicator(
                    seed=f"yara|{_sha256(rule)}",
                    name="YARA Rule",
                    description=None,
                    indicator_types=[],
                    pattern_type="yara",
                    pattern=rule,
                    labels=sorted(labels),
                )
            )

        vuln_refs: List[str] = []
        for c in _as_list(_safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            vuln_refs.append(b.add_vulnerability(token=token))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in _as_list(_safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in _as_list(_safe_get(raw, "m_enterprise_attack_techniques")) if str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            ap = b.add_attack_pattern(tech=tech, tactics=tactics)
            if ap:
                attack_refs.append(ap)

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        def add_sensitive(cat: str, values: List[Any]) -> None:
            vals = [str(v).strip() for v in values if str(v).strip()]
            if not vals:
                return
            out: List[Dict[str, str]] = []
            for v in sorted(set(vals)):
                last4 = v[-4:] if len(v) >= 4 else v
                out.append({"sha256": _sha256(v), "last4": last4})
            sensitive[cat] = out

        add_sensitive("credit_cards", _as_list(_safe_get(raw, "m_credit_card")))
        add_sensitive("us_passport", _as_list(_safe_get(raw, "m_us_passport")))
        add_sensitive("au_abn", _as_list(_safe_get(raw, "m_au_abn")))
        add_sensitive("us_bank_number", _as_list(_safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive:
            note_ref = b.add_note(seed=f"sensitive|{doc_seed}|{created}", abstract="Sensitive artifacts (hashed)", content=str(sensitive), tlp="red")

        ext_refs = _external_refs(
            url=url,
            base_url=base_url,
            content_hash=_safe_get(raw, "m_hash"),
            scrap_file=_safe_get(raw, "m_scrap_file"),
            screenshot=_safe_get(raw, "m_screenshot"),
        )

        report_object_refs: List[str] = []
        for r in [actor_ref, infra_ref, observed_ref, note_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(victim_refs)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report_id = b.add_report(
            seed=str(doc_seed),
            name=title,
            description=summary if summary else None,
            report_types=["threat-report"],
            labels=sorted(labels),
            lang=lang,
            external_references=ext_refs or None,
            object_refs=report_object_refs,
            x_fields={"x_orion_doc_id": str(doc_seed), "x_orion_network": str(network) if network else None},
        )
        return b.bundle(report_id)

    def _convert_chat(self, raw: ChatResultItem) -> Dict[str, Any]:
        created = (
            _parse_ts(_safe_get(raw, "m_creation_date"))
            or _parse_ts(_safe_get(raw, "m_update_date"))
            or _parse_ts(_safe_get(raw, "m_message_date"))
            or _now_ts()
        )
        modified = _parse_ts(_safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        caption = str(_first_nonempty(_safe_get(raw, "m_caption"), _safe_get(raw, "m_content"), "Chat - unknown title"))
        url = _first_nonempty(_safe_get(raw, "m_message_sharable_link"), _safe_get(raw, "m_media_url"))
        channel_url = _safe_get(raw, "m_channel_url")
        channel_id = _safe_get(raw, "m_channel_id")
        platform = _safe_get(raw, "m_platform")
        network = _safe_get(raw, "m_network") or (str(platform).strip().lower() if platform else None)
        doc_seed = _first_nonempty(_safe_get(raw, "m_document_id"), _safe_get(raw, "m_hash"), _safe_get(raw, "m_message_id"), url, channel_id, caption)
        doc_seed = str(doc_seed)

        content_src = _first_nonempty(_safe_get(raw, "m_content"), _safe_get(raw, "m_media_caption"), "")
        summary = _clean_text(str(content_src or ""))
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        cts = _content_types(raw)
        labels: Set[str] = set()
        for ct in sorted(cts):
            labels.add(ct)
        if platform:
            labels.add(f"platform:{str(platform).strip().lower()}")
        if network:
            labels.add(str(network).strip().lower())
        labels.add("orion:chat")

        lang = _single_lang(raw)

        b = _StixBuilder(created, modified)

        sender = _first_nonempty(_safe_get(raw, "m_sender_username"), _safe_get(raw, "m_users"), _safe_get(raw, "m_author"))
        created_by_ref = None
        if sender:
            sender_name = str(sender[0]).strip() if isinstance(sender, list) and sender else str(sender).strip()
            if sender_name:
                created_by_ref = b.add_identity(seed=f"sender:{sender_name}", name=sender_name, identity_class="individual")

        channel_name = _first_nonempty(_safe_get(raw, "m_channel_name"), channel_id, channel_url, "Chat channel")
        infra_seed = _first_nonempty(channel_url, channel_id)
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(platform).strip().lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)):
                infra_types = ["communications"]
            infra_ref = b.add_infrastructure(
                seed=f"channel:{infra_seed}",
                name=str(channel_name),
                description=summary if summary else None,
                infra_types=infra_types,
                labels=sorted(labels),
                x_fields={"x_orion_network": str(network) if network else None, "x_orion_channel_id": str(channel_id) if channel_id else None},
            )

        domain_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_domain")))
        url_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_url")))
        ip_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_ip")))
        email_vals = _dedup_sorted_str(_as_list(_safe_get(raw, "m_email")))
        asn_vals = _asn_digits(_as_list(_safe_get(raw, "m_asns")))
        file_paths = _dedup_sorted_str(_as_list(_safe_get(raw, "m_file_paths")))
        encoded_urls = _filter_http_urls(_as_list(_safe_get(raw, "m_encoded_urls")))
        weblinks = _filter_http_urls(_as_list(_safe_get(raw, "m_weblink")))
        user_agents = _dedup_sorted_str(_as_list(_safe_get(raw, "m_user_agents")))
        cves = [str(x).strip().upper() for x in _as_list(_safe_get(raw, "m_cve")) if str(x).strip()]
        hashtags = [str(x).strip().lstrip("#") for x in _as_list(_safe_get(raw, "m_hashtag")) if str(x).strip()]
        mentions = [str(x).strip() for x in _as_list(_safe_get(raw, "m_mention")) if str(x).strip()]

        url_vals = _dedup_sorted_str(list(url_vals) + encoded_urls + weblinks + ([str(url)] if url else []) + ([str(channel_url)] if channel_url else []))

        sco_refs: List[str] = []
        for u in url_vals:
            sco_refs.append(b.add_sco({"type": "url", "id": _sco_id("url", u), "value": u}, uniq=("url", u)))
        for d in domain_vals:
            sco_refs.append(b.add_sco({"type": "domain-name", "id": _sco_id("domain-name", d), "value": d}, uniq=("domain-name", d)))
        for ip in ip_vals:
            if ":" in ip:
                sco_refs.append(b.add_sco({"type": "ipv6-addr", "id": _sco_id("ipv6-addr", ip), "value": ip}, uniq=("ipv6-addr", ip)))
            else:
                sco_refs.append(b.add_sco({"type": "ipv4-addr", "id": _sco_id("ipv4-addr", ip), "value": ip}, uniq=("ipv4-addr", ip)))
        for e in email_vals:
            el = e.lower()
            sco_refs.append(b.add_sco({"type": "email-addr", "id": _sco_id("email-addr", el), "value": e}, uniq=("email-addr", el)))
        for a in asn_vals:
            sco_refs.append(b.add_sco({"type": "autonomous-system", "id": _sco_id("autonomous-system", a), "number": int(a)}, uniq=("autonomous-system", a)))
        for p in file_paths:
            sco_refs.append(b.add_sco({"type": "directory", "id": _sco_id("directory", p), "path": p}, uniq=("directory", p)))
        for ua in user_agents:
            sco_refs.append(b.add_sco({"type": "user-agent", "id": _sco_id("user-agent", ua), "string": ua}, uniq=("user-agent", ua)))

        observed_ref = None
        if sco_refs:
            observed_ref = b.add_observed_data(seed=f"{doc_seed}|{created}", object_refs=sco_refs)

        indicator_refs: List[str] = []

        def add_stix_indicator(name: str, pattern: str, types: List[str]) -> None:
            indicator_refs.append(
                b.add_indicator(
                    seed=f"{name}|{pattern}",
                    name=name,
                    description=summary if summary else None,
                    indicator_types=types,
                    pattern_type="stix",
                    pattern=pattern,
                    labels=sorted(labels),
                )
            )

        if domain_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in domain_vals)
            add_stix_indicator("Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"])
        if url_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in url_vals)
            add_stix_indicator("URLs", f"[url:value IN ({vals})]", ["malicious-activity"])
        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v4)
                add_stix_indicator("IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"])
            if v6:
                vals = ", ".join(f"'{_escape_pat(v)}'" for v in v6)
                add_stix_indicator("IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"])
        if email_vals:
            vals = ", ".join(f"'{_escape_pat(v)}'" for v in email_vals)
            add_stix_indicator("Emails", f"[email-addr:value IN ({vals})]", ["malicious-activity"])

        for yr in _as_list(_safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            indicator_refs.append(
                b.add_indicator(
                    seed=f"yara|{_sha256(rule)}",
                    name="YARA Rule",
                    description=None,
                    indicator_types=[],
                    pattern_type="yara",
                    pattern=rule,
                    labels=sorted(labels),
                )
            )

        vuln_refs: List[str] = []
        for token in sorted(set([c for c in cves if c.startswith("CVE-")])):
            vuln_refs.append(b.add_vulnerability(token=token))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in _as_list(_safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in _as_list(_safe_get(raw, "m_enterprise_attack_techniques")) if str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            ap = b.add_attack_pattern(tech=tech, tactics=tactics)
            if ap:
                attack_refs.append(ap)

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        def add_sensitive(cat: str, values: List[Any]) -> None:
            vals = [str(v).strip() for v in values if str(v).strip()]
            if not vals:
                return
            out: List[Dict[str, str]] = []
            for v in sorted(set(vals)):
                last4 = v[-4:] if len(v) >= 4 else v
                out.append({"sha256": _sha256(v), "last4": last4})
            sensitive[cat] = out

        add_sensitive("credit_cards", _as_list(_safe_get(raw, "m_credit_card")))
        add_sensitive("us_passport", _as_list(_safe_get(raw, "m_us_passport")))
        add_sensitive("au_abn", _as_list(_safe_get(raw, "m_au_abn")))
        add_sensitive("us_bank_number", _as_list(_safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive or hashtags or mentions:
            content_note: Dict[str, Any] = {}
            if sensitive:
                content_note["sensitive_hashed"] = sensitive
            if hashtags:
                content_note["hashtags"] = sorted(set([h for h in hashtags if h]))
            if mentions:
                content_note["mentions"] = sorted(set([m for m in mentions if m]))
            note_ref = b.add_note(
                seed=f"chat-meta|{doc_seed}|{created}",
                abstract="Chat metadata (and sensitive hashed)",
                content=str(content_note),
                tlp="red" if sensitive else "amber",
            )

        ext_refs = _external_refs(
            url=url,
            channel_url=channel_url,
            content_hash=_safe_get(raw, "m_hash"),
            scrap_file=_safe_get(raw, "m_scrap_file"),
            message_id=_safe_get(raw, "m_message_id"),
        )

        report_object_refs: List[str] = []
        for r in [infra_ref, observed_ref, note_ref, created_by_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(attack_refs)

        report_id = b.add_report(
            seed=f"chat:{doc_seed}",
            name=caption,
            description=summary if summary else None,
            report_types=["threat-report"],
            labels=sorted(labels),
            lang=lang,
            created_by_ref=created_by_ref,
            external_references=ext_refs or None,
            object_refs=report_object_refs,
            x_fields={
                "x_orion_doc_id": str(doc_seed),
                "x_orion_network": str(network) if network else None,
                "x_orion_platform": str(platform) if platform else None,
                "x_orion_channel_id": str(channel_id) if channel_id else None,
                "x_orion_channel_name": str(_safe_get(raw, "m_channel_name")) if _safe_get(raw, "m_channel_name") else None,
                "x_orion_views": str(_safe_get(raw, "m_views")) if _safe_get(raw, "m_views") else None,
                "x_orion_sender_is_bot": bool(_safe_get(raw, "m_sender_is_bot")) if _safe_get(raw, "m_sender_is_bot") is not None else None,
                "x_orion_is_forwarded": bool(_safe_get(raw, "m_is_forwarded")) if _safe_get(raw, "m_is_forwarded") is not None else None,
                "x_orion_is_reply": bool(_safe_get(raw, "m_is_reply")) if _safe_get(raw, "m_is_reply") is not None else None,
                "x_orion_pinned": bool(_safe_get(raw, "m_pinned")) if _safe_get(raw, "m_pinned") is not None else None,
            },
        )
        return b.bundle(report_id)
