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


class _leaksndi6i6m2ji6ozulqe4imlrqn6wrgjlhxe25vremvr3aymm4aaid(leak_extractor_interface, ABC):
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
      cls._instance = super(_leaksndi6i6m2ji6ozulqe4imlrqn6wrgjlhxe25vremvr3aymm4aaid, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://leaksndi6i6m2ji6ozulqe4imlrqn6wrgjlhxe25vremvr3aymm4aaid.onion/"

  @property
  def base_url(self) -> str:
    return "http://leaksndi6i6m2ji6ozulqe4imlrqn6wrgjlhxe25vremvr3aymm4aaid.onion/"

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
    return "hackteam@dnmx.su"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    self._card_data = []

    error_count = 0

    while True:
      try:
        page.wait_for_selector(".list tbody tr", timeout=400)
        rows = page.query_selector_all(".list tbody tr")

        for row in rows:
          try:
            year = row.query_selector("td:nth-child(1)").inner_text().strip()
            database = row.query_selector("td:nth-child(2)").inner_text().strip()
            site = row.query_selector("td:nth-child(3)").inner_text().strip()
            records = row.query_selector("td:nth-child(4)").inner_text().strip()
            price = row.query_selector("td:nth-child(5)").inner_text().strip()

            buy_button = row.query_selector("td:nth-child(6) button")
            if not buy_button:
              continue

            with page.expect_popup() as new_page_info:
              buy_button.click()

            buy_page = new_page_info.value
            buy_page.wait_for_load_state("domcontentloaded")

            description_element = buy_page.query_selector(".order-details tr:nth-child(4) td")
            description = description_element.inner_text().strip() if description_element else "No description"

            btc_address = ""
            address_element = buy_page.query_selector(".paycontainer pre")
            if address_element:
              btc_address = address_element.inner_text().strip()

            is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + site, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
            ref_html = None
            if is_crawled != -1 and is_crawled < 5:
              ref_html = helper_method.extract_refhtml(site)
              if ref_html:
                self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + site, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
              else:
                self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + site, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

            content = (
              description + btc_address
              if description
              else f"{year} | {database} | {site} | {records} | {price} {self.base_url} {page.url} - {btc_address}"
            )

            card_data = leak_model(
              m_ref_html=ref_html,
              m_screenshot=helper_method.get_screenshot_base64(page, database, self.base_url),
              m_title=database,
              m_url=page.url,
              m_base_url=self.base_url,
              m_content=content,
              m_network=helper_method.get_network_type(self.base_url),
              m_important_content=description[:500],
              m_weblink=[site],
              m_content_type=["leaks"],
              m_data_size=records,
              m_leak_date=datetime.strptime(year, '%Y').date(),
            )

            entity_data = entity_model(
              m_email=helper_method.extract_emails(description),
              m_company_name=database,
              m_ip=[site],
              m_team="Hacked databases store"
            )

            entity_data = helper_method.extract_entities(content, entity_data)
            self.append_leak_data(card_data, entity_data)

            buy_page.close()
            page.bring_to_front()

          except Exception:
            pass

        error_count = 0
        break

      except Exception:
        error_count += 1
        if error_count >= 3:
          break
