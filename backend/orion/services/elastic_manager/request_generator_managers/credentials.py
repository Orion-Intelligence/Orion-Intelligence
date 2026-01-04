from datetime import datetime, timezone

from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX


class ElasticCredentialsMixin:
    @staticmethod
    def on_search_credentials_data(p_query_model):
        raw_query = p_query_model.q if p_query_model.q and p_query_model.q != "*" else ""
        if raw_query:
            raw_query = __import__("orion.helper_manager.helper_controller", fromlist=["helper_controller"]).helper_controller.remove_stopwords_from_string(raw_query)

        query = {
            "query": {"bool": {"should": [{"match": {"u": {"query": raw_query, "boost": 2.0}}}], "minimum_should_match": 1}},
            "from": max(0, (getattr(p_query_model, "page", 1) - 1) * 1),
            "size": 1,
            "track_total_hits": True,
        }

        return ELASTIC_INDEX.S_CREDENTIAL_INDEX, query

    @staticmethod
    def index_query_credential(p_index_data):
        now = datetime.now(timezone.utc).isoformat()
        bulk_entries = []

        for credential in p_index_data.get("m_credential_data", []):
            if not credential.get("username") or not credential.get("file"):
                continue

            helper_controller = __import__("orion.helper_manager.helper_controller", fromlist=["helper_controller"]).helper_controller
            m_hash = helper_controller.generate_data_hash(credential.get("username") + "_" + str(credential.get("file")))
            doc = {
                "u": credential.get("username"),
                "l": credential.get("link"),
                "s": credential.get("source"),
                "g": credential.get("group"),
                "fn": credential.get("file"),
                "c": now,
            }

            doc = {
                k: [i for i in v if i not in (None, "", "null")] if isinstance(v, list) else v
                for k, v in doc.items()
                if v not in (None, "", "null") and (not isinstance(v, list) or [i for i in v if i not in (None, "", "null")])
            }

            bulk_entries.append({"create": {"_index": ELASTIC_INDEX.S_CREDENTIAL_INDEX, "_id": m_hash}})
            bulk_entries.append(doc)

        return bulk_entries
