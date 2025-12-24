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


class _cncs_pt(leak_extractor_interface, ABC):
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
      cls._instance = super(_cncs_pt, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def is_crawled(self) -> bool:
    return self._is_crawled

  @property
  def seed_url(self) -> str:
    return "https://dyn.cncs.gov.pt/pt/noticias"

  @property
  def developer_signature(self) -> str:
    return "Muhammad Hassan Arshad: owEBeAKH/ZANAwAKAbKjqaChU0IoAcsxYgBoei5jVmVyaWZpZWQgZGV2ZWxvcGVyOiBNdWhhbW1hZCBIYXNzYW4gQXJzaGFkCokCMwQAAQoAHRYhBD5p3c9aqX5fJ9SIZbKjqaChU0IoBQJoei5jAAoJELKjqaChU0Io2i8QAKRGGxAbMJGV97ym5wcir4mn2es2/npd+MFDa/LZFnkcoPOP9/fKtg9pZ1a2PVa0h9s5ewU6wGJ4HIvjP/2gxd1maDIjv6IM+5mtlpJvQJhzoqHdAg//IRwJU5QO2krqxBQrtcvNwfkW1IoNSEaJCr0EmXht3rkGhkJ3J3XqEvrBeH0DtaZLnCLOJ3eTIRleqbBOUdq2Uf9hDZZY9rdqynjjsADo1lhchdyPjwBz1g8M/q1Ud3sTUA+/8gas5l15jR9SGQZxbgnzZRjG19oq5GAhLwUYgKuoH+zANQEB7leF9jBudzYz2Ey/4BglnVE6kszUo7RxPoqtNOFvq6WzCcRKPLO323sLfFYtwXDwvJ0iviVTOwrbXlA80GFANcAbSR76nN0XrsaLM2L/KT6oe0wTVq35j1QZnt4Jq5PWALA8hQNr7w1KtuwnpN5PmE741h+9OfZP2ogd9ERbmGb10DROsd9t4RL4hpxpsCoekHRbLI3XmHFZqFAB/GgF194Tmh3LcoIAcwOYty/PVDuPYMGMmm5Nttg2vvVrMg82P0LeOrIN2Mq03HCiZm/HaOvePniPg+EeaWPMiVmGWvCJUOMI/TJRz4jVLR4BUlvoiUSNBWrJhxMRQZpViam2rVUaojPaZhzoIF4sqS6hYqzZbbXHwtYjJfNOHh00gucABJHw=gmDH"

  @property
  def base_url(self) -> str:
    return "https://dyn.cncs.gov.pt"

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
    return "https://x.com/CNCSgovpt"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page):
    try:
      base_url = self.base_url
      is_first_crawl = not self.is_crawled
      min_year = 2023 if is_first_crawl else 2024
      visited_urls = set()
      page_idx = 1
      has_next = True
      current_html = page._seed_response.text
      while has_next:
        soup = BeautifulSoup(current_html, "html.parser")
        cards = soup.select('.blog-posts .row.px-3 article.post')
        found_valid_article = False
        for card in cards:
          a_tag = card.select_one('.post-meta a.btn')
          card_url = urljoin(base_url, a_tag.get("href")) if a_tag and a_tag.get("href") else None
          if not card_url or card_url in visited_urls:
            continue
          visited_urls.add(card_url)
          title_tag = card.select_one('h2.news-title-2')
          title = title_tag.get_text(strip=True) if title_tag else ""
          date_meta = card.select_one('.post-date')
          date_obj = None
          if date_meta:
            day_elem = date_meta.select_one('.day')
            month_elem = date_meta.select_one('.month')
            if day_elem and month_elem:
              day = day_elem.get_text(strip=True)
              month_year = month_elem.get_text(strip=True)
              tokens = month_year.split()
              if len(tokens) == 2:
                month_txt, year_txt = tokens
                pt_month_map = {"janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12, "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6, "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12}
                month_key = month_txt.lower().strip().replace(".", "")
                month_num = pt_month_map.get(month_key, None)
                if month_num and day.isdigit() and year_txt.isdigit():
                  try:
                    date_obj = datetime(year=int(year_txt), month=month_num, day=int(day)).date()
                  except Exception:
                    date_obj = None
          if not date_obj or date_obj.year < min_year:
            continue
          tags_elem = card.select_one('.post-meta span')
          tags = []
          if tags_elem:
            tags_str = tags_elem.get_text(strip=True)
            tags_str = tags_str.replace('\uf02b', '')
            tags = [t.strip() for t in tags_str.split(",") if t.strip()]
          found_valid_article = True
          try:
            detail_resp = page.get(card_url, timeout=60)
            detail_resp.raise_for_status()
            detail_soup = BeautifulSoup(detail_resp.text, "html.parser")
            content_elem = detail_soup.select_one('.post-content')
            content = content_elem.get_text(strip=True) if content_elem else ""
            weblinks = []
            if content_elem:
              for a in content_elem.select('a[href]'):
                href = a.get("href")
                if href and not href.startswith("#") and href not in weblinks:
                  weblinks.append(urljoin(card_url, href))
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
              m_scrap_file=self.__class__.__name__, m_team="cncs", m_country=["portugal"], m_tags=tags, )
            self.append_leak_data(card_data, entity_data)
          except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
        if not found_valid_article:
          break
        active_li = soup.select_one('ul.pagination li.page-item.active')
        has_next = False
        if active_li:
          next_li = active_li.find_next_sibling("li")
          if next_li:
            classes = " ".join(next_li.get("class") or [])
            if 'invisible' not in classes and 'active' not in classes:
              next_link = next_li.select_one('a.page-link')
              if next_link and next_link.get("href"):
                next_href = urljoin(self.seed_url, next_link.get("href"))
                try:
                  resp = page.get(next_href, timeout=60)
                  resp.raise_for_status()
                  current_html = resp.text
                  page_idx += 1
                  has_next = True
                  continue
                except Exception as ex:
                  log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                  break
    except Exception as ex:
      log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
