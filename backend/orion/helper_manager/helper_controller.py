import asyncio
import copy
import json
import hashlib
import locale
import re

from fastapi import HTTPException
from jinja2 import Environment
from jinja2 import FileSystemLoader
from urllib.parse import urlparse, urlunparse

from deep_translator import GoogleTranslator
from starlette.requests import Request
from stopwords import get_stopwords

from orion.constants import constant
from orion.constants.constant import CONSTANTS, allowed_keys
from orion.helper_manager.env_handler import env_handler
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.log_manager.log_controller import log
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS


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
    def extract_stealer_hash(log):
        email = log["email"][0] if log.get("email") else None
        username = log["username"][0] if log.get("username") else None
        domain = log["domain"][0] if log.get("domain") else None
        ip = log["ip"][0] if log.get("ip") else None
        channel = log.get("channel")

        if log.get("type") in ("c", "credential"):
            if not email and not username:
                return None
            val = email or username
        else:
            if not any([email, username, domain, ip, channel]):
                return None
            val = email or username or domain or ip or channel

        seed = f"{val}|{channel or ''}"
        return hashlib.sha256(seed.lower().encode("utf-8", "ignore")).hexdigest()

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
            allowed_filtered = {
                k: (v if isinstance(v, list) else [v])
                for k, v in pfilter.items()
                if k in allowed_keys or k == "m_search_all"
            }
            clauses = []

            for k, vals in allowed_filtered.items():
                for val in vals:
                    fields = allowed_keys if k == "m_search_all" else [k]
                    clauses.append({
                        "bool": {
                            "should": (
                                    [{"term": {f: {"value": val, "case_insensitive": True}}} for f in fields] +
                                    [{"match": {f: val}} for f in fields] +
                                    [{"match_phrase": {f: val}} for f in fields] +
                                    [{"prefix": {f: val}} for f in fields]
                            ),
                            "minimum_should_match": 1
                        }
                    })

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
    def extract_user_mail_fields(data):
        return (
            (data.username or "").strip(),
            (data.email or "").strip().lower(),
            data.password,
        )

    @staticmethod
    def validate_company_email_domain(email: str, detail: str = "Please enter your company email (Gmail, Yahoo, etc. not allowed)."):
        NON_COMPANY_DOMAINS = {
            "gmail.com",
            "yahoo.com",
            "hotmail.com",
            "outlook.com",
            "proton.me",
            "protonmail.com",
            "mail.ru",
            "aol.com",
            "icloud.com",
            "msn.com",
            "live.com",
            "zoho.com",
            "gmx.com",
            "gmx.net",
            "yandex.com",
            "yandex.ru",
            "fastmail.com",
            "pm.me",
            "me.com",
            "mail.com",
            "inbox.com",
        }

        production = str(env_handler.get_instance().env("PRODUCTION", 0))
        if production != "1":
            return

        domain = (email or "").split("@")[-1].lower()
        if domain in NON_COMPANY_DOMAINS:
            raise HTTPException(status_code=400, detail=detail)

    @staticmethod
    def build_assets(build_dir):
        entities_file = build_dir / "assets" / "data" / "entities_data" / "entities.json"
        if not entities_file.exists():
            raise FileNotFoundError(f"entities.json not found at {entities_file}")

        with open(entities_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        allowed_keys.clear()
        for item in data:
            if "key" in item:
                allowed_keys.add(item["key"])

        mail_templete_env = Environment(loader=FileSystemLoader(build_dir / "assets" / "data" / "mail_template_data"))
        constant.mail_template = mail_templete_env.get_template("mail_template.html")
        license_rules_env = Environment(loader=FileSystemLoader(build_dir / "assets" / "data" / "licenses"))
        license_rules_template = license_rules_env.get_template("license_rules.json")
        license_rules_json_str = license_rules_template.render()
        constant.license_rules = json.loads(license_rules_json_str)
        url_rules_env = Environment(loader=FileSystemLoader(build_dir / "assets" / "data" / "url_rules"))
        url_rules_template = url_rules_env.get_template("url_rules.json")
        url_rules_json_str = url_rules_template.render()
        constant.url_rules = json.loads(url_rules_json_str)
        map_entities_env = Environment(loader=FileSystemLoader(build_dir / "assets" / "data" / "satellite"))
        satellite_asset = map_entities_env.get_template(CONSTANTS.S_SATELLITE_ASSET_FILE_NAME).render()
        version, data = helper_controller.parse_satellite_asset(satellite_asset)
        constant.map_entities_version = version
        constant.map_entities_data = data

    @staticmethod
    def parse_satellite_asset(asset_data):
        payload = json.loads(asset_data)
        if isinstance(payload, dict):
            version = int(payload.get("version") or 0)
            data = payload.get("data") or []
        else:
            version = 0
            data = payload
        return version, json.dumps(data)

    @staticmethod
    async def build_satellite_asset_if_needed(map_entities_file):
        version, data = helper_controller.parse_satellite_asset(map_entities_file.read_text(encoding="utf-8"))
        if version <= 0:
            log.g().w("Satellite asset version missing, indexing skipped")
            return False

        stored_version = await redis_controller.getInstance().invoke_trigger(
            REDIS_COMMANDS.S_GET_STRING, [REDIS_KEYS.SATELLITE_ASSET_VERSION, None, None])
        stored_version = int(stored_version or 0)

        constant.map_entities_version = version
        constant.map_entities_data = data

        if stored_version and version <= stored_version:
            log.g().i(f"Satellite asset version {version} already indexed")
            return False

        await elastic_controller.get_instance().reindex_map_entities_data()
        await redis_controller.getInstance().invoke_trigger(
            REDIS_COMMANDS.S_SET_STRING, [REDIS_KEYS.SATELLITE_ASSET_VERSION, str(version), None])
        return True

    @staticmethod
    async def init_map_entities_task(build_dir):
        asyncio.create_task(helper_controller.init_map_entities(build_dir))

    @staticmethod
    async def init_map_entities(build_dir):
        map_entities_file = None
        map_entities_candidates = [
            build_dir / "assets" / "data" / "satellite" / CONSTANTS.S_SATELLITE_ASSET_FILE_NAME,
            build_dir.parent / "client" / "src" / "assets" / "data" / "satellite" / CONSTANTS.S_SATELLITE_ASSET_FILE_NAME,
        ]

        for candidate in map_entities_candidates:
            if candidate.exists():
                map_entities_file = candidate
                break

        if not map_entities_file:
            log.g().w("Map entities file not found, file watching disabled")
            return

        log.g().i(f"Loading map entities data from: {map_entities_file}")
        try:
            if await helper_controller.build_satellite_asset_if_needed(map_entities_file):
                log.g().i("Initial map entities data indexed successfully")
        except Exception as ex:
            log.g().e(f"Error during initial indexing: {str(ex)}")

        last_modified = map_entities_file.stat().st_mtime
        log.g().i(f"File watcher started for: {map_entities_file}")

        while True:
            try:
                await asyncio.sleep(5)
                if map_entities_file.exists():
                    current_modified = map_entities_file.stat().st_mtime
                    if current_modified > last_modified:
                        last_modified = current_modified
                        log.g().i(f"Detected change in {map_entities_file.name}, re-indexing...")
                        try:
                            await helper_controller.build_satellite_asset_if_needed(map_entities_file)
                        except Exception as ex:
                            log.g().e(f"Error during re-indexing: {str(ex)}")
            except Exception as ex:
                log.g().e(f"File watcher error: {str(ex)}")
                await asyncio.sleep(5)

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

    @staticmethod
    def parse_tagged_logic_query_for_iocs(query: str):
        query = query.replace("&&", " AND ").replace("||", " OR ")
        tokens = query.split()

        output = []
        current = []
        op = None

        for token in tokens:
            t = token.upper()
            if t in ("AND", "OR"):
                op = t
                continue

            if ":" not in token:
                continue

            tag, value = token.split(":", 1)
            node = {"tag": tag.strip(), "value": value.strip()}

            if op == "AND":
                if current:
                    last = current.pop()
                    current.append({"AND": [last, node]})
                else:
                    current.append(node)
            elif op == "OR":
                if current:
                    output.append(current)
                current = [node]
            else:
                current.append(node)

            op = None

        if output:
            return {"OR": [item for sub in output for item in sub] + current}
        return current[0] if len(current) == 1 else current

    @staticmethod
    def password_matches_schema(password: str, schema) -> bool:
        if not password:
            return False

        min_l = schema.minLength or 0
        max_l = schema.maxLength or 10_000

        if not (min_l <= len(password) <= max_l):
            return False

        if getattr(schema, "hasAlphabets", False):
            if not re.search(r"[a-zA-Z]", password):
                return False

        if getattr(schema, "hasNumbers", False):
            if not re.search(r"[0-9]", password):
                return False

        if getattr(schema, "hasSpecialChars", False):
            if not re.search(r"[^a-zA-Z0-9]", password):
                return False

        return True

    @staticmethod
    def _country_alias_key(value):
        return re.sub(r"[^a-z0-9]+", "", value.lower())

    @staticmethod
    def _expand_country_filter_values(value):
        values = [value]
        COUNTRY_ALIASES = {
        "us": ["US", "USA", "U.S.", "U.S.A.", "United States", "United States of America"],
        "usa": ["US", "USA", "U.S.", "U.S.A.", "United States", "United States of America"],
        "unitedstates": ["US", "USA", "U.S.", "U.S.A.", "United States", "United States of America"],
        "unitedstatesofamerica": ["US", "USA", "U.S.", "U.S.A.", "United States", "United States of America"],
        "uk": ["UK", "GB", "GBR", "United Kingdom", "Great Britain"],
        "gb": ["UK", "GB", "GBR", "United Kingdom", "Great Britain"],
        "gbr": ["UK", "GB", "GBR", "United Kingdom", "Great Britain"],
        "unitedkingdom": ["UK", "GB", "GBR", "United Kingdom", "Great Britain"],
        "uae": ["UAE", "AE", "United Arab Emirates"],
        "unitedarabemirates": ["UAE", "AE", "United Arab Emirates"],
        "ksa": ["KSA", "SA", "Saudi Arabia"],
        "saudiarabia": ["KSA", "SA", "Saudi Arabia"],
        "southkorea": ["South Korea", "Korea, Republic of", "Republic of Korea", "KR", "KOR"],
        "northkorea": ["North Korea", "Korea, Democratic People's Republic of", "KP", "PRK"],
        "russia": ["Russia", "Russian Federation", "RU", "RUS"],
        }
        values.extend(COUNTRY_ALIASES.get(helper_controller._country_alias_key(value),
            []
        ))
        return list(dict.fromkeys(v for v in values if v))
