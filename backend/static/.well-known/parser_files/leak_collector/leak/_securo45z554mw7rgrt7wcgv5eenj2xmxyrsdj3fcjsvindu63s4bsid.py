from abc import ABC
from typing import List

from playwright.sync_api import Page
from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _securo45z554mw7rgrt7wcgv5eenj2xmxyrsdj3fcjsvindu63s4bsid(leak_extractor_interface, ABC):
  _instance = None

  def __init__(self, callback=None):

    self.callback = callback
    self._card_data = []
    self._entity_data = []
    self.soup = None
    self._initialized = None
    self._redis_instance = redis_controller()
    self._is_crawled = False

  def init_callback(self, callback=None):

    self.callback = callback

  def __new__(cls, callback=None):

    if cls._instance is None:
      cls._instance = super(_securo45z554mw7rgrt7wcgv5eenj2xmxyrsdj3fcjsvindu63s4bsid, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def is_crawled(self) -> bool:
    return self._is_crawled

  @property
  def seed_url(self) -> str:
    return "http://securo45z554mw7rgrt7wcgv5eenj2xmxyrsdj3fcjsvindu63s4bsid.onion/"

  @property
  def developer_signature(self) -> str:

    return "name:signature"

  @property
  def base_url(self) -> str:
    return "http://securo45z554mw7rgrt7wcgv5eenj2xmxyrsdj3fcjsvindu63s4bsid.onion/"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(
      m_fetch_proxy=FetchProxy.TOR,
      m_fetch_config=FetchConfig.PLAYRIGHT,
      m_threat_type=ThreatType.LEAK,
      m_resoource_block=False,
      m_block_default_javascript=False)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "https://www.iana.org/help/example-domains"

  def append_leak_data(self, leak: leak_model, entity: entity_model):

    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):

    page.wait_for_selector('li', timeout=30000)
    cards = page.query_selector_all("ul.custom-scrollbar.flex.h-full.flex-col.gap-4.overflow-auto.pr-2 > li")

    for card in cards:
      try:
        h3 = card.query_selector("h3")
        title = h3.inner_text().strip() if h3 else ""

        el = card.query_selector("div.relative.cursor-pointer")
        if not el:
          continue
        el.scroll_into_view_if_needed()
        box = el.bounding_box()
        if not box:
          continue
        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)

        page.wait_for_selector("#section-company-info", timeout=5000)

        revenue = page.locator("#section-company-info span:text('Revenue') + span").inner_text()
        website = page.locator("#section-company-info a").get_attribute("href")
        description = page.locator("#section-company-info p").inner_text()

        page.locator("#section-company-info button:text('Storage')").click()

        storage_locator = page.locator("div.mb-1\\.5.pl-4.text-\\[14px\\].text-white")

        if storage_locator.count() > 0:
          page.locator("button:text('Overview')").click()
        else:
          page.locator("button:text('Overview')").click()

        ref_html = helper_method.extract_refhtml(
          website,
          self.invoke_db,
          REDIS_COMMANDS,
          CUSTOM_SCRIPT_REDIS_KEYS,
          RAW_PATH_CONSTANTS,
          page)

        card_data = leak_model(
          m_ref_html=ref_html,
          m_title=title,
          m_url=page.url,
          m_base_url=self.base_url,
          m_content=description,
          m_network=helper_method.get_network_type(self.base_url),
          m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
          m_important_content=description[:500],
          m_content_type=["leaks"],
          m_revenue=revenue, )

        entity_data = entity_model(
          m_team="securo", m_scrap_file=self.__class__.__name__, )

        self.append_leak_data(card_data, entity_data)

      except Exception as ex:
        log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
        continue
