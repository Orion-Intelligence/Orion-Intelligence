from abc import ABC
from datetime import datetime
from typing import List
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _cert_at(leak_extractor_interface, ABC):
  _instance = None

  def __init__(self, callback=None):
    self.callback = callback
    self._card_data = []
    self._entity_data = []
    self.soup = None
    self._initialized = None
    self._redis_instance = redis_controller()
    self._is_crawled = False

  def init_callback(self, callback=None):
    self.callback = callback

  def __new__(cls, callback=None):
    if cls._instance is None:
      cls._instance = super(_cert_at, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def is_crawled(self) -> bool:
    return self._is_crawled

  @property
  def seed_url(self) -> str:
    return "https://www.cert.at/de/meldungen/aktuelles"

  @property
  def developer_signature(self) -> str:
    return "Muhammad Hassan Arshad: owEBeAKH/ZANAwAKAbKjqaChU0IoAcsxYgBoei5jVmVyaWZpZWQgZGV2ZWxvcGVyOiBNdWhhbW1hZCBIYXNzYW4gQXJzaGFkCokCMwQAAQoAHRYhBD5p3c9aqX5fJ9SIZbKjqaChU0IoBQJoei5jAAoJELKjqaChU0Io2i8QAKRGGxAbMJGV97ym5wcir4mn2es2/npd+MFDa/LZFnkcoPOP9/fKtg9pZ1a2PVa0h9s5ewU6wGJ4HIvjP/2gxd1maDIjv6IM+5mtlpJvQJhzoqHdAg//IRwJU5QO2krqxBQrtcvNwfkW1IoNSEaJCr0EmXht3rkGhkJ3J3XqEvrBeH0DtaZLnCLOJ3eTIRleqbBOUdq2Uf9hDZZY9rdqynjjsADo1lhchdyPjwBz1g8M/q1Ud3sTUA+/8gas5l15jR9SGQZxbgnzZRjG19oq5GAhLwUYgKuoH+zANQEB7leF9jBudzYz2Ey/4BglnVE6kszUo7RxPoqtNOFvq6WzCcRKPLO323sLfFYtwXDwvJ0iviVTOwrbXlA80GFANcAbSR76nN0XrsaLM2L/KT6oe0wTVq35j1QZnt4Jq5PWALA8hQNr7w1KtuwnpN5PmE741h+9OfZP2ogd9ERbmGb10DROsd9t4RL4hpxpsCoekHRbLI3XmHFZqFAB/GgF194Tmh3LcoIAcwOYty/PVDuPYMGMmm5Nttg2vvVrMg82P0LeOrIN2Mq03HCiZm/HaOvePniPg+EeaWPMiVmGWvCJUOMI/TJRz4jVLR4BUlvoiUSNBWrJhxMRQZpViam2rVUaojPaZhzoIF4sqS6hYqzZbbXHwtYjJfNOHh00gucABJHw=gmDH"

  @property
  def base_url(self) -> str:
    return "https://www.cert.at"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(
      m_fetch_proxy=FetchProxy.NONE,
      m_fetch_config=FetchConfig.REQUESTS,
      m_resoource_block=False,
      m_threat_type=ThreatType.TRACKING)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "https://www.cert.at/de/ueber-uns/kontakt"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page):
    try:
      seed_url = self.seed_url
      base_url = self.base_url
      is_first_crawl = not self.is_crawled
      min_year = 2023 if is_first_crawl else 2024
      visited_urls = set()
      resp = getattr(page, "_seed_response", None)
      if resp and hasattr(resp, "text"):
        current_html = resp.text
      else:
        resp = page.get(seed_url, timeout=60)
        resp.raise_for_status()
        page._seed_response = resp
        current_html = resp.text
      has_next = True
      while has_next:
        soup = BeautifulSoup(current_html, "html.parser")
        rows = soup.select("div.row")
        found_valid_article = False
        for row in rows:
          read_more_link = row.select_one("a#article-ref")
          if not read_more_link:
            continue
          card_url = read_more_link.get("href")
          if card_url:
            card_url = urljoin(seed_url, card_url)
          if not card_url or card_url in visited_urls:
            continue
          visited_urls.add(card_url)
          h2 = row.select_one("div.col-sm-11 > h2")
          date_text = ""
          if h2:
            small = h2.select_one("small")
            if small:
              date_text = small.get_text(strip=True)
          date_obj = None
          if date_text:
            try:
              date_obj = datetime.strptime(date_text, "%d.%m.%Y %H:%M").date()
            except Exception:
              try:
                date_obj = datetime.strptime(date_text, "%m/%d/%Y %I:%M %p").date()
              except Exception:
                date_obj = None
          if not date_obj or date_obj.year < min_year:
            continue
          found_valid_article = True
          try:
            detail_resp = page.get(card_url, timeout=60)
            detail_resp.raise_for_status()
            detail_soup = BeautifulSoup(detail_resp.text, "html.parser")
            h1 = detail_soup.select_one("h1")
            date_val = ""
            title = ""
            if h1:
              small = h1.select_one("small")
              if small:
                date_val = small.get_text(strip=True)
              all_text = h1.get_text(strip=True)
              if date_val and all_text.startswith(date_val):
                title = all_text[len(date_val):].lstrip(" \n\r-")
              else:
                title = all_text
              title = " ".join(title.split())
            content_blocks = detail_soup.select("div.block p.block")
            content = "\n".join([p.get_text(strip=True) for p in content_blocks]) if content_blocks else ""
            weblinks = []
            for p in content_blocks:
              for a in p.select("a[href]"):
                href = a.get("href")
                if href:
                  weblinks.append(urljoin(base_url, href) if not href.startswith("http") else href)
            card_data = leak_model(
              m_title=title,
              m_url=card_url,
              m_base_url=base_url,
              m_content=content,
              m_network=helper_method.get_network_type(base_url),
              m_important_content=content[:500],
              m_weblink=weblinks,
              m_leak_date=date_obj,
              m_content_type=["news", "tracking"], )
            entity_data = entity_model(
              m_scrap_file=self.__class__.__name__, m_team="cert.at", m_country=["austria"])
            self.append_leak_data(card_data, entity_data)
          except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
        if not found_valid_article:
          has_next = False
          continue
        next_btn = soup.select_one('ul.pagination li.page-item a.page-link[rel="next"]')
        if next_btn and next_btn.get("href"):
          next_url = urljoin(seed_url, next_btn.get("href"))
          try:
            resp = page.get(next_url, timeout=60)
            resp.raise_for_status()
            current_html = resp.text
          except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            break
        else:
          has_next = False
    except Exception as ex:
      log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
