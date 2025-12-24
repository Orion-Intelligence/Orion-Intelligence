import time
from abc import ABC
from datetime import datetime
from typing import List
from urllib.parse import urljoin

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _kyberturvallisuuskeskus(leak_extractor_interface, ABC):
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
      cls._instance = super(_kyberturvallisuuskeskus, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def is_crawled(self) -> bool:
    return self._is_crawled

  @property
  def seed_url(self) -> str:
    return "https://www.kyberturvallisuuskeskus.fi/en/tietoturva-nyt?limit=20&offset=0&query=&sort=updated"

  @property
  def developer_signature(self) -> str:
    return "Muhammad Hassan Arshad: owEBeAKH/ZANAwAKAbKjqaChU0IoAcsxYgBoei5jVmVyaWZpZWQgZGV2ZWxvcGVyOiBNdWhhbW1hZCBIYXNzYW4gQXJzaGFkCokCMwQAAQoAHRYhBD5p3c9aqX5fJ9SIZbKjqaChU0IoBQJoei5jAAoJELKjqaChU0Io2i8QAKRGGxAbMJGV97ym5wcir4mn2es2/npd+MFDa/LZFnkcoPOP9/fKtg9pZ1a2PVa0h9s5ewU6wGJ4HIvjP/2gxd1maDIjv6IM+5mtlpJvQJhzoqHdAg//IRwJU5QO2krqxBQrtcvNwfkW1IoNSEaJCr0EmXht3rkGhkJ3J3XqEvrBeH0DtaZLnCLOJ3eTIRleqbBOUdq2Uf9hDZZY9rdqynjjsADo1lhchdyPjwBz1g8M/q1Ud3sTUA+/8gas5l15jR9SGQZxbgnzZRjG19oq5GAhLwUYgKuoH+zANQEB7leF9jBudzYz2Ey/4BglnVE6kszUo7RxPoqtNOFvq6WzCcRKPLO323sLfFYtwXDwvJ0iviVTOwrbXlA80GFANcAbSR76nN0XrsaLM2L/KT6oe0wTVq35j1QZnt4Jq5PWALA8hQNr7w1KtuwnpN5PmE741h+9OfZP2ogd9ERbmGb10DROsd9t4RL4hpxpsCoekHRbLI3XmHFZqFAB/GgF194Tmh3LcoIAcwOYty/PVDuPYMGMmm5Nttg2vvVrMg82P0LeOrIN2Mq03HCiZm/HaOvePniPg+EeaWPMiVmGWvCJUOMI/TJRz4jVLR4BUlvoiUSNBWrJhxMRQZpViam2rVUaojPaZhzoIF4sqS6hYqzZbbXHwtYjJfNOHh00gucABJHw=gmDH"

  @property
  def base_url(self) -> str:
    return "https://www.kyberturvallisuuskeskus.fi/en"

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

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "https://www.kyberturvallisuuskeskus.fi/fi/ota-yhteytta"

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

      page.goto(seed_url)
      page.wait_for_load_state("domcontentloaded")
      time.sleep(10)
      has_next = True

      while has_next:
        articles = page.query_selector_all('.TeaserWrapper__StyledTeaserWrapperInner-sc-1vywuc7-1.kCcUKy')

        found_valid_article = False

        for idx, article in enumerate(articles, 1):
          try:
            link_elem = article.query_selector('h3.TeaserTitle__Heading-sc-1px1tf3-0.hwyHuL > a')
            if not link_elem:
              continue

            card_url = link_elem.get_attribute("href")
            if not card_url:
              continue

            card_url = urljoin(base_url, card_url)
            if card_url in visited_urls:
              continue
            visited_urls.add(card_url)

            title = link_elem.inner_text().strip()

            date_elem = article.query_selector('div.PageMetaData__Published-sc-1j6ditz-1 time[datetime]')
            date_obj = None
            if date_elem:
              date_str = date_elem.get_attribute("datetime")

              try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
              except Exception as e:
                continue

            if not date_obj or date_obj.year < min_year:
              continue

            found_valid_article = True
            detail_page = page.context.new_page()
            detail_page.goto(card_url, wait_until="domcontentloaded")
            detail_page.wait_for_selector("h1", timeout=8000)

            content_blocks = []
            lead = detail_page.query_selector('p.LeadParagraph__StyledLeadParagraph-sc-sztx1p-0')
            if lead:
              lead_text = lead.inner_text().strip()
              content_blocks.append(lead_text)

            paragraphs = detail_page.query_selector_all('div.Paragraph__StyledSection-sc-1rk24tr-0')
            for p in paragraphs:
              text = p.inner_text().strip()
              content_blocks.append(text)
            content = '\n\n'.join([c for c in content_blocks if c])

            weblinks = []
            if lead:
              for a in lead.query_selector_all('a[href]'):
                href = a.get_attribute("href")
                if href and not href.startswith("#") and href not in weblinks:
                  weblinks.append(href)
            for p in paragraphs:
              for a in p.query_selector_all('a[href]'):
                href = a.get_attribute("href")
                if href and not href.startswith("#") and href not in weblinks:
                  weblinks.append(href)

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
              m_scrap_file=self.__class__.__name__, m_team="kyberturvallisuuskeskus", m_country=["finland"])

            self.append_leak_data(card_data, entity_data)
            detail_page.close()

          except Exception as inner_ex:
            pass

        if not found_valid_article:
          has_next = False
          continue

        arrow_buttons = page.query_selector_all(
          'nav.Pagination__StyledPagination-sc-1ismx0y-0 button.Pagination__PaginationArrow-sc-1ismx0y-3')
        next_btn = None
        if arrow_buttons:
          next_btn = arrow_buttons[-1]
          if (("disabled" in (next_btn.get_attribute("class") or "")) or (
              next_btn.get_attribute("aria-disabled") == "true")):
            next_btn = None
        if next_btn:
          next_btn.click()
          page.wait_for_selector('.TeaserWrapper__StyledTeaserWrapperInner-sc-1vywuc7-1.kCcUKy')
          has_next = True
        else:
          has_next = False

    except Exception as ex:
      log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
