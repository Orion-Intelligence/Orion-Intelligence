from __future__ import annotations
from typing import Any, Optional, Set, List
from .base import base_converter
from .utils import parse_ts_general, safe_get, as_list, first_nonempty, add_obj, stix_id

class general_converter(base_converter):
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
