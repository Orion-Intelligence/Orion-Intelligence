from __future__ import annotations

import asyncio
from types import SimpleNamespace

from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import (
    search_consolidated_param_model,
)
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import (
    search_credential_param_model,
)
from routes import api_routes as ar
from orion.services.mongo_manager.shared_model.db_auth_models import user_role


def test_search_routes_hit_real_search_model_and_request_generator(monkeypatch):
    from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
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

    class _FakeAuditManager:
        async def register(self, *_args, **_kwargs):
            return "ok"

        async def search_audit(self, *_args, **_kwargs):
            return "ok"

    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _FakeElastic()))
    monkeypatch.setattr(AuditLogManager, "get_instance", staticmethod(lambda: _FakeAuditManager()))

    consolidated = search_consolidated_param_model(
        q="test", page=1, network="all", category="all", content="all"
    )
    consolidated_ioc = search_consolidated_param_model(
        q="test", page=1, network="all", category="all", content="all", ioc="m_email:test@example.com"
    )
    stealer = search_credential_param_model(q="ioc", type="c", page=1)
    user = SimpleNamespace(id="u1", tenant_uuid="t1", role=user_role.ADMIN)

    assert isinstance(asyncio.run(ar.search_general(consolidated, current_user=user, role=user_role.ADMIN, is_free=False)), dict)
    assert isinstance(asyncio.run(ar.search_leak(consolidated, current_user=user)), dict)
    assert isinstance(asyncio.run(ar.search_social(consolidated, current_user=user)), dict)
    assert isinstance(asyncio.run(ar.search_exploit(consolidated, current_user=user)), dict)
    assert isinstance(asyncio.run(ar.search_defacement(consolidated, current_user=user)), dict)
    assert asyncio.run(ar.search_consolidated(consolidated, current_user=user)) is not None
    assert isinstance(asyncio.run(ar.search_consolidated_iocs(consolidated_ioc, current_user=user)), dict)
    assert asyncio.run(ar.search_stealerlog(stealer, current_user=user)) is not None
    assert asyncio.run(ar.search_stealer_iocs(stealer, current_user=user)) is not None

    # Consolidated endpoint fans out to multiple search types; this should be much higher than 1.
    assert calls["ranked"] >= 10
    assert calls["query"] >= 2
