from abc import ABC
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.defacement_model import defacement_model
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from urllib.parse import urljoin

from crawler.crawler_services.shared.helper_method import helper_method


class _mirror_h(leak_extractor_interface, ABC):
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
      cls._instance = super(_mirror_h, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "https://mirror-h.org/archive"

  @property
  def base_url(self) -> str:
    return "https://mirror-h.org"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.DEFACEMENT)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "https://mirror-h.org/contact"

  def append_leak_data(self, leak: defacement_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  @staticmethod
  def safe_find(page, selector, attr=None):
    try:
      element = page.query_selector(selector)
      if element:
        return element.get_attribute(attr) if attr else element.inner_text().strip()
    except Exception:
      return None

  def parse_leak_data(self, page: Page):
    try:
      is_crawled = self.invoke_db(REDIS_COMMANDS.S_GET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED, False)
      if is_crawled:
        max_pages = 100
      else:
        max_pages = 1000

      current_page = 1

      while current_page <= max_pages:
        full_url = f"{self.seed_url}/page/{current_page}"
        page.goto(full_url)
        page.wait_for_load_state('load')
        page.wait_for_selector("td[style='word-break: break-word;white-space: normal;min-width: 300px;'] a")

        links = page.query_selector_all("td[style='word-break: break-word;white-space: normal;min-width: 300px;'] a")
        collected_links = []
        for link in links:
          href = link.get_attribute("href")
          if 'zone' in href:
            collected_links.append(urljoin(self.base_url, href))

        for link in collected_links:
          page.goto(link)
          page.wait_for_load_state('load')
          page.wait_for_selector("table[width='100%']")

          web_url = self.safe_find(page, "//td[i[contains(@class, 'mdi-web')]]/following-sibling::td/strong/a", "href")
          location = self.safe_find(page, "//td[i[contains(@class, 'mdi-map-marker')]]/following-sibling::td/strong")
          server_ip = self.safe_find(page, "//td[i[contains(@class, 'mdi-mapbox')]]/following-sibling::td/strong/a")
          web_server = self.safe_find(page, "//td[i[contains(@class, 'mdi-server')]]/following-sibling::td/strong/a")
          attacker = self.safe_find(page, "//td[i[contains(@class, 'mdi-account')]]/following-sibling::td/strong/a")
          total = self.safe_find(page, "//td[i[contains(@class, 'mdi-clipboard-plus')]]/following-sibling::td/strong")
          date = self.safe_find(page, "//td[i[contains(@class, 'mdi-calendar')]]/following-sibling::td/strong")

          iframe = page.query_selector("iframe")
          if iframe:
            iframe_content = iframe.content_frame().content()
            iframe_url = iframe.get_attribute("src")
            soup = BeautifulSoup(iframe_content, 'html.parser')
            content = soup.get_text(strip=True)
          else:
            content = ""
            iframe_url = ""

          card_data = defacement_model(m_date_of_leak=helper_method.extract_and_convert_date(date), m_web_server=[web_server] if web_server else [], m_web_url=[web_url] if web_url else [], m_base_url=self.base_url, m_network=helper_method.get_network_type(self.base_url), m_content=content,
            m_url=link, m_mirror_links=[iframe_url] if iframe_url else [])

          entity_data = entity_model(m_ip=[server_ip] if server_ip else [], m_location=[location] if location else [], m_attacker=[attacker] if attacker else [], )

          self.append_leak_data(card_data, entity_data)

        current_page += 1

    except Exception as ex:
      print(f"An error occurred: {ex}")

    finally:
      self.invoke_db(REDIS_COMMANDS.S_SET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED, True)
