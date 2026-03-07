from __future__ import annotations

from types import SimpleNamespace

from orion.api.interactive.search_manager.search_model import search_model
from orion.services.elastic_manager.elastic_controller import elastic_controller


class _FakeElastic:
    async def search_query(self, document, data_filter):
        return True, {
            "hits": {
                "hits": [
                    {"_source": {"caption": "wanted", "name": "John Example"}},
                    {"_source": {"caption": "watchlist", "name": "Jane Example"}},
                ]
            }
        }


class _FakeElasticEmpty:
    async def search_query(self, document, data_filter):
        return False, {}


def test_build_ranked_response_shapes_result():
    resp = {
        "hits": {
            "total": {"value": 3},
            "hits": [
                {"_index": "leak_model", "_score": 1.2, "_source": {"m_hash": "h1", "m_embedding": [1, 2]}},
                {"_index": "social_model", "_score": 0.8, "_source": {"m_hash": "h2"}},
            ],
        }
    }
    query = {"size": 2}

    out = search_model._build_ranked_response(resp, query, 10)

    assert out["Total_Hits"] == 3
    assert out["Page_Count"] == 2
    assert len(out["Result"]) == 2
    assert "m_embedding" not in out["Result"][0]
    assert out["Result"][0]["_rank"] == 1


def test_search_wanted_list_returns_cards(monkeypatch):
    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _FakeElastic()))

    model = SimpleNamespace(text={"query": "john example"})
    out = __import__("asyncio").run(search_model.search_wanted_list(model))

    assert out["total"] == 2
    assert len(out["cards_data"]) == 2


def test_search_wanted_list_empty_query():
    model = SimpleNamespace(text={"query": ""})
    out = __import__("asyncio").run(search_model.search_wanted_list(model))

    assert out == {"cards_data": [], "total": 0}


def test_search_wanted_list_search_failure(monkeypatch):
    monkeypatch.setattr(elastic_controller, "get_instance", staticmethod(lambda: _FakeElasticEmpty()))

    model = SimpleNamespace(text={"query": "john example"})
    out = __import__("asyncio").run(search_model.search_wanted_list(model))

    assert out == {"cards_data": [], "total": 0}
