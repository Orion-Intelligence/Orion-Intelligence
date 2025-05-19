import traceback
from abc import ABC
from typing import List
from urllib.parse import urljoin
from dateutil import parser
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _csidb(leak_extractor_interface, ABC):
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
      cls._instance = super(_csidb, cls).__new__(cls)
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "https://www.csidb.net"

  @property
  def base_url(self) -> str:
    return "https://www.csidb.net"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return self.base_url

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  @staticmethod
  def safe_find(page, selector, attr=None):

    try:
      element = page.locator(selector).first
      if element.count() > 0:
        return element.get_attribute(attr) if attr else element.inner_text().strip()
    except Exception:
      return None

  def parse_leak_data(self, page: Page):
    try:
      page.goto(self.seed_url)
      page.wait_for_load_state('load')

      def collect_links(section_name, match_path):
        links, current_page = [], 1
        if section_name not in main_nav_links:
          return links

        section_url = urljoin(self.base_url, main_nav_links[section_name])
        page.goto(section_url)
        page.wait_for_load_state('load')

        while len(links) < testing_limit:
          page.wait_for_selector('tbody tr')
          new_links = [
            urljoin(self.base_url, a.get_attribute("href"))
            for a in page.query_selector_all("tbody tr td a")
            if a.get_attribute("href") and match_path in a.get_attribute("href")
          ]
          links.extend([l for l in new_links if l not in links])
          if len(links) >= testing_limit:
            break

          next_button = page.query_selector(f"button.btn.btn-secondary[onclick*='page={current_page + 1}']")
          if next_button:
            next_button.click()
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            current_page += 1
          else:
            break

        return links[:testing_limit]

      def build_card(title, url, content, description, weblinks, leak_date, content_type, country=None):
        important_content = " ".join(description.split()[:500]) if description else ""
        card = leak_model(
          m_title=title,
          m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
          m_url=url,
          m_base_url=self.base_url,
          m_network=helper_method.get_network_type(self.base_url),
          m_content=f"{description} {self.base_url} {url}" if description else f"{self.base_url} {url}",
          m_important_content=important_content,
          m_content_type=[content_type],
          m_leak_date=leak_date,
          m_weblink=weblinks
        )

        entity = entity_model(
          m_company_name=title,
          m_email=helper_method.extract_emails(description) if description else [],
          m_phone_numbers=helper_method.extract_phone_numbers(description) if description else [],
          m_country_name=country,
          m_location=[country],
          m_team="csidb"
        )
        entity = helper_method.extract_entities(description, entity)

        self.append_leak_data(card, entity)

      main_nav_links = {
        nav.inner_text().strip(): nav.get_attribute("href")
        for nav in page.query_selector_all("a.nav-link.link-light.btn.btn-secondary")
      }

      testing_limit = 10

      incident_links = collect_links("INCIDENTS", "/csidb/incidents/")

      for incident_url in incident_links:
        try:
          page.goto(incident_url)
          page.wait_for_load_state('load')

          date = page.query_selector("p.col-8.d-inline.text-start.bg-white.text-nowrap.m-0.border.ps-2")
          title = page.query_selector("h1.col.h-100.text-center.text-white.text-wrap a.link-info")
          desc_el = page.query_selector("div.container div.row div.col") or page.query_selector("div.p-2, p.p-2")

          websites = [a.get_attribute("href") for a in page.query_selector_all("td.align-middle a") if a.get_attribute("href").startswith("http")]
          date_val = parser.parse(date.inner_text().strip()).date() if date else None
          desc_text = desc_el.inner_text().strip() if desc_el else ""

          location_label = page.query_selector("h5:has-text('Location:')")
          country = location_label.evaluate("el => el.nextElementSibling.textContent.trim()") if location_label else None

          build_card(title.inner_text().strip() if title else None, incident_url, desc_text, desc_text, websites, date_val, "leaks", country)

        except Exception:
          traceback.print_exc()

      return True

    except Exception as ex:
      traceback.print_exc()
      return False
