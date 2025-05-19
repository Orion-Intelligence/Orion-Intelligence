from abc import ABC
from typing import List
from playwright.sync_api import Page
import re

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _krakenccj3wr23452a4ibkbkuph4d6soyx2xgjoogtuamc3m7u7wemad(leak_extractor_interface, ABC):
  _instance = None

  def __init__(self, callback=None):

    self.callback = callback
    self._card_data = []
    self._entity_data = []
    self.soup = None
    self._initialized = None
    self._redis_instance = redis_controller()

  def init_callback(self, callback=None):

    self.callback = callback

  def __new__(cls, callback=None):

    if cls._instance is None:
      cls._instance = super(_krakenccj3wr23452a4ibkbkuph4d6soyx2xgjoogtuamc3m7u7wemad, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:

    return "http://krakenccj3wr23452a4ibkbkuph4d6soyx2xgjoogtuamc3m7u7wemad.onion"

  @property
  def base_url(self) -> str:

    return "http://krakenccj3wr23452a4ibkbkuph4d6soyx2xgjoogtuamc3m7u7wemad.onion"

  @property
  def rule_config(self) -> RuleModel:

    return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT)

  @property
  def card_data(self) -> List[leak_model]:

    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:

    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:

    return "http://krakenccj3wr23452a4ibkbkuph4d6soyx2xgjoogtuamc3m7u7wemad.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):

    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      self.callback()

  def parse_leak_data(self, page: Page):
    try:
      base_url = self.base_url
      all_hrefs = []

      detail_elements = page.query_selector_all('a[href*="/news/"]')
      for element in detail_elements:
        href = element.get_attribute("href")
        if href and href not in all_hrefs:
          absolute_href = f"{base_url}{href}" if href.startswith('/') else href
          all_hrefs.append(absolute_href)

      error_count = 0

      for href in all_hrefs:
        try:
          page.goto(href)

          page.wait_for_selector('.col h4')
          page.wait_for_selector('div[style*="white-space: pre-wrap"]')

          title_element = page.query_selector('.col h4')
          title = title_element.inner_text().strip() if title_element else ""

          description_element = page.query_selector('div[style*="white-space: pre-wrap"]')
          description = description_element.inner_text().strip() if description_element else ""
          description = description.replace("\n", " ")

          weblink = []
          if (title.lower().startswith("www") and
              (title.lower().endswith(".com") or
               title.lower().endswith(".law") or
               title.lower().endswith(".net"))):
            weblink = [title]

          url_pattern = r'(?:https?:/?/?|http:/?/?)[^\s]*?(?:\.com|\.onion)'
          matches = re.findall(url_pattern, description)

          cleaned_urls = []
          for match in matches:
            if not match.startswith('http'):
              continue
            if match.endswith('.com') or match.endswith('.onion'):
              cleaned_urls.append(match)

          m_websites = cleaned_urls

          is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
          ref_html = None
          if is_crawled != -1 and is_crawled < 5:
            ref_html = helper_method.extract_refhtml(title)
            if ref_html:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
            else:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

          card_data = leak_model(
            m_ref_html=ref_html,
            m_title=title,
            m_url=href,
            m_base_url=base_url,
            m_weblink=weblink,
            m_websites=m_websites,
            m_content=description,
            m_important_content=description[:500],
            m_content_type=["leaks"],
            m_network=helper_method.get_network_type(self.base_url),
            m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url)
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(description),
            m_team="kraken leaks"
          )

          entity_data = helper_method.extract_entities(description, entity_data)
          self.append_leak_data(card_data, entity_data)
          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break

    except Exception as e:
      print(f"Error in parse_leak_data: {str(e)}")
