import hashlib
import json
import locale
from urllib.parse import urlparse, urlunparse
from deep_translator import GoogleTranslator
from starlette.requests import Request


class helper_controller:
  __instance = None

  @staticmethod
  def create_template_context(request: Request, response_data: dict) -> dict:
    return {
      "request": request,
      "vars": response_data
    }

  @staticmethod
  def get_base_url(url):
    parsed_url = urlparse(url)
    netloc = parsed_url.netloc.replace('www.', '') if parsed_url.netloc.startswith('www.') else parsed_url.netloc
    base_url = f"{parsed_url.scheme}://{netloc}"
    return base_url

  @staticmethod
  def generate_data_hash(data):
    if isinstance(data, dict):
      data_copy = {key: value for key, value in data.items() if key not in {'m_update_date', 'm_base_url', 'm_url'}}
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