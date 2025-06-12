from abc import ABC
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


class _hptqq2o2qjva7lcaaq67w36jihzivkaitkexorauw7b2yul2z6zozpqd(leak_extractor_interface, ABC):
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
      cls._instance = super(_hptqq2o2qjva7lcaaq67w36jihzivkaitkexorauw7b2yul2z6zozpqd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://hptqq2o2qjva7lcaaq67w36jihzivkaitkexorauw7b2yul2z6zozpqd.onion/list"

  @property
  def base_url(self) -> str:
    return "http://hptqq2o2qjva7lcaaq67w36jihzivkaitkexorauw7b2yul2z6zozpqd.onion"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "http://hptqq2o2qjva7lcaaq67w36jihzivkaitkexorauw7b2yul2z6zozpqd.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):

    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    page.wait_for_selector("a.break-words")
    card_links = [
      self.base_url + anchor.get_attribute("href")
      for anchor in page.query_selector_all("a.break-words")
      if anchor and anchor.get_attribute("href")
    ]
    error_count = 0

    for card_link in card_links:
      try:
        page.goto(card_link)
        page.wait_for_selector("div.text-lg.font-bold.break-words")

        company_name = page.query_selector(
          "div.text-lg.font-bold.break-words").inner_text() if page.query_selector(
          "div.text-lg.font-bold.break-words") else ""
        weblink = page.query_selector("div.truncate a").get_attribute("href") if page.query_selector(
          "div.truncate a") else ""
        description = page.query_selector(
          "div.whitespace-pre-line.break-words").inner_text() if page.query_selector(
          "div.whitespace-pre-line.break-words") else ""
        download_link = page.query_selector("div.flex a.truncate").get_attribute("href") if page.query_selector(
          "div.flex a.truncate") else ""
        leak_size = page.query_selector(
          "div:has-text('Leaked size') span.font-bold.whitespace-pre-line").inner_text() if page.query_selector(
          "div:has-text('Leaked size') span.font-bold.whitespace-pre-line") else ""

        m_content = page.inner_text("html")

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
          m_title=company_name,
          m_url=page.url,
          m_base_url=self.base_url,
          m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
          m_content=m_content,
          m_network=helper_method.get_network_type(self.base_url),
          m_important_content=description,
          m_weblink=[weblink],
          m_dumplink=[download_link],
          m_content_type=["leaks"],
          m_data_size=leak_size
        )

        entity_data = entity_model(
          m_email=helper_method.extract_emails(description),
          m_company_name=company_name,
          m_ip=[weblink],
          m_team="chaos"
        )

        entity_data = helper_method.extract_entities(description, entity_data)
        self.append_leak_data(card_data, entity_data)
        error_count = 0

      except Exception:
        error_count += 1
        if error_count >= 3:
          break
