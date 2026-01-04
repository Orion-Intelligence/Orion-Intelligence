import hashlib
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


class StixHelper:
    def __init__(self, allow_date_only: bool = True):
        self._allow_date_only = allow_date_only

    def safe_get(self, obj: Any, key: str, default: Any = None) -> Any:
        return getattr(obj, key, default)

    def as_list(self, v: Any) -> List[Any]:
        if v is None:
            return []
        if isinstance(v, list):
            return [x for x in v if x is not None and x != ""]
        return [v] if v != "" else []

    def clean_text(self, v: Any) -> Optional[str]:
        if v is None:
            return None
        s = str(v).strip()
        return s if s else None

    def first_nonempty(self, *vals: Any) -> Optional[str]:
        for v in vals:
            s = self.clean_text(v)
            if s:
                return s
        return None

    def escape_pat(self, s: str) -> str:
        return s.replace("\\", "\\\\").replace("'", "\\'")

    def now_ts(self) -> str:
        return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")

    def parse_ts(self, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        try:
            v = str(value).strip()
            if self._allow_date_only and re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
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

    def uuid5(self, seed: str) -> str:
        return str(uuid.uuid5(uuid.NAMESPACE_URL, seed))

    def stix_id(self, stix_type: str, seed: str) -> str:
        return f"{stix_type}--{self.uuid5(f'{stix_type}:{seed}')}"

    def sco_id(self, sco_type: str, seed: str) -> str:
        return f"{sco_type}--{self.uuid5(f'{sco_type}:{seed}')}"

    def sha256(self, v: str) -> str:
        return hashlib.sha256(v.encode("utf-8", errors="ignore")).hexdigest()

    def add_obj(self, objects: List[Dict[str, Any]],
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

    def add_sensitive(self, sensitive: Dict[str, List[Dict[str, str]]], cat: str, values: List[Any]) -> None:
        vals = [str(v).strip() for v in values if str(v).strip()]
        if not vals:
            return
        out: List[Dict[str, str]] = []
        for v in sorted(set(vals)):
            last4 = v[-4:] if len(v) >= 4 else v
            out.append({"sha256": self.sha256(v), "last4": last4})
        sensitive[cat] = out

    def add_indicator(self,
                      objects: List[Dict[str, Any]],
                      seen: Dict[Tuple[str, str], str],
                      created: str,
                      modified: str,
                      labels,
                      tlp_amber_id: str,
                      name: str,
                      pattern: str,
                      types: List[str]) -> str:
        ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": self.stix_id(
            "indicator",
            f"{name}|{pattern}"), "created": created, "modified": modified, "name": name, "indicator_types": types,
            "pattern_type": "stix", "pattern": pattern, "valid_from": created, "labels": sorted(
            labels), "object_marking_refs": [tlp_amber_id], }
        ind = {k: v for k, v in ind.items() if v is not None}
        return self.add_obj(objects, seen, ind, uniq=("indicator", ind["id"]))
