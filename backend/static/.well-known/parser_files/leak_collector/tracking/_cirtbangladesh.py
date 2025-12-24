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


class _cirtbangladesh(leak_extractor_interface, ABC):
  _instance = None

  def __new__(cls, *args, **kwargs):
    if cls._instance is None:
      cls._instance = super().__new__(cls)
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
  def seed_url(self):
    return "https://www.cirt.gov.bd/news/"

  @property
  def base_url(self):
    return "https://www.cirt.gov.bd"

  @property
  def rule_config(self):
    return RuleModel(
      m_fetch_proxy=FetchProxy.NONE,
      m_fetch_config=FetchConfig.PLAYRIGHT,
      m_resoource_block=False,
      m_threat_type=ThreatType.TRACKING)

  @property
  def developer_signature(self) -> str:
    return "Muhammad Abdullah:owGbwMvMwMEYdOzLoajv79gZTxskMWRU6bi8370 / LLUoMy0zNUUhJbUsNSe / ILXISsG3NCMxNzcxRcExKaU0Jycxg5erYzMLAyMHg6yYIkuQ4M9 / l7siYpT2b / oFM5GVCWQcAxenAEykRYSFYcHRJWUetXMKmo78Ec5ueHZq52rX / vuHpJTf / G31ULsywdC23 + fM4tmaUbP2cXYm7y9kPHnAdbXgspWerkeXW8ZYmm2xrpdTF / Yyvi0aGdn5iMne8PQGgSgWxeOMKUo8IQvL3W1PN4gtYYkxfr6kMZ3t0tmSRR2qnu / fZ2yfqfdm9szOQpt2AA ===weDX"

  @property
  def card_data(self):
    return self._card_data

  @property
  def is_crawled(self):
    return self._is_crawled

  @property
  def entity_data(self):
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return self.base_url

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback and self.callback():
      self._card_data.clear()
      self._entity_data.clear()

  @staticmethod
  def is_english(text: str) -> bool:
    return not re.search(r'[\u0980-\u09FF]', text)

  def parse_leak_data(self, page: Page):
    try:
      all_links = set()
      max_pages = 10 if self._is_crawled else 8

      for num in range(1, max_pages):
        url = self.seed_url if num == 1 else f"{self.base_url}/news/page/{num}/"
        try:
          page.goto(url, wait_until="domcontentloaded", timeout=30000)
          page.wait_for_load_state("networkidle")

          try:
            page.wait_for_selector("div.col-md-11.omega", timeout=60000)
            article_blocks = page.query_selector_all("div.col-md-11.omega")
          except:
            article_blocks = page.query_selector_all("div.col-md-11.omega")

          for block in article_blocks:
            try:
              a_tag = block.query_selector("h3 > a")
              if a_tag:
                title_text = a_tag.inner_text().strip()
                href = a_tag.get_attribute("href")
                if href and self.is_english(title_text):
                  full_url = urljoin(self.base_url, href)
                  all_links.add(full_url)
            except:
              pass

        except Exception as e:
          pass

      articles = sorted(all_links)[:25]

      for url in articles:
        try:
          page.goto(url, wait_until="domcontentloaded", timeout=30000)
          page.wait_for_load_state("networkidle")

          title = "No Title"
          for sel in ["h1", ".page-title", ".article-title", "h2", "h3"]:
            el = page.query_selector(sel)
            if el:
              t = el.inner_text().strip()
              if len(t) > 3:
                title = t
                break

          date_obj = None
          date_el = page.query_selector(".blog-date")
          if date_el:
            date_text = date_el.inner_text().strip()
            try:
              date_obj = datetime.strptime(date_text, "%d %b %Y").date()
            except:
              pass
          if not date_obj:
            time_el = page.query_selector("time[datetime]")
            if time_el:
              dt_attr = time_el.get_attribute("datetime")
              if dt_attr:
                try:
                  date_obj = datetime.fromisoformat(dt_attr.replace("Z", "+00:00")).date()
                except:
                  pass

          paragraphs = []
          for sel in ["article p", "div.entry-content p", "div[id^='post-'] p"]:
            els = page.query_selector_all(sel)
            if els:
              for p in els:
                txt = p.text_content().strip()
                if len(txt) > 20:
                  paragraphs.append(txt)

              if paragraphs:
                break

          if not paragraphs:
            mc = page.query_selector("main") or page.query_selector("article")
            if mc:
              paras = [p.strip() for p in mc.text_content().splitlines() if len(p.strip()) > 20]
              paragraphs.extend(paras)

          content = "\n\n".join(paragraphs) if paragraphs else "No content"

          leak = leak_model(
            m_title=title,
            m_weblink=[url],
            m_dumplink=[url],
            m_url=url,
            m_base_url=self.base_url,
            m_content=content,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content="\n".join(paragraphs[:2]) if paragraphs else "",
            m_content_type=["news", "tracking"],
            m_leak_date=date_obj)

          entity = entity_model(
            m_scrap_file=self.__class__.__name__,
            m_company_name="BGD e-GOV CIRT",
            m_country=["Bangladesh"],
            m_team="Cyber Threat Intelligence Unit")

          self.append_leak_data(leak, entity)

        except Exception as ex:
          pass

      self._is_crawled = True

    except Exception as ex:
      log.g().e(f"SCRIPT ERROR {ex} in {self.__class__.__name__}")
