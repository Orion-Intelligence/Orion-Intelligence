from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import re
import uuid
from typing import Any, Dict, Optional, List, Set, Tuple

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
