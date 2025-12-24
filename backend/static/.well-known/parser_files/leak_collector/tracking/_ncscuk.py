from abc import ABC
from typing import List
from urllib.parse import urljoin
from datetime import datetime
import re

from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _ncscuk(leak_extractor_interface, ABC):
  _instance = None

  def __new__(cls, *args, **kwargs):
    if cls._instance is None:
      cls._instance = super(_ncscuk, cls).__new__(cls)
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
    return "https://www.ncsc.gov.uk/news"

  @property
  def base_url(self) -> str:
    return "https://www.ncsc.gov.uk"

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
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  @property
  def is_crawled(self) -> bool:
    return self._is_crawled

  @property
  def developer_signature(self) -> str:
    return "Muhammad Abdullah:owGbwMvMwMEYdOzLoajv79gZTxskMWRU6bi8370 / LLUoMy0zNUUhJbUsNSe / ILXISsG3NCMxNzcxRcExKaU0Jycxg5erYzMLAyMHg6yYIkuQ4M9 / l7siYpT2b / oFM5GVCWQcAxenAEykRYSFYcHRJWUetXMKmo78Ec5ueHZq52rX / vuHpJTf / G31ULsywdC23 + fM4tmaUbP2cXYm7y9kPHnAdbXgspWerkeXW8ZYmm2xrpdTF / Yyvi0aGdn5iMne8PQGgSgWxeOMKUo8IQvL3W1PN4gtYYkxfr6kMZ3t0tmSRR2qnu / fZ2yfqfdm9szOQpt2AA ===weDX"

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "https://www.ncsc.gov.uk/contact"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback and self.callback():
      self._card_data.clear()
      self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    try:
      page.goto(self.seed_url, wait_until="domcontentloaded", timeout=30000)
      page.wait_for_load_state("networkidle")

      for _ in range(10):
        try:
          load_more = page.wait_for_selector("button[data-testid='load-more-button']", timeout=5000)
          if load_more and load_more.is_enabled():
            load_more.click()
            page.wait_for_timeout(2000)
          else:
            break
        except Exception:
          break

      article_links = page.query_selector_all("a[href*='/news/']")
      urls = []
      for elem in article_links:
        href = elem.get_attribute("href")
        if href and '/news/' in href:
          full_url = href if href.startswith("http") else urljoin(self.base_url, href)
          urls.append(full_url)

      for url in urls[:30]:
        try:
          page.goto(url, wait_until="domcontentloaded", timeout=30000)
          page.wait_for_load_state("networkidle")

          title_elem = page.query_selector("h1") or page.query_selector("h2") or page.query_selector("title")
          title = title_elem.inner_text().strip() if title_elem else "No Title"

          parsed_date = None
          meta_items = page.query_selector_all("li.meta__item")
          for item in meta_items:
            text = item.inner_text().strip()
            match = re.search(r"(\d{1,2} \w{3} \d{4})", text)
            if match:
              try:
                parsed_date = datetime.strptime(match.group(1), "%d %b %Y").date()
                break
              except Exception:
                continue

          content_blocks = page.query_selector_all("main p, article p, .content p")
          paragraphs = [p.inner_text().strip() for p in content_blocks if p.inner_text().strip()]
          full_content = "\n".join(paragraphs)

          leak_obj = leak_model(
            m_title=title,
            m_weblink=[url],
            m_dumplink=[url],
            m_url=url,
            m_base_url=self.base_url,
            m_content=full_content,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=f"{title}\n{full_content}",
            m_content_type=["news", "tracking"],
            m_leak_date=parsed_date, )

          entity_data = entity_model(
            m_scrap_file=self.__class__.__name__, m_team="NCSC Cyber", m_country=["United Kingdom"])

          self.append_leak_data(leak_obj, entity_data)

        except Exception as e:
          log.g().e(f"ERROR processing {url}: {e}")

      self._is_crawled = True

    except Exception as ex:
      log.g().e(f"SCRIPT ERROR {ex} in {self.__class__.__name__}")
