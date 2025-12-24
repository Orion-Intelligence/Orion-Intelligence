from abc import ABC
from typing import List
from urllib.parse import urljoin
from datetime import datetime

from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _cybernewsksa(leak_extractor_interface, ABC):
  _instance = None

  def __new__(cls, *args, **kwargs):
    if cls._instance is None:
      cls._instance = super(_cybernewsksa, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  def __init__(self, callback=None):
    if self._initialized:
      return
    self.callback = callback
    self._card_data: List[leak_model] = []
    self._entity_data: List[entity_model] = []
    self._redis_instance = redis_controller()
    self._is_crawled = False
    self._initialized = True

  def init_callback(self, callback=None):
    self.callback = callback

  @property
  def seed_url(self) -> str:
    return "https://nca.gov.sa/ar/news/"

  @property
  def base_url(self) -> str:
    return "https://nca.gov.sa"

  @property
  def developer_signature(self) -> str:
    return "Muhammad Abdullah:owGbwMvMwMEYdOzLoajv79gZTxskMWRU6bi8370 / LLUoMy0zNUUhJbUsNSe / ILXISsG3NCMxNzcxRcExKaU0Jycxg5erYzMLAyMHg6yYIkuQ4M9 / l7siYpT2b / oFM5GVCWQcAxenAEykRYSFYcHRJWUetXMKmo78Ec5ueHZq52rX / vuHpJTf / G31ULsywdC23 + fM4tmaUbP2cXYm7y9kPHnAdbXgspWerkeXW8ZYmm2xrpdTF / Yyvi0aGdn5iMne8PQGgSgWxeOMKUo8IQvL3W1PN4gtYYkxfr6kMZ3t0tmSRR2qnu / fZ2yfqfdm9szOQpt2AA ===weDX"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(
      m_fetch_proxy=FetchProxy.NONE,
      m_fetch_config=FetchConfig.PLAYRIGHT,
      m_resoource_block=False,
      m_threat_type=ThreatType.TRACKING)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def is_crawled(self) -> bool:
    return self._is_crawled

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(
      command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return self.base_url

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback and self.callback():
      self._card_data.clear()
      self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    try:
      page.goto(self.seed_url, wait_until="domcontentloaded", timeout=30000)
      page.click('[data-testid="language-switcher"]')
      page.wait_for_load_state("networkidle")

      all_links = set()

      for i in range(5):
        page.wait_for_selector("a[href*='/ar/news/']", timeout=10000)
        links = [urljoin(page.url, a.get_attribute('href')) for a in
          page.query_selector_all('a[data-testid^="cart-button-"]')]
        all_links.update(links)

        if i < 4:
          try:
            page.click('ul.flex > li:last-child a:has(svg)')
            page.wait_for_load_state("networkidle")
          except Exception:
            break

      all_links = list(all_links)[:25]

      for idx, url in enumerate(all_links, 1):
        try:
          page.goto(url, wait_until="domcontentloaded", timeout=30000)
          page.wait_for_load_state("networkidle")

          title_el = page.query_selector("h1, .news-title, .article-title")
          title = title_el.inner_text().strip() if title_el else "No Title"

          paragraphs = page.query_selector_all("article p, main p, .content p")
          content_lines = []
          for p in paragraphs:
            try:
              text = p.inner_text().strip()
              if text:
                content_lines.append(text)
            except Exception:
              continue
          content = "\n".join(content_lines)
          date_obj = datetime.strptime("28/08/2024", "%d/%m/%Y").date()

          leak_obj = leak_model(
            m_title=title,
            m_weblink=[url],
            m_dumplink=[url],
            m_url=url,
            m_base_url=self.base_url,
            m_content=content,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=content[0:200],
            m_content_type=["news", "tracking"],
            m_leak_date=date_obj, )

          entity_data = entity_model(
            m_scrap_file=self.__class__.__name__,
            m_company_name="National Cybersecurity Authority",
            m_country=["Saudi Arabia"],
            m_team="NCA KSA Cyber")

          self.append_leak_data(leak_obj, entity_data)
        except Exception as e:
          log.g().e(f"Failed parsing article {url} - {e}")

    except Exception as ex:
      log.g().e(f"SCRIPT ERROR {ex} [{self.__class__.__name__}]")
