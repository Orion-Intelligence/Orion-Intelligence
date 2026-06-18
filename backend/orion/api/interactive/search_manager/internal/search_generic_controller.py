from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_query_generator import search_query_generator
from orion.services.elastic_manager.elastic_controller import elastic_controller


class search_generic_controller:
    __instance = None

    @staticmethod
    def getInstance():
        if search_generic_controller.__instance is None:
            search_generic_controller.__instance = search_generic_controller()
        return search_generic_controller.__instance

    def __init__(self):
        if search_generic_controller.__instance is None:
            search_generic_controller.__instance = self

    @staticmethod
    def _positive_int(value, default):
        try:
            return max(1, int(value or default))
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _tune_query(query, page, size):
        query["from"] = 0
        query["size"] = min(max(page * size * 4, size * 4, 60), 1000)

        function_score = query.get("query", {}).get("function_score")
        if not isinstance(function_score, dict):
            return
        if "script_score" in function_score:
            return

        functions = [
            function for function in function_score.get("functions", [])
            if float(function.get("weight") or 0) > 0
        ]
        functions.extend([
            {
                "filter": {"exists": {"field": "m_update_date"}},
                "gauss": {
                    "m_update_date": {
                        "origin": "now",
                        "scale": "30d",
                        "offset": "3d",
                        "decay": 0.65
                    }
                },
                "weight": 1.2
            },
            {
                "filter": {"exists": {"field": "m_creation_date"}},
                "gauss": {
                    "m_creation_date": {
                        "origin": "now",
                        "scale": "45d",
                        "offset": "7d",
                        "decay": 0.7
                    }
                },
                "weight": 0.7
            },
        ])
        function_score["functions"] = functions
        function_score["score_mode"] = "sum"
        function_score["boost_mode"] = "sum"

    @staticmethod
    def _title(item):
        title = str(item.get("m_title") or "").strip()
        return " ".join(title.lower().split()) if title else ""

    @staticmethod
    def _date(item):
        for field in ("m_update_date", "m_creation_date", "m_leak_date", "m_message_date"):
            value = item.get(field)
            if value:
                return str(value)
        return ""

    @classmethod
    def _rerank_results(cls, results):
        rows = sorted(
            enumerate(results),
            key=lambda row: (cls._date(row[1]), float(row[1].get("_score") or 0), -row[0]),
            reverse=True
        )

        seen_titles = {}
        ranked = []
        for original_rank, item in rows:
            title = cls._title(item)
            duplicate_count = seen_titles.get(title, 0) if title else 0
            if title:
                seen_titles[title] = duplicate_count + 1
            ranked.append((
                -duplicate_count,
                cls._date(item),
                float(item.get("_score") or 0),
                -original_rank,
                item,
            ))

        ranked.sort(reverse=True)
        return [row[-1] for row in ranked]

    @staticmethod
    def _records(response):
        records = []
        if response and "hits" in response and "hits" in response["hits"]:
            for rank, hit in enumerate(response["hits"]["hits"]):
                source = hit.get("_source", {})
                source["_id"] = hit.get("_id", "")
                source.pop("m_embedding", None)
                source["rank_index"] = hit.get("_index")
                source["_score"] = hit.get("_score", 0)
                source["_rank"] = rank + 1
                records.append(source)

        total = 0
        if response and "hits" in response:
            total_field = response["hits"].get("total", 0)
            total = total_field.get("value", 0) if isinstance(total_field, dict) else int(total or 0)

        return records, total

    async def search_ranked_result(self, param: search_consolidated_param_model, base_index, blocked_categories, allowed_categories):
        filter_dict = param.entity_filter if param.entity_filter else {}
        page = self._positive_int(param.page, 1)
        result_size = self._positive_int(param.platform_result_count, 15)

        indices, query, indices_boost = search_query_generator().on_search_consolidated_ranked_data(
            param,
            filter_dict,
            base_index,
            blocked_categories,
            allowed_categories,
            "generic"
        )
        self._tune_query(query, page, result_size)

        response = await elastic_controller.get_instance().search_consolidated_ranked_query(
            indices,
            query,
            indices_boost
        )

        results, total = self._records(response)
        results = self._rerank_results(results)

        start = (page - 1) * result_size
        end = start + result_size
        page_results = results[start:end]
        for rank, item in enumerate(page_results, start=start + 1):
            item["_rank"] = rank

        total_pages = (total + result_size - 1) // result_size if result_size > 0 else 0
        return {"Result": page_results, "Page_Count": total_pages, "Total_Hits": total}
