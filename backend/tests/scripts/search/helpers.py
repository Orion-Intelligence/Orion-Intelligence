from __future__ import annotations

import asyncio


def _run(coro):
    return asyncio.run(coro)


def _hit(source: dict, *, index: str = "test-index", score: float = 1.0, doc_id: str = "doc-1") -> dict:
    return {
        "_id": doc_id,
        "_index": index,
        "_score": score,
        "_source": source,
    }


def _search_response(*hits: dict, total: int | None = None) -> dict:
    return {
        "hits": {
            "hits": list(hits),
            "total": {"value": len(hits) if total is None else total},
        }
    }
