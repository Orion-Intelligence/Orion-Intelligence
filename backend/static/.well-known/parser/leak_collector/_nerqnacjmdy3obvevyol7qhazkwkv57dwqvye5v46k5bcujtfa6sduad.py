import datetime
from abc import ABC
from typing import List

from bs4 import BeautifulSoup
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method


class _nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad(leak_extractor_interface, ABC):
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
      cls._instance = super(_nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad.onion/"

  @property
  def base_url(self) -> str:
    return "http://nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad.onion"

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
    return "kairossup@onionmail.com"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    visited_pages = set()
    visited_cards = set()

    while True:
      current_url = page.url

      if current_url in visited_pages:
        break

      visited_pages.add(current_url)

      card_links = page.locator('.card').all()

      for card in card_links:
        card_text = card.inner_text()

        if card_text in visited_cards:
          continue

        visited_cards.add(card_text)
        card.click()

        page.wait_for_selector('.text-block', timeout=15000)

        detail_html = page.content()
        detail_soup = BeautifulSoup(detail_html, 'html.parser')

        title = detail_soup.select_one('.title').text.strip() if detail_soup.select_one('.title') else "N/A"
        content = detail_soup.select_one('.desc').text.strip() if detail_soup.select_one('.desc') else "N/A"
        website_elem = detail_soup.select_one('.desc a')
        website = website_elem['href'].strip() if website_elem else "N/A"

        phone_number = "N/A"
        for div in detail_soup.select('.desc div'):
          if "Phone Number" in div.text:
            phone_number = div.text.split(":")[-1].strip()
            break

        revenue = "N/A"
        for div in detail_soup.select('.desc div'):
          if "Revenue" in div.text:
            revenue = div.text.split(":")[-1].strip()
            break

        industry = "N/A"
        for div in detail_soup.select('.desc div'):
          if "Industry" in div.text:
            industry = div.text.split(":")[-1].strip()
            break

        address = "N/A"
        for div in detail_soup.select('.desc div'):
          if "Address" in div.text:
            address = div.text.split(":")[-1].strip()
            break

        image_urls = [img['src'] for img in detail_soup.select('.images img')]

        date_time = detail_soup.select_one('.date').text.strip() if detail_soup.select_one('.date') else "N/A"

        dumplinks = [a['href'].strip() for a in detail_soup.find_all('a', href=True) if ".onion" in a['href']]
        title = title.split("\\")[0]
        is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + website, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
        ref_html = None
        if is_crawled!=-1 and is_crawled<5:
          ref_html = helper_method.extract_refhtml(website)
          if ref_html:
            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + website, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
          else:
            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + website, is_crawled+1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

        card_data = leak_model(
          m_ref_html=ref_html,
          m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
          m_title=title,
          m_content=content + " " + self.base_url + " " + page.url,
          m_weblink=[website],
          m_logo_or_images=image_urls,
          m_revenue=revenue,
          m_leak_date=datetime.datetime.strptime(date_time.split()[0], '%m/%d/%Y').date(),
          m_url=page.url,
          m_base_url=self.base_url,
          m_network=helper_method.get_network_type(self.base_url),
          m_important_content=content,
          m_dumplink=dumplinks,
          m_content_type=["leaks"],
        )

        entity_data = entity_model(
          m_location=[address] if address != "N/A" else [],
          m_company_name=title,
          m_email=helper_method.extract_emails(detail_soup.text),
          m_ip=[website],
          m_industry=industry,
          m_team="kairos"
        )

        entity_data = helper_method.extract_entities(content, entity_data)
        self.append_leak_data(card_data, entity_data)

        page.go_back()
        page.wait_for_selector('.card', timeout=5000)

      next_button = page.locator('.pagination .page-link', has_text="Next")

      if next_button.count() > 0:
        next_button.click()
        page.wait_for_selector('.card', timeout=5000)
      else:
        break
