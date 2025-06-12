from abc import ABC
from typing import List
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from urllib.parse import urljoin
from playwright.sync_api import Page
from crawler.crawler_services.shared.helper_method import helper_method


class _darkleakyqmv62eweqwy4dnhaijg4m4dkburo73pzuqfdumcntqdokyd(leak_extractor_interface, ABC):
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

  def __new__(cls):
    if cls._instance is None:
      cls._instance = super(_darkleakyqmv62eweqwy4dnhaijg4m4dkburo73pzuqfdumcntqdokyd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://darkleakyqmv62eweqwy4dnhaijg4m4dkburo73pzuqfdumcntqdokyd.onion"

  @property
  def base_url(self) -> str:
    return "http://darkleakyqmv62eweqwy4dnhaijg4m4dkburo73pzuqfdumcntqdokyd.onion"

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
    return "http://darkleakyqmv62eweqwy4dnhaijg4m4dkburo73pzuqfdumcntqdokyd.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    try:
      page.goto(self.seed_url)
      page.wait_for_load_state('load')

      href_elements = page.query_selector_all("div.table-responsive a")
      if not href_elements:
        return

      hrefs = []
      for href_element in href_elements:
        link = href_element.get_attribute("href")
        if link:
          full_url = urljoin(self.base_url, link)

          if full_url not in hrefs:
            hrefs.append(full_url)
          else:
            continue

      error_count = 0

      for url in hrefs:
        try:
          page.goto(url)
          page.wait_for_load_state('load')

          title_element = page.query_selector("div.bg-dark h4.card-top")
          title = title_element.inner_text().strip() if title_element else "No title found"

          content_element = page.query_selector("div.card-body p.card-text")
          content = content_element.inner_text().strip() if content_element else "No content found"

          if content:
            words = content.split()
            imp_content = " ".join(words[:500]) if len(words) > 500 else content
          else:
            imp_content = ""

          card_data = leak_model(
            m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
            m_title=title,
            m_url=url,
            m_weblink=[url],
            m_network=helper_method.get_network_type(url),
            m_base_url=self.base_url,
            m_content=content + " " + self.base_url + " " + url,
            m_important_content=imp_content,
            m_content_type=["leaks"],
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(content),
            m_company_name=title,
            m_team="dark leak"
          )
          entity_data = helper_method.extract_entities(content, entity_data)

          self.append_leak_data(card_data, entity_data)
          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break


    except Exception as ex:
      print(f"An error occurred in: {ex}")
