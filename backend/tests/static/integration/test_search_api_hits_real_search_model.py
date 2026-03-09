from __future__ import annotations

import asyncio

from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import (
    search_consolidated_param_model,
)
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import (
    search_credential_param_model,
)
from routes import api_routes as ar


def test_search_routes_hit_real_search_model_and_request_generator(monkeypatch):
    from orion.services.elastic_manager.elastic_controller import elastic_controller

    calls: dict[str, int] = {"ranked": 0, "query": 0}

    class _FakeElastic:
        async def search_consolidated_ranked_query(self, indices, query, indices_boost):
            calls["ranked"] += 1
            index_name = indices[0] if isinstance(indices, list) and indices else "generic_model"
            return {
                "hits": {
                    "total": {"value": 1},
                    "hits": [
                        {
                            "_id": "doc1",
                            "_index": index_name,
                            "_score": 1.0,
                            "_source": {
                                "m_hash": "h1",
                                "m_title": "t1",
                                "m_content": "c1",
                                "m_url": "https://example.org",
                                "m_base_url": "https://example.org",
                                "m_network": "clearnet",
                                "m_message_sharable_link": "https://example.org/post/1",
                                "m_platform": "x",
                                "m_channel_url": "https://example.org/channel",
                                "m_content_type": ["news"],
                            },
                        }
                    ],
                }
            }

        async def search_query(self, document, data_filter):
            calls["query"] += 1
            return True, {
                "hits": {
                    "total": {"value": 1},
                    "hits": [
                        {
                            "_id": "s1",
                            "_index": str(document),
                            "_source": {
                                "type": "credential",
                                "raw": "alice:pass",
                                "channel": "telegram",
                                "file": "dump.txt",
                                "m_hash": "h2",
                            },
                        }
                    ],
                }
            }

    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _FakeElastic()))

    consolidated = search_consolidated_param_model(
        q="test", page=1, network="all", category="all", content="all"
    )
    consolidated_ioc = search_consolidated_param_model(
        q="test", page=1, network="all", category="all", content="all", ioc="m_email:test@example.com"
    )
    stealer = search_credential_param_model(q="ioc", type="c", page=1)

    assert isinstance(asyncio.run(ar.search_general(consolidated)), dict)
    assert isinstance(asyncio.run(ar.search_leak(consolidated)), dict)
    assert isinstance(asyncio.run(ar.search_social(consolidated)), dict)
    assert isinstance(asyncio.run(ar.search_exploit(consolidated)), dict)
    assert isinstance(asyncio.run(ar.search_defacement(consolidated)), dict)
    assert asyncio.run(ar.search_consolidated(consolidated)) is not None
    assert isinstance(asyncio.run(ar.search_consolidated_iocs(consolidated_ioc)), dict)
    assert asyncio.run(ar.search_stealerlog(stealer)) is not None
    assert asyncio.run(ar.search_stealer_iocs(stealer)) is not None

    # Consolidated endpoint fans out to multiple search types; this should be much higher than 1.
    assert calls["ranked"] >= 10
    assert calls["query"] >= 2
