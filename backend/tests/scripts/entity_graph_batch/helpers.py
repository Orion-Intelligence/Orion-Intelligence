from __future__ import annotations

import asyncio


def run(coro):
    return asyncio.run(coro)


def graph_item(doc_key: str, property_key: str, property_value: str) -> dict:
    doc_id = f"cti_vertices/{doc_key}"
    property_id = f"cti_vertices/{property_key}:{property_value.lower()}"
    return {
        "vertex": {"_id": doc_id, "_key": doc_key, "type": "document"},
        "edge": {
            "_id": f"cti_edges/{doc_key}-{property_key}-{property_value.lower()}",
            "_from": doc_id,
            "_to": property_id,
            "type": f"has_{property_key.replace('m_', '')}",
        },
        "path": {
            "vertices": [{"_id": doc_id, "_key": doc_key, "type": "document"}],
            "edges": [],
        },
    }
