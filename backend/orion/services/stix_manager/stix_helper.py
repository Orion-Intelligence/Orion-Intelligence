from __future__ import annotations
from typing import Any
from datetime import datetime, timezone
import re
import uuid
import hashlib


class stix_helper:
    __slots__ = ("objects", "seen")

    def __init__(self) -> None:
        self.objects: list[dict[str, Any]] = []
        self.seen: dict[tuple[str, str], str] = {}

    def safe_get(self, obj: Any, key: str, default: Any = None) -> Any:
        try:
            return getattr(obj, key)
        except Exception:
            return default

    def as_list(self, v: Any) -> list[Any]:
        if v is None:
            return []
        if type(v) is list:
            return [x for x in v if x is not None and x != ""]
        return [v] if v != "" else []

    def first_nonempty(self, *vals: Any) -> Any:
        for v in vals:
            if v is None:
                continue
            if type(v) is str and not v.strip():
                continue
            if type(v) is list and len(v) == 0:
                continue
            return v
        return None

    def clean_text(self, s: str) -> str:
        if not s:
            return ""
        s = s.replace("\r\n", "\n")
        s = re.sub(r"[ \t]+", " ", s)
        s = re.sub(r"\n{3,}", "\n\n", s)
        return s.strip()

    def _parse_iso_to_utc(self, v: str) -> str | None:
        try:
            if v.endswith("Z"):
                v = v[:-1] + "+00:00"
            dt = datetime.fromisoformat(v)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            dt = dt.astimezone(timezone.utc)
            return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")
        except Exception:
            return None

    def parse_ts(self, value: str | None) -> str | None:
        if not value:
            return None
        v = str(value).strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            dt = datetime.fromisoformat(v).replace(tzinfo=timezone.utc)
            return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")
        return self._parse_iso_to_utc(v)

    def parse_ts_iso(self, value: str | None) -> str | None:
        if not value:
            return None
        return self._parse_iso_to_utc(str(value).strip())

    def now_ts(self) -> str:
        return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")

    def uuid5(self, seed: str) -> str:
        return str(uuid.uuid5(uuid.NAMESPACE_URL, seed))

    def stix_id(self, stix_type: str, seed: str) -> str:
        return f"{stix_type}--{self.uuid5(f'{stix_type}:{seed}')}"

    def sco_id(self, sco_type: str, seed: str) -> str:
        return f"{sco_type}--{self.uuid5(f'{sco_type}:{seed}')}"

    def sha256(self, v: str) -> str:
        return hashlib.sha256(v.encode("utf-8", errors="ignore")).hexdigest()

    def escape_pat(self, s: str) -> str:
        return s.replace("\\", "\\\\").replace("'", "\\'")

    def dedupe_keep(self, seq: list[str]) -> list[str]:
        out: list[str] = []
        seen: set[str] = set()
        for v in seq:
            if not v:
                continue
            if v in seen:
                continue
            seen.add(v)
            out.append(v)
        return out

    def dedupe_keep_any(self, seq: list[Any]) -> list[Any]:
        out: list[Any] = []
        seen: set[str] = set()
        for v in seq:
            if v is None:
                continue
            k = str(v)
            if k in seen:
                continue
            seen.add(k)
            out.append(v)
        return out

    def add_obj(self, obj: dict[str, Any], uniq: tuple[str, str] | None = None) -> str:
        oid = obj["id"]
        if uniq is not None:
            existing = self.seen.get(uniq)
            if existing:
                return existing
            self.seen[uniq] = oid
        self.objects.append(obj)
        return oid

    def add_tlp(self, created: str) -> tuple[str, str]:
        amber = self.stix_id("marking-definition", "tlp:amber")
        red = self.stix_id("marking-definition", "tlp:red")
        self.add_obj({"type": "marking-definition", "spec_version": "2.1", "id": amber, "created": created, "definition_type": "tlp", "definition": {"tlp": "amber"}}, ("marking-definition", "tlp:amber"))
        self.add_obj({"type": "marking-definition", "spec_version": "2.1", "id": red, "created": created, "definition_type": "tlp", "definition": {"tlp": "red"}}, ("marking-definition", "tlp:red"))
        return amber, red

    def add_locations(self, *, raw: Any, created: str, modified: str, tlp_amber_id: str, keys: list[str]) -> list[str]:
        out: list[str] = []
        vals: list[Any] = []
        for k in keys:
            vals.extend(self.as_list(self.safe_get(raw, k)))
        for c in vals:
            cc = str(c).strip()
            if not cc:
                continue
            loc = {"type": "location", "spec_version": "2.1", "id": self.stix_id("location", f"country:{cc}"), "created": created, "modified": modified, "name": cc, "country": cc, "object_marking_refs": [tlp_amber_id]}
            out.append(self.add_obj(loc, ("location", f"country:{cc}")))
        return out

    def add_scos(self, *, tlp_amber_id: str, url_vals: list[str], domain_vals: list[str], ip_vals: list[str], email_vals: list[str], asn_vals: list[str], dir_vals: list[str], extra_scos: list[dict[str, Any]] | None = None) -> list[str]:
        out: list[str] = []
        for u in url_vals:
            out.append(self.add_obj({"type": "url", "id": self.sco_id("url", u), "value": u}, ("url", u)))
        for d in domain_vals:
            out.append(self.add_obj({"type": "domain-name", "id": self.sco_id("domain-name", d), "value": d}, ("domain-name", d)))
        for ip in ip_vals:
            if ":" in ip:
                out.append(self.add_obj({"type": "ipv6-addr", "id": self.sco_id("ipv6-addr", ip), "value": ip}, ("ipv6-addr", ip)))
            else:
                out.append(self.add_obj({"type": "ipv4-addr", "id": self.sco_id("ipv4-addr", ip), "value": ip}, ("ipv4-addr", ip)))
        for e in email_vals:
            el = e.lower()
            out.append(self.add_obj({"type": "email-addr", "id": self.sco_id("email-addr", el), "value": e}, ("email-addr", el)))
        for a in asn_vals:
            try:
                num = int(a)
            except Exception:
                continue
            out.append(self.add_obj({"type": "autonomous-system", "id": self.sco_id("autonomous-system", a), "number": num}, ("autonomous-system", a)))
        for p in dir_vals:
            out.append(self.add_obj({"type": "directory", "id": self.sco_id("directory", p), "path": p}, ("directory", p)))
        if extra_scos:
            for sco in extra_scos:
                out.append(self.add_obj(sco, (sco["type"], sco["id"])))
        return out

    def add_observed(self, *, doc_id: str, created: str, modified: str, tlp_amber_id: str, sco_refs: list[str]) -> str | None:
        if not sco_refs:
            return None
        obs = {"type": "observed-data", "spec_version": "2.1", "id": self.stix_id("observed-data", f"{doc_id}|{created}"), "created": created, "modified": modified, "first_observed": created, "last_observed": modified, "number_observed": 1, "object_refs": self.dedupe_keep(sco_refs), "object_marking_refs": [tlp_amber_id]}
        return self.add_obj(obs, ("observed-data", obs["id"]))

    def add_indicator_obj(self, *, created: str, modified: str, tlp_amber_id: str, labels: list[str], summary: str | None, name: str, pattern: str, types: list[str], pattern_type: str = "stix") -> str:
        ind = {"type": "indicator", "spec_version": "2.1", "id": self.stix_id("indicator", f"{name}|{pattern}"), "created": created, "modified": modified, "name": name, "description": summary if summary else None, "indicator_types": types, "pattern_type": pattern_type, "pattern": pattern, "valid_from": created, "labels": labels, "object_marking_refs": [tlp_amber_id]}
        ind = {k: v for k, v in ind.items() if v is not None}
        return self.add_obj(ind, ("indicator", ind["id"]))

    def add_indicators(self, *, created: str, modified: str, tlp_amber_id: str, labels: list[str], summary: str | None, domain_vals: list[str], url_vals: list[str], ip_vals: list[str], email_vals: list[str], indicator_types_default: str) -> list[str]:
        out: list[str] = []
        if domain_vals:
            vals = ", ".join(f"'{self.escape_pat(v)}'" for v in domain_vals)
            out.append(self.add_indicator_obj(created=created, modified=modified, tlp_amber_id=tlp_amber_id, labels=labels, summary=summary, name="Domains", pattern=f"[domain-name:value IN ({vals})]", types=[indicator_types_default]))
        if url_vals:
            vals = ", ".join(f"'{self.escape_pat(v)}'" for v in url_vals)
            out.append(self.add_indicator_obj(created=created, modified=modified, tlp_amber_id=tlp_amber_id, labels=labels, summary=summary, name="URLs", pattern=f"[url:value IN ({vals})]", types=[indicator_types_default]))
        if ip_vals:
            v4: list[str] = []
            v6: list[str] = []
            for v in ip_vals:
                if ":" in v:
                    v6.append(v)
                else:
                    v4.append(v)
            v4 = self.dedupe_keep(v4)
            v6 = self.dedupe_keep(v6)
            if v4:
                vals = ", ".join(f"'{self.escape_pat(v)}'" for v in v4)
                out.append(self.add_indicator_obj(created=created, modified=modified, tlp_amber_id=tlp_amber_id, labels=labels, summary=summary, name="IPv4", pattern=f"[ipv4-addr:value IN ({vals})]", types=[indicator_types_default]))
            if v6:
                vals = ", ".join(f"'{self.escape_pat(v)}'" for v in v6)
                out.append(self.add_indicator_obj(created=created, modified=modified, tlp_amber_id=tlp_amber_id, labels=labels, summary=summary, name="IPv6", pattern=f"[ipv6-addr:value IN ({vals})]", types=[indicator_types_default]))
        if email_vals:
            vals = ", ".join(f"'{self.escape_pat(v)}'" for v in email_vals)
            out.append(self.add_indicator_obj(created=created, modified=modified, tlp_amber_id=tlp_amber_id, labels=labels, summary=summary, name="Emails", pattern=f"[email-addr:value IN ({vals})]", types=[indicator_types_default]))
        return out

    def add_yara_indicators(self, *, created: str, modified: str, tlp_amber_id: str, labels: list[str], yara_rules: list[Any]) -> list[str]:
        out: list[str] = []
        for yr in yara_rules:
            rule = str(yr).strip()
            if not rule:
                continue
            out.append(self.add_indicator_obj(created=created, modified=modified, tlp_amber_id=tlp_amber_id, labels=labels, summary=None, name="YARA Rule", pattern=rule, types=labels, pattern_type="yara"))
        return out

    def add_vulns(self, *, created: str, modified: str, tlp_amber_id: str, cves: list[Any]) -> list[str]:
        out: list[str] = []
        for c in cves:
            token = str(c).strip().upper()
            if not token:
                continue
            if token.startswith("CVE-"):
                v = {"type": "vulnerability", "spec_version": "2.1", "id": self.stix_id("vulnerability", token), "created": created, "modified": modified, "name": token, "external_references": [{"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}], "object_marking_refs": [tlp_amber_id]}
                out.append(self.add_obj(v, ("vulnerability", token)))
            elif token.startswith("CWE-"):
                cwe_num = token.replace("CWE-", "")
                if cwe_num.isdigit():
                    v = {"type": "vulnerability", "spec_version": "2.1", "id": self.stix_id("vulnerability", token), "created": created, "modified": modified, "name": token, "external_references": [{"source_name": "cwe", "external_id": token, "url": f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"}], "object_marking_refs": [tlp_amber_id]}
                    out.append(self.add_obj(v, ("vulnerability", token)))
        return out

    def add_attack_patterns(self, *, created: str, modified: str, tlp_amber_id: str, tactics: list[Any], techniques: list[Any]) -> list[str]:
        out: list[str] = []
        tacts: list[str] = []
        for x in tactics:
            s = str(x).strip().lower().replace(" ", "-")
            if s:
                tacts.append(s)
        tacts = self.dedupe_keep(tacts)
        techs: list[str] = []
        for x in techniques:
            s = str(x).strip().upper()
            if s:
                techs.append(s)
        techs = self.dedupe_keep(techs)
        for tech in techs:
            if not re.match(r"^(T\d{4})(\.\d{3})?$", tech):
                continue
            base = tech.split(".")[0]
            ap = {"type": "attack-pattern", "spec_version": "2.1", "id": self.stix_id("attack-pattern", tech), "created": created, "modified": modified, "name": tech, "external_references": [{"source_name": "mitre-attack", "external_id": tech, "url": f"https://attack.mitre.org/techniques/{base}/"}], "kill_chain_phases": [{"kill_chain_name": "mitre-attack", "phase_name": t} for t in tacts] if tacts else None, "object_marking_refs": [tlp_amber_id]}
            ap = {k: v for k, v in ap.items() if v is not None}
            out.append(self.add_obj(ap, ("attack-pattern", tech)))
        return out

    def sensitive_add(self, *, sensitive: dict[str, list[dict[str, str]]], cat: str, values: list[Any]) -> None:
        vals: list[str] = []
        seen: set[str] = set()
        for v in values:
            s = str(v).strip()
            if not s:
                continue
            if s in seen:
                continue
            seen.add(s)
            vals.append(s)
        if not vals:
            return
        out: list[dict[str, str]] = []
        for v in vals:
            last4 = v[-4:] if len(v) >= 4 else v
            out.append({"sha256": self.sha256(v), "last4": last4})
        sensitive[cat] = out

