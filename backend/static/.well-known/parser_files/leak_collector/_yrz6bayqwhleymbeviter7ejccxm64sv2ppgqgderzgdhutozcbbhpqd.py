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
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from bs4 import BeautifulSoup


class _yrz6bayqwhleymbeviter7ejccxm64sv2ppgqgderzgdhutozcbbhpqd(leak_extractor_interface, ABC):
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
      cls._instance = super(_yrz6bayqwhleymbeviter7ejccxm64sv2ppgqgderzgdhutozcbbhpqd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://yrz6bayqwhleymbeviter7ejccxm64sv2ppgqgderzgdhutozcbbhpqd.onion/"

  @property
  def base_url(self) -> str:
    return "http://yrz6bayqwhleymbeviter7ejccxm64sv2ppgqgderzgdhutozcbbhpqd.onion/"

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
    return "http://yrz6bayqwhleymbeviter7ejccxm64sv2ppgqgderzgdhutozcbbhpqd.onion/contacts"

  def append_leak_data(self, leak: leak_model, entity: entity_model):

    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    page_content = page.content()
    self.soup = BeautifulSoup(page_content, "html.parser")

    cards = self.soup.select("div.flex.flex-col.mt-3.mb-3.bg-stone-100")
    card_links = []
    for card in cards:
      link_tag = card.select_one("a.underline.text-blue-500.font-semibold")
      if not link_tag or not link_tag.has_attr("href"):
        continue
      full_url = self.base_url + link_tag['href']

      leak_date = None
      date_span = card.find("span", string=lambda s: s and s.strip().lower().startswith("updated"))
      if date_span:
        try:
          date_str = date_span.text.replace("Updated", "").strip()
          leak_date = datetime.strptime(date_str, "%d-%b-%Y").date()
        except:
          pass

      card_links.append((full_url, leak_date))

    error_count = 0
    max_errors = 3

    for card_url, leak_date in card_links:
      try:
        page.goto(card_url)
        detail_content = page.content()
        detail_soup = BeautifulSoup(detail_content, "html.parser")

        try:
          weblink = detail_soup.find("div", class_="flex flex-row").find_next("span").text.strip()

          revenue_tag = detail_soup.find_all("div", class_="flex flex-row")[1]
          revenue = revenue_tag.find("span").text.strip()

          country_tag = detail_soup.find_all("div", class_="flex flex-row")[2]
          country = country_tag.find("span").text.strip()

          description_tag = detail_soup.find("div", class_="text-gray-900 whitespace-pre-line")
          description = description_tag.text.strip() if description_tag else ""

          explore_data_link_tag = detail_soup.find("a", string=lambda s: s and "Explore data" in s)
          explore_data_link = (
            self.base_url + explore_data_link_tag["href"]
            if explore_data_link_tag and explore_data_link_tag.has_attr("href")
            else ""
          )

          if not description:
            continue

          m_content = description
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
            m_title=page.title(),
            m_url=page.url,
            m_base_url=self.base_url,
            m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
            m_content=m_content,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=m_content[:500],
            m_weblink=[weblink],
            m_dumplink=[explore_data_link],
            m_content_type=["leaks"],
            m_revenue=revenue,
            m_leak_date=leak_date
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(m_content),
            m_country_name=country,
            m_ip=[weblink],
            m_company_name=page.title(),
            m_team="apos blog"
          )

          entity_data = helper_method.extract_entities(m_content, entity_data)
          self.append_leak_data(card_data, entity_data)
          error_count = 0

        except Exception as e:
          error_count += 1
          print(f"Failed to extract from {card_url}: {e}")
          if error_count >= max_errors:
            print("Too many consecutive failures. Stopping loop.")
            break

      except Exception as page_error:
        error_count += 1
        print(f"Error loading page {card_url}: {page_error}")
        if error_count >= max_errors:
          print("Too many consecutive page load errors. Aborting loop.")
          break
