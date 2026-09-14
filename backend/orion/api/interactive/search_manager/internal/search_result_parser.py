def parse_ranked_hits(response):
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
