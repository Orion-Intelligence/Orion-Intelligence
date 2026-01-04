from __future__ import annotations
from typing import Any, Dict, Optional, List
from .base import base_converter
from .utils import safe_get, as_list, first_nonempty, add_obj, stix_id

class leak_converter(base_converter):
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
