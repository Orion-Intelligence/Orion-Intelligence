from abc import ABC
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _monitor_mozilla(leak_extractor_interface, ABC):
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
      cls._instance = super(_monitor_mozilla, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "https://monitor.mozilla.org/breaches"

  @property
  def base_url(self) -> str:
    return "https://monitor.mozilla.org/breaches"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.SELENIUM)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value):
    return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

  def contact_page(self) -> str:
    return "https://support.mozilla.org"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      self.callback()

  def parse_leak_data(self, page: Page):
    page.wait_for_load_state("domcontentloaded")
    breach_cards = page.locator('a[class^="BreachIndexView_breachCard"]')
    breach_cards.first.wait_for(state="visible")
    card_count = breach_cards.count()

    self._card_data = []
    error_count = 0
    max_errors = 20

    card_urls = []
    for i in range(card_count):
      try:
        card = breach_cards.nth(i)
        card_href = card.get_attribute('href')
        dumplink = "https://monitor.mozilla.org/" + card_href
        card_urls.append(dumplink)
      except Exception as ex:
        error_count += 1
        print(f"Error collecting URL for card {i}: {ex}")
        if error_count >= max_errors:
          break
        continue

    for dumplink in card_urls:
      if error_count >= max_errors:
        break

      try:
        page.goto(dumplink, wait_until="domcontentloaded")
        soup = BeautifulSoup(page.content(), "html.parser")
        card_content = helper_method.clean_text(soup.get_text(separator=" ", strip=True))
        card_title = helper_method.clean_text(page.locator('h1').nth(1).inner_text()[1:])
        extracted_text = card_content  # Reuse cleaned text to avoid redundant parsing
        current_url = page.url

        card_data = leak_model(
          m_screenshot=helper_method.get_screenshot_base64(page, card_title),
          m_title=card_title,
          m_url=current_url,
          m_base_url=self.base_url,
          m_content=extracted_text,
          m_network=helper_method.get_network_type(self.base_url),
          m_important_content=card_content,
          m_weblink=[current_url],
          m_dumplink=[dumplink],
          m_content_type=["leaks"],
        )

        entity_data = entity_model(
          m_email_addresses=helper_method.extract_emails(extracted_text),
          m_phone_numbers=helper_method.extract_phone_numbers(extracted_text),
        )

        self.append_leak_data(card_data, entity_data)

        error_count = 0

      except Exception as ex:
        error_count += 1
        print(f"Error processing URL {dumplink}: {ex}")
        continue

    return self._card_data