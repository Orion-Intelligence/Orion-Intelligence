import re
from abc import ABC
from datetime import timedelta, datetime, timezone
from typing import List
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _5butbkrljkaorg5maepuca25oma7eiwo6a2rlhvkblb4v6mf3ki2ovid(leak_extractor_interface, ABC):
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
      cls._instance = super(_5butbkrljkaorg5maepuca25oma7eiwo6a2rlhvkblb4v6mf3ki2ovid, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://5butbkrljkaorg5maepuca25oma7eiwo6a2rlhvkblb4v6mf3ki2ovid.onion"

  @property
  def base_url(self) -> str:
    return "http://5butbkrljkaorg5maepuca25oma7eiwo6a2rlhvkblb4v6mf3ki2ovid.onion"

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
    return "http://5butbkrljkaorg5maepuca25oma7eiwo6a2rlhvkblb4v6mf3ki2ovid.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    try:
      cards = page.query_selector_all('.companies-list__item')
      page.wait_for_load_state("networkidle")

      error_count = 0

      for card in cards:
        try:
          title_el = card.query_selector('.name a')
          description_el = card.query_selector('.text')
          weblink_el = description_el.query_selector('a[href^="http"]') if description_el else None
          dumplink_el = card.query_selector('a.btn.btn-primary:not([disabled])')
          published_el = card.query_selector('.image-block .img + p')

          title = title_el.text_content().strip() if title_el else "No Title"
          description = description_el.text_content().strip() if description_el else "No Description"
          weblink = weblink_el.get_attribute("href") if weblink_el else ""
          dumplink = dumplink_el.get_attribute("href") if dumplink_el else ""

          leak_date = None
          if published_el:
            match = re.search(r'Published\s+(\d+)\s+(day|week|month|year)s?\s+ago',
                              published_el.text_content(), re.IGNORECASE)
            if match:
              value, unit = int(match.group(1)), match.group(2).lower()
              delta_map = {
                'day': timedelta(days=value),
                'week': timedelta(weeks=value),
                'month': timedelta(days=30 * value),
                'year': timedelta(days=365 * value)
              }
              dt = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
              leak_date = (dt - delta_map[unit]).date()

          is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
          ref_html = None
          if is_crawled != -1 and is_crawled < 5:
            ref_html = helper_method.extract_refhtml(weblink)
            if ref_html:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
            else:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

          card_data = leak_model(
            m_ref_html=ref_html,
            m_title=title,
            m_url=page.url,
            m_base_url=self.base_url,
            m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
            m_content=description,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=description,
            m_content_type=["leaks"],
            m_weblink=[weblink],
            m_dumplink=[dumplink],
            m_leak_date=leak_date
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(description),
            m_ip=[weblink],
            m_company_name=title,
            m_team="space bears"
          )

          entity_data = helper_method.extract_entities(description, entity_data)
          self.append_leak_data(card_data, entity_data)
          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break

    except Exception as e:
      print(f"An error occurred while parsing leak data: {e}")
