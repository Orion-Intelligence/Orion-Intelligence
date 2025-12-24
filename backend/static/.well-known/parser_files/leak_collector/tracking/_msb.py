from abc import ABC
from typing import List
import re
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


class _msb(leak_extractor_interface, ABC):
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
            cls._instance = super(_msb, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://www.msb.se/sv/aktuellt/nyheter/?sortOrder=DescendingYear"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Hassan Arshad: owEBeAKH/ZANAwAKAbKjqaChU0IoAcsxYgBoei5jVmVyaWZpZWQgZGV2ZWxvcGVyOiBNdWhhbW1hZCBIYXNzYW4gQXJzaGFkCokCMwQAAQoAHRYhBD5p3c9aqX5fJ9SIZbKjqaChU0IoBQJoei5jAAoJELKjqaChU0Io2i8QAKRGGxAbMJGV97ym5wcir4mn2es2/npd+MFDa/LZFnkcoPOP9/fKtg9pZ1a2PVa0h9s5ewU6wGJ4HIvjP/2gxd1maDIjv6IM+5mtlpJvQJhzoqHdAg//IRwJU5QO2krqxBQrtcvNwfkW1IoNSEaJCr0EmXht3rkGhkJ3J3XqEvrBeH0DtaZLnCLOJ3eTIRleqbBOUdq2Uf9hDZZY9rdqynjjsADo1lhchdyPjwBz1g8M/q1Ud3sTUA+/8gas5l15jR9SGQZxbgnzZRjG19oq5GAhLwUYgKuoH+zANQEB7leF9jBudzYz2Ey/4BglnVE6kszUo7RxPoqtNOFvq6WzCcRKPLO323sLfFYtwXDwvJ0iviVTOwrbXlA80GFANcAbSR76nN0XrsaLM2L/KT6oe0wTVq35j1QZnt4Jq5PWALA8hQNr7w1KtuwnpN5PmE741h+9OfZP2ogd9ERbmGb10DROsd9t4RL4hpxpsCoekHRbLI3XmHFZqFAB/GgF194Tmh3LcoIAcwOYty/PVDuPYMGMmm5Nttg2vvVrMg82P0LeOrIN2Mq03HCiZm/HaOvePniPg+EeaWPMiVmGWvCJUOMI/TJRz4jVLR4BUlvoiUSNBWrJhxMRQZpViam2rVUaojPaZhzoIF4sqS6hYqzZbbXHwtYjJfNOHh00gucABJHw=gmDH"

    @property
    def base_url(self) -> str:
        return "https://www.msb.se"

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
        return "https://x.com/MSBse"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            swedish_months = {'januari': 'January', 'februari': 'February', 'mars': 'March', 'april': 'April', 'maj': 'May', 'juni': 'June', 'juli': 'July', 'augusti': 'August', 'september': 'September', 'oktober': 'October', 'november': 'November', 'december': 'December'}

            seed_url = self.seed_url
            base_url = self.base_url
            is_first_crawl = not self.is_crawled
            min_year = 2023 if is_first_crawl else 2024

            visited_urls = set()
            page.goto(seed_url, wait_until="domcontentloaded")

            has_next = True
            while has_next:
                news_cards = page.query_selector_all("div.list-item.news")
                found_valid_article = False
                for card in news_cards:
                    title_a = card.query_selector("h2 a[href]")
                    card_url = title_a.get_attribute("href") if title_a else None
                    title = title_a.inner_text().strip() if title_a else ""

                    info_div = card.query_selector("div.news-short-info")
                    date_str = ""
                    if info_div:
                        date_match = re.search(r"(\d{1,2}\s+\w+\s+\d{4})", info_div.inner_text())
                        date_str = date_match.group(1) if date_match else ""

                    year_match = re.search(r"(\d{4})", date_str)
                    year = int(year_match.group(1)) if year_match else None
                    if not year or year < min_year:
                        continue
                    if not card_url or card_url in visited_urls:
                        continue
                    visited_urls.add(card_url)

                    for swe, eng in swedish_months.items():
                        if swe in date_str:
                            date_str = date_str.replace(swe, eng)
                            break

                    detail_page = page.context.new_page()
                    detail_page.goto(card_url, wait_until="domcontentloaded")

                    content_parts = []
                    intro_div = detail_page.query_selector("div.page-intro p")
                    if intro_div:
                        content_parts.append(intro_div.inner_text().strip())
                    main_body_div = detail_page.query_selector("div.page-main-body")
                    if main_body_div:
                        for p in main_body_div.query_selector_all("p"):
                            content_parts.append(p.inner_text().strip())
                    content = "\n\n".join([part for part in content_parts if part])

                    weblinks = []
                    dumplinks = []
                    if main_body_div:
                        for a in main_body_div.query_selector_all("a[href]"):
                            href = a.get_attribute("href")
                            if href:
                                if re.match(r"^https?://", href):
                                    weblinks.append(href)
                                if re.search(r"\.(pdf|doc|docx|zip|xls|xlsx)$", href, re.IGNORECASE):
                                    dumplinks.append(href)

                    date_obj = None
                    if date_str:
                        date_obj = datetime.strptime(date_str, "%d %B %Y").date()

                    card_data = leak_model(
                        m_title=title,
                        m_url=card_url,
                        m_base_url=base_url,
                        m_content=content,
                        m_network=helper_method.get_network_type(base_url),
                        m_important_content=content[0:500],
                        m_weblink=weblinks,
                        m_dumplink=dumplinks,
                        m_content_type=["news", "tracking"],
                        m_leak_date=date_obj, )
                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__, m_team="msb", m_country=["Sweden"], )

                    self.append_leak_data(card_data, entity_data)
                    detail_page.close()

                    found_valid_article = True

                next_btn = page.query_selector("li.pagination-next a[href]")
                if next_btn and next_btn.is_enabled():
                    next_href = next_btn.get_attribute("href")
                    if next_href and not next_href.startswith("javascript"):
                        next_url = urljoin(seed_url, next_href)
                        page.goto(next_url, wait_until="domcontentloaded")
                    else:
                        has_next = False
                else:
                    has_next = False

                if not found_valid_article:
                    break

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
