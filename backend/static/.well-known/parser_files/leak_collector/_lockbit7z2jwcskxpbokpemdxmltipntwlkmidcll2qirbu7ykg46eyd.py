from abc import ABC
from datetime import datetime
from typing import List
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method


class _lockbit7z2jwcskxpbokpemdxmltipntwlkmidcll2qirbu7ykg46eyd(leak_extractor_interface, ABC):
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
      cls._instance = super(_lockbit7z2jwcskxpbokpemdxmltipntwlkmidcll2qirbu7ykg46eyd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://lockbit7z2jwcskxpbokpemdxmltipntwlkmidcll2qirbu7ykg46eyd.onion"

  @property
  def base_url(self) -> str:
    return "http://lockbit7z2jwcskxpbokpemdxmltipntwlkmidcll2qirbu7ykg46eyd.onion"

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
    return "http://lockbit3753ekiocyo5epmpy6klmejchjtzddoekjlnt6mu3qh4de2id.onion/conditions"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    try:
      cards = page.query_selector_all('table#list tbody tr')
      error_count = 0
      for card in cards:
        try:
          title_element = card.query_selector('td.link a')
          title = title_element.get_attribute('title').strip() if title_element else "No Title"

          relative_url = title_element.get_attribute('href') if title_element else None
          full_url = f"{self.base_url}{relative_url}" if relative_url else None

          date_element = card.query_selector('td.date')
          date_text = date_element.inner_text().strip() if date_element else None
          date = None
          if date_text:
            try:
              date = datetime.strptime(date_text, "%b %d, %Y").date()
            except ValueError:
              try:
                date = datetime.strptime(date_text, "%B %d, %Y").date()
              except ValueError:
                error_count += 1
                if error_count >= 3:
                  break
                continue

          description = f"Title: {title} \nDate: {date}"

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
            m_url=page.url,
            m_base_url=self.base_url,
            m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
            m_content=description,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=description,
            m_content_type=["leaks"],
            m_leak_date=date,
            m_weblink=[full_url],
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(description),
            m_ip=[title],
            m_team="lockbit"
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
