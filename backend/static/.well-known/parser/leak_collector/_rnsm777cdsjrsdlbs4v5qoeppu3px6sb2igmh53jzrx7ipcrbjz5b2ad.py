import datetime
from abc import ABC
import re

from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from urllib.parse import urljoin

from crawler.crawler_services.shared.helper_method import helper_method


class _rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad(leak_extractor_interface, ABC):
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
      cls._instance = super(_rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad.onion/index.html"

  @property
  def base_url(self) -> str:
    return "http://rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad.onion"

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
    return "http://rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad.onion"

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
      element = page.query_selector(selector)
      if element:
        return element.get_attribute(attr) if attr else element.inner_text().strip()
    except Exception:
      return None

  def parse_leak_data(self, page: Page):
    try:
      all_leak_urls = []
      base_domain = "http://rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad.onion"

      for page_num in range(1, 8):

        if page_num == 1:
          current_url = f"{base_domain}/index.html"
        else:
          current_url = f"{base_domain}/index{page_num}.html"

        page.goto(current_url)
        page.wait_for_load_state('load')

        page_html = page.content()
        self.soup = BeautifulSoup(page_html, 'html.parser')

        list_items = self.soup.select("ol li")
        if not list_items:
          continue

        error_count = 0

        for item in list_items:
          try:
            link_element = item.select_one("h4 b a")

            if link_element and link_element.get('href'):
              item_url = link_element.get('href')
              if not item_url.startswith(('http://', 'https://')):
                item_url = urljoin(base_domain, item_url)
              all_leak_urls.append(item_url)

              title = link_element.get_text(strip=True)

              desc_element = item.select_one("i p")
              description = desc_element.get_text(strip=True) if desc_element else None

              date_text = None
              date_label = item.find("b", text="Date: ")
              if date_label:
                date_text = date_label.next_sibling.strip() if date_label.next_sibling else None

              leak_size = None
              if description:
                size_match = re.search(r'Leak size: ([\d.]+\s*[KMGT]B)', description)
                if size_match:
                  leak_size = size_match.group(1)

              tags = []
              tag_elements = item.select("em b span a")
              for tag in tag_elements:
                tag_text = tag.get_text(strip=True)
                if tag_text.startswith('#'):
                  tags.append(tag_text[1:])

              card_data = leak_model(
                m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                m_title=title,
                m_url=item_url,
                m_weblink=[],
                m_network=helper_method.get_network_type(self.base_url),
                m_base_url=self.base_url,
                m_content=description + " " + self.base_url + " " + item_url,
                m_important_content=description,
                m_logo_or_images=[],
                m_content_type=["leaks"],
                m_data_size=leak_size,
                m_leak_date=datetime.datetime.strptime(' '.join(date_text.split()[1:]),'%d %B %Y').date() if date_text else None,
              )

              entity_data = entity_model(
                m_email=helper_method.extract_emails(description),
                m_company_name=title,
                m_team="ransomexx"
              )

              entity_data = helper_method.extract_entities(description, entity_data)
              self.append_leak_data(card_data, entity_data)
              error_count = 0

          except Exception:
            error_count += 1
            if error_count >= 3:
              break

    except Exception as ex:
      print(f"An error occurred: {ex}")
      return []
