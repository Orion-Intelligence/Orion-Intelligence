from __future__ import annotations


def _objects_by_type(bundle: dict) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for obj in bundle["objects"]:
        grouped.setdefault(obj["type"], []).append(obj)
    return grouped


def _single(bundle: dict, object_type: str) -> dict:
    matches = _objects_by_type(bundle).get(object_type, [])
    assert matches, f"missing object type: {object_type}"
    assert len(matches) == 1, f"expected one {object_type}, got {len(matches)}"
    return matches[0]
