import re
from abc import ABC
from typing import List
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _ddosecrets(leak_extractor_interface, ABC):
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
      cls._instance = super(_ddosecrets, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "https://ddosecrets.com/all_articles/a-z"

  @property
  def base_url(self) -> str:
    return "https://ddosecrets.com"

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
    return "https://ddosecrets.com/about"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    page.goto(self.seed_url, wait_until="networkidle")
    self.soup = BeautifulSoup(page.content(), 'html.parser')

    article_divs = self.soup.find_all("div", class_="article")
    article_links = [
      urljoin(self.base_url, div.find("h4").find("a")["href"])
      for div in article_divs
      if div.find("h4") and div.find("h4").find("a")
    ]

    error_count = 0

    for article_url in article_links:
      try:
        page.goto(article_url, wait_until="networkidle")
        self.soup = BeautifulSoup(page.content(), 'html.parser')

        content_div = self.soup.find(
          "div",
          class_=lambda c: c == "content",
          attrs={"id": lambda i: i is None or i != "promo"}
        )
        if not content_div:
          continue

        title_element = content_div.find("h1")
        title = title_element.get_text(strip=True) if title_element else ""

        meta_element = content_div.find("p", class_="meta")
        published_date = meta_element.get_text(strip=True) if meta_element else ""
        published_date = helper_method.extract_and_convert_date(published_date)

        metadata_div = content_div.find("div", class_="metadata")
        countries = []
        download_size = ""
        dumplinks = []
        sources = re.findall(r'href=["\']/source/([^"\']+)', page.content())[0]

        if metadata_div:
          country_elements = metadata_div.find_all("a", href=lambda h: h and "/country/" in h)
          countries = [country.get_text(strip=True) for country in country_elements]

          size_element = metadata_div.find("p", string=lambda t: t and "Download Size:" in t)
          if size_element:
            download_size = size_element.get_text(strip=True).replace("Download Size:", "").strip()

          dumplinks.extend(
            urljoin(self.base_url, a["href"]) for a in metadata_div.find_all("a", href=True)
          )

        article_content = content_div.find("div", class_="article-content")
        content_text = ""
        weblinks = []
        if article_content:
          content_text = " ".join(
            p.get_text(strip=True) for p in article_content.find_all("p")
          )
          weblinks.extend(
            urljoin(self.base_url, a["href"]) for a in article_content.find_all("a", href=True)
          )

        card_data = leak_model(
          m_screenshot=helper_method.get_screenshot_base64(page, None, title),
          m_title=title,
          m_url=article_url,
          m_base_url=self.base_url,
          m_content=content_text + " " + self.base_url + " " + article_url + " " + sources,
          m_content_type=["leaks"],
          m_important_content=content_text,
          m_weblink=weblinks,
          m_network=helper_method.get_network_type(self.base_url),
          m_dumplink=dumplinks,
          m_leak_date=published_date,
          m_data_size=download_size,
        )

        country = " - ".join(countries) if countries else None
        entity_data = entity_model(
          m_email=helper_method.extract_emails(content_text),
          m_attacker=[sources],
          m_location=countries,
          m_country_name=country,
          m_team="ddosecret"
        )
        entity_data = helper_method.extract_entities(content_text, entity_data)

        self.append_leak_data(card_data, entity_data)
        error_count = 0

      except Exception:
        error_count += 1
        if error_count >= 3:
          break
