from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

from orion.helper_manager.env_handler import env_handler


class CONSTANTS:
    S_SETTINGS_INDEX_EXPIRY_TIMEOUT = 5184000
    S_SETTINGS_INDEX_EXPIRY = 86400
    S_SETTINGS_INDEX_STATS_DAILY_TIMEOUT = 86400
    S_SETTINGS_INDEX_STATS_WEEKLY_TIMEOUT = 604800
    S_SETTINGS_SEARCHED_DOCUMENT_SIZE = 10
    S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC = 10
    S_SETTINGS_SEARCHED_DOCUMENT_SIZE_CONSOLIDATED = 15
    S_SETTINGS_FETCHED_DOCUMENT_SIZE = 30
    S_SETTINGS_FETCHED_INSIGHT_DOCUMENT_SIZE = 10
    S_SETTINGS_DIRECTORY_LIST_MAX_SIZE = 1000
    S_SETTINGS_SEARCH_MAX_DYNAMIC_RESOURCE_LIMIT = 1

    S_AUTH_SECRET_KEY = env_handler.get_instance().env("S_SUPER_PASSWORD_V1")
    S_AUTH_ALGORITHM = "HS256"
    S_AUTH_ACCESS_TOKEN_EXPIRE_MINUTES = 30
    S_AUTH_OAUTH2_SCHEME = OAuth2PasswordBearer(tokenUrl="token")
    S_AUTH_PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")

    S_ENCRYPTION_KEY= env_handler.get_instance().env("ENCRYPTION_KEY")

allowed_keys = {
    'm_search_all', 'm_asns', 'm_attacker', 'm_au_abn', 'm_au_acn', 'm_au_medicare', 'm_au_tfn', 'm_aws_secret', 'hashtags',
    'm_bitcoin_addresses', 'm_company_name', 'm_country', 'm_country_name', 'm_platform','m_credit_card', 'm_cve',
    'm_cwe', 'm_document_id', 'm_dumplink', 'm_email', 'm_employee_count',
    'm_encoded_urls', 'm_event', 'm_fac', 'm_file_path', 'm_file_paths', 'm_gpe', 'm_hashtag', 'm_author',
    'm_in_aadhaar', 'm_in_pan', 'm_in_passport', 'm_in_vehicle_registration', 'm_in_voter',
    'm_industry', 'm_ip', 'm_language', 'm_law', 'm_location', 'm_medical_license', 'm_mention',
    'm_mitre_ttp_name', 'm_mitre_ttp_type', 'm_monero_addresses', 'm_name', 'm_norp', 'm_org',
    'm_password', 'm_person', 'm_phone_number', 'm_product', 'm_social_media_profiles', 'm_states',
    'm_team', 'm_title', 'm_uk_nhs', 'm_uk_nino', 'm_url', 'm_us_bank_number', 'm_us_driver_license',
    'm_us_itin', 'm_us_passport', 'm_us_ssn', 'm_user_agents', 'm_username', 'm_xmpp_addresses',
    'm_yara_rule', 'm_domain'
}
