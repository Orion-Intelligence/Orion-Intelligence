import json
import re
import locale
from urllib.parse import urlparse, urlunparse
import stopwords
from starlette.requests import Request


class helper_controller:
  # Private Variables
  __instance = None

  @staticmethod
  def create_template_context(request: Request, response_data: dict) -> dict:
    return {
      "request": request,
      "vars": response_data
    }

  @staticmethod
  def load_json(p_file_path):
    f = open(p_file_path, )
    return json.load(f)

  @staticmethod
  def has_spaced_special_character(p_string):
    if bool(re.match('^[a-zA-Z0-9\s]*$', p_string)):
      return False
    else:
      return True

  @staticmethod
  def on_create_random_search_count(p_doc_size):
    locale.setlocale(locale.LC_ALL, '')
    m_doc_size = 1000 * p_doc_size / 10
    m_doc_size = int(m_doc_size * 2.36 + ((m_doc_size * 2.36) / 2) * 3)
    return f'{m_doc_size * 100:n}'

  @staticmethod
  def is_stop_word(p_word):
    if p_word in stopwords.get_stopwords("english"):
      return True
    else:
      return False

  @staticmethod
  def normalize_url(input_url):
    parsed = urlparse(input_url)
    normalized = parsed._replace(query='', fragment='')
    normalized_url = urlunparse(normalized).rstrip('/')
    return normalized_url
