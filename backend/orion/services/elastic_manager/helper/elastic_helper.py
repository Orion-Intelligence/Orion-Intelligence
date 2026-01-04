from datetime import datetime, timezone
import re

from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS


class elastic_helper:
    @staticmethod
    def parse_daterange_ymd(daterange):
        if not daterange:
            return None
        parts = daterange.split(",")
        if len(parts) != 2:
            return None
        try:
            from_date_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
            to_date_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d")
            return from_date_obj, to_date_obj
        except ValueError:
            return None

    @staticmethod
    def daterange_to_strs(daterange, start_suffix="", end_suffix=""):
        parsed = elastic_helper.parse_daterange_ymd(daterange)
        if not parsed:
            return None, None
        from_date_obj, to_date_obj = parsed
        return from_date_obj.strftime("%Y-%m-%d") + start_suffix, to_date_obj.strftime("%Y-%m-%d") + end_suffix

    @staticmethod
    def extract_phrases_terms_quoted(raw_query):
        exact_phrases = re.findall(r'"([^"]+)"', raw_query)
        loose_terms = re.sub(r'"[^"]+"', "", raw_query).strip().split()
        quoted_value_match = re.fullmatch(r'"([^"]+)"', raw_query.strip())
        quoted_value = quoted_value_match.group(1) if quoted_value_match else None
        return exact_phrases, loose_terms, quoted_value

    @staticmethod
    def extract_phrases_terms(raw_query):
        exact_phrases = re.findall(r'"([^"]+)"', raw_query)
        loose_terms = re.sub(r'"[^"]+"', "", raw_query).strip().split()
        return exact_phrases, loose_terms

    @staticmethod
    def apply_matchtype(p_query_model):
        if getattr(p_query_model, "matchtype", None):
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

    @staticmethod
    def raw_query_or_star(q):
        if q == "":
            return "*"
        if q is None:
            return "*"
        if q == "*":
            return "*"
        rq = helper_controller.remove_stopwords_from_string(q)
        if rq == "":
            return "*"
        return rq

    @staticmethod
    def insight_value_count(index, field, agg_name):
        return {ELASTIC_KEYS.S_DOCUMENT: index, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {agg_name: {"value_count": {"field": field}}}}, }

    @staticmethod
    def insight_max(index, field, agg_name):
        return {ELASTIC_KEYS.S_DOCUMENT: index, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {agg_name: {"max": {"field": field}}}}, }

    @staticmethod
    def insight_min(index, field, agg_name):
        return {ELASTIC_KEYS.S_DOCUMENT: index, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {agg_name: {"min": {"field": field}}}}, }

    @staticmethod
    def insight_avg(index, field, agg_name):
        return {ELASTIC_KEYS.S_DOCUMENT: index, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {agg_name: {"avg": {"field": field}}}}, }

    @staticmethod
    def insight_terms(index, field, size, agg_name):
        return {ELASTIC_KEYS.S_DOCUMENT: index, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {agg_name: {"terms": {"field": field, "size": size}}}}, }

    @staticmethod
    def insight_range_gte_days(index, field, days, agg_name, count_field):
        return {ELASTIC_KEYS.S_DOCUMENT: index, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {field: {"gte": f"now-{days}d/d"}}}, "aggs": {agg_name: {"value_count": {"field": count_field}}}, }, }

    @staticmethod
    def graph_terms(index, field, size, agg_name, query=None):
        body = {"size": 0, "aggs": {agg_name: {"terms": {"field": field, "size": size}}}}
        if query is not None:
            body["query"] = query
        return {ELASTIC_KEYS.S_DOCUMENT: index, ELASTIC_KEYS.S_FILTER: body}

    @staticmethod
    def prepare_search_query(p_query_model):
        if hasattr(p_query_model, "matchtype") and p_query_model.matchtype:
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)
        raw_query = "*"
        if getattr(p_query_model, "q", None) and p_query_model.q != "*":
            raw_query = helper_controller.remove_stopwords_from_string(p_query_model.q or "")
        if raw_query == "":
            raw_query = "*"
        return raw_query

    @staticmethod
    def index_cards_common(p_index_data, index, hash_key="m_url"):
        index_entries = []
        utc_now = datetime.now(timezone.utc)
        current_timestamp = utc_now.isoformat()
        contact_link = p_index_data.get("contact_link", "")
        for card in p_index_data.get("cards_data", []):
            if not card.get("m_url") or not card.get("m_title"):
                continue
            hash_str = card.get(hash_key, "") + "_" + card.get("m_title", "")
            card["m_hash"] = helper_controller.generate_data_hash(hash_str)
            card["m_update_date"] = current_timestamp
            card["m_contact_link"] = contact_link
            cleaned_card = {k: v for k, v in card.items() if v is not None}
            index_entries.append({ELASTIC_KEYS.S_DOCUMENT: index, ELASTIC_KEYS.S_VALUE: cleaned_card})
        return index_entries