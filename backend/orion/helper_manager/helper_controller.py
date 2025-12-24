import copy
import json
import hashlib
import locale
import re
from urllib.parse import urlparse, urlunparse

from deep_translator import GoogleTranslator
from starlette.requests import Request
from stopwords import get_stopwords


class helper_controller:
    __instance = None

    @staticmethod
    def parse_filters_json(json_str):
        try:
            data = json.loads(json_str)
            result = {}
            for item in data:
                category = item.get("categoryId")
                tags = item.get("tags", [])
                result[category] = tags
            return result
        except json.JSONDecodeError as e:
            print(f"Invalid JSON: {e}")
            return {}

    @staticmethod
    def create_template_context(request: Request, response_data: dict) -> dict:
        return {"request": request, "vars": response_data}

    @staticmethod
    def get_base_url(url):
        parsed_url = urlparse(url)
        netloc = parsed_url.netloc.replace('www.', '') if parsed_url.netloc.startswith('www.') else parsed_url.netloc
        base_url = f"{parsed_url.scheme}://{netloc}"
        return base_url

    @staticmethod
    def getFilterClause(pfilter, p_query_model, allowed_keys):
        must_filter_clauses = []
        should_filter_clauses = []

        if pfilter:
            allowed_filtered = {k: v for k, v in pfilter.items() if k in allowed_keys or k == "m_search_all"}
            clauses = []

            for k, vals in allowed_filtered.items():
                if k == "m_search_all":
                    for val in vals:
                        search_all_clause = {"bool": {"should": [{"term": {field: val}} for field in
                            allowed_keys], "minimum_should_match": 1}}
                        clauses.append(search_all_clause)
                else:
                    clauses.extend([{"term": {k: val}} for val in vals])

            if p_query_model.must:
                must_filter_clauses = clauses
            else:
                should_filter_clauses = {"bool": {"should": clauses}}

        return must_filter_clauses, should_filter_clauses

    @staticmethod
    def generate_data_hash(data):
        if isinstance(data, dict):
            data_copy = {key: value for key, value in data.items() if
                key not in {'m_update_date', 'm_base_url', 'm_url'}}
            data_string = json.dumps(data_copy, sort_keys=True)
        elif isinstance(data, str):
            data_string = data
        else:
            raise ValueError("Input must be a dictionary or a string")
        return hashlib.sha256(data_string.encode('utf-8')).hexdigest()

    @staticmethod
    def on_create_random_search_count(p_doc_size):
        locale.setlocale(locale.LC_ALL, '')
        m_doc_size = 1000 * p_doc_size / 10
        m_doc_size = int(m_doc_size * 2.36 + ((m_doc_size * 2.36) / 2) * 3)
        return f'{m_doc_size * 100:n}'

    @staticmethod
    def detect_and_translate(text: str, target_lang: str) -> str:
        try:
            translated_text = GoogleTranslator(source='auto', target=target_lang).translate(text[0:4500])
            return translated_text
        except Exception as e:
            return f"Error translating text: {str(e)}"

    @staticmethod
    def normalize_url(input_url):
        parsed = urlparse(input_url)
        normalized = parsed._replace(query='', fragment='')
        normalized_url = urlunparse(normalized).rstrip('/')
        return normalized_url

    @staticmethod
    def clone_model(model):
        return copy.deepcopy(model)

    @staticmethod
    def extract_first_email(text):
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0) if match else None

    @staticmethod
    def extract_domains_from_text(text: str) -> list[str]:
        url_regex = re.compile(
            r'(?:https?://)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:[/?][^\s]*)?', re.IGNORECASE)
        matches = url_regex.findall(text)
        domains = set()
        for match in matches:
            domain = match.lower()
            if domain.startswith("www."):
                domain = domain[4:]
            domains.add(domain)
        return sorted(domains)

    @staticmethod
    def strip_query(query, size=20):
        query["size"] = size
        query.pop("highlight", None)
        query.pop("suggest", None)
        return query

    @staticmethod
    def transform_query_match(query: str, matchtype: str) -> str:
        query = " ".join(query.strip().split())
        if not query or query.count('"') >= 2:
            return query
        if matchtype == "or":
            return query
        if matchtype == "and":
            return " ".join(f'"{t}"' for t in query.split())
        if matchtype == "full":
            return f'"{query}"'
        return query

    @staticmethod
    def remove_stopwords_from_string(text: str) -> str:
        stopword_set = set(get_stopwords("en"))

        additional_stopwords = {"was", "by", "were", "been", "being", "have", "has", "had", "do", "does", "did", "will",
            "would", "shall", "should", "may", "might", "can", "could", "must", "i", "you", "he", "she", "it", "we",
            "they", "me", "him", "her", "them", "my", "your", "his", "its", "our", "their", "mine", "yours", "hers",
            "ours", "theirs", "this", "that", "these", "those", "here", "there", "where", "when", "why", "how", "also",
            "just", "still", "even", "yet", "so", "than", "then", "very", "too", "because", "while", "though",
            "although", "if", "unless", "until", "before", "after", "once", "again", "ever", "always", "sometimes",
            "often", "never", "each", "every", "any", "all", "some", "no", "none", "both", "either", "neither", "few",
            "several", "many", "much", "most", "more", "less", "lot", "lots", "such", "get", "got", "gets", "getting",
            "make", "makes", "made", "say", "says", "said", "go", "goes", "went", "gone", "see", "sees", "saw", "seen",
            "know", "knows", "knew", "known", "take", "takes", "took", "taken", "come", "comes", "came", "coming",
            "thing", "things", "something", "anything", "everything", "nothing"}

        stopword_set.update(additional_stopwords)

        quoted_phrases = re.findall(r'"([^"]+)"', text)
        unquoted_part = re.sub(r'"[^"]+"', '', text)

        tokens = unquoted_part.split()
        filtered_tokens = [token for token in tokens if token.lower() not in stopword_set]

        result_parts = ['"{}"'.format(p) for p in quoted_phrases] + filtered_tokens
        return ' '.join(result_parts)
