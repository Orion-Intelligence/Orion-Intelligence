import hashlib
import re
from datetime import datetime

from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import (
    search_credential_param_model,
)
from orion.services.bloom_manager.bloom_controller import bloom_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.helper_manager.helper_controller import helper_controller


class ElasticStealerlogsMixin:
    @staticmethod
    def on_search_stealerlogs_data(p_query_model: search_credential_param_model, pFilter, consolidated=False, alert=False):
        p_query_model.q = ""

        extra_user_terms = []
        extra_domains = []
        if pFilter:
            if pFilter.get("m_username"):
                extra_user_terms.extend([str(v).strip().lower() for v in pFilter["m_username"] if v and str(v).strip()])

            for key in ("m_url", "m_domain", "m_search_all"):
                vals = pFilter.get(key)
                if vals:
                    for v in vals:
                        s = str(v).strip()
                        if not s:
                            continue
                        extra_domains.append(s.lower())

        if alert:
            if extra_domains.__len__() > 0:
                p_query_model.url = extra_domains[0]
            elif extra_user_terms.__len__() > 0:
                p_query_model.user = extra_user_terms[0]
            p_query_model.entity_filter = {}
            if not p_query_model.user and not p_query_model.url:
                return None, None

        url = helper_controller.extract_domains_from_text(p_query_model.q)
        if len(url) > 0:
            p_query_model.url = url[0]

        user = helper_controller.extract_first_email(p_query_model.q)
        if not user:
            user = p_query_model.q

        if not p_query_model.user and user:
            p_query_model.user = user

        if not p_query_model.url and not p_query_model.user and consolidated:
            return None, None

        user_query = p_query_model.user.strip() if p_query_model.user and p_query_model.user != "*" else ""

        raw_url = p_query_model.url.strip() if p_query_model.url else ""
        url_query = ""
        if raw_url:
            u = re.sub(r"^(?:[a-zA-Z0-9+.-]+://)?(?:www\.)?", "", raw_url)
            url_query = re.split(r"[/:?#]", u)[0].lower()

        category = (p_query_model.category or "").strip()
        if category and category.lower().startswith("log"):
            must_should = [{"term": {"type.keyword": "logs"}}]
        else:
            must_should = []

        if not (user_query or url_query or extra_user_terms or extra_domains):
            page = getattr(p_query_model, "page", 1) or 1
            size = getattr(p_query_model, "size", 500) or 500
            frm = (page - 1) * size
            if frm < 0:
                frm = 0

            query = {
                "query": {"bool": {"must": must_should if must_should else [{"match_all": {}}]}},
                "from": frm,
                "size": size,
                "track_total_hits": False,
                "track_scores": False,
                "terminate_after": 3000,
                "sort": [{"_shard_doc": "asc"}],
                "_source": ["url", "username", "domain", "email", "password", "ip", "channel", "type", "raw", "file"],
            }

            return ELASTIC_INDEX.S_STEALERLOGS_INDEX, query

        date_range_filter = {}

        should_clauses = []

        if user_query:
            terms = re.findall(r'"([^"]+)"|(\S+)', user_query.lower())
            for quoted, unquoted in terms:
                term = (quoted or unquoted).lower()
                if "@" in term:
                    must_should.append({"bool": {"should": [{"term": {"email.keyword": term}}], "minimum_should_match": 1}})
                else:
                    must_should.append(
                        {
                            "bool": {
                                "should": [{"wildcard": {"username.keyword": {"value": term.lower(), "case_insensitive": True}}}],
                                "minimum_should_match": 1,
                            }
                        }
                    )

        for t in extra_user_terms:
            t = t.lower()
            must_should.append(
                {
                    "bool": {
                        "should": [
                            {"term": {"email.keyword": t}},
                            {"wildcard": {"username.keyword": {"value": t.lower(), "case_insensitive": True}}},
                            {"term": {"domain.keyword": t}},
                        ],
                        "minimum_should_match": 1,
                    }
                }
            )
        if url_query:
            should_clauses.append({"term": {"domain.keyword": url_query}})
        for d in extra_domains:
            should_clauses.append({"term": {"domain.keyword": d}})

        bool_query = {}
        if must_should:
            bool_query["must"] = must_should
        if should_clauses:
            bool_query.setdefault("filter", []).append({"bool": {"should": should_clauses, "minimum_should_match": 1}})
        if date_range_filter:
            bool_query.setdefault("filter", []).append(date_range_filter)

        page = getattr(p_query_model, "page", 1) or 1
        size = getattr(p_query_model, "size", 500) or 500
        frm = (page - 1) * size
        if frm < 0:
            frm = 0

        if not bool_query:
            return None, None

        query = {
            "query": {"bool": bool_query},
            "from": frm,
            "size": size,
            "sort": [{"_shard_doc": "asc"}],
            "track_total_hits": False,
            "track_scores": False,
            "_source": ["url", "username", "domain", "email", "password", "ip", "channel", "type", "raw", "_id", "file"],
        }

        return ELASTIC_INDEX.S_STEALERLOGS_INDEX, query

    @staticmethod
    def index_query_stealerlog(p_index_data):
        bulk_entries = []
        bf = bloom_controller(dirpath="bloom_data", capacity=1_000_000_000, error_rate=0.01)

        for log in p_index_data["logs"]:
            email = log["email"][0] if "email" in log and log["email"] else None
            username = log["username"][0] if "username" in log and log["username"] else None
            domain = log["domain"][0] if "domain" in log and log["domain"] else None
            ip = log["ip"][0] if "ip" in log and log["ip"] else None
            channel = log["channel"] if "channel" in log else None

            if log["type"] == "c" or log["type"] == "credential":
                if not email and not username:
                    continue

                val = email or username
                seed = str(val) + "|" + str(channel or "")
            else:
                if not any([email, username, domain, ip, channel]):
                    continue
                val = email or username or domain or ip or channel
                seed = str(val) + "|" + str(channel or "")

            m_hash = hashlib.sha256(seed.lower().encode("utf-8", "ignore")).hexdigest()
            _id = str(datetime.utcnow().year) + "_UTC_" + m_hash

            if bf.isduplicate(m_hash):
                continue

            doc = {}
            for k in log:
                if log[k] is not None:
                    doc[k] = log[k]

            bulk_entries.append({"create": {"_index": ELASTIC_INDEX.S_STEALERLOGS_INDEX, "_id": _id}})
            bulk_entries.append(doc)

        return bulk_entries
