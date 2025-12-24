import re
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


class _thehackernews(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_thehackernews, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def init_callback(self, callback=None):
        self.callback = callback

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()
        self._is_crawled = False

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://thehackernews.com/"

    @property
    def base_url(self) -> str:
        return "https://thehackernews.com/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_threat_type=ThreatType.NEWS,
            m_fetch_proxy=FetchProxy.NONE,
            m_fetch_config=FetchConfig.REQUESTS,
            m_resoource_block=False)

    @property
    def card_data(self) -> List[RuleModel]:
        return self._card_data

    @property
    def entity_data(self) -> List[RuleModel]:
        return self._entity_data

    @property
    def developer_signature(self) -> str:
        return "Muhammad Abdullah:owGbwMvMwMEYdOzLoajv79gZTxskMWRU6bi8370 / LLUoMy0zNUUhJbUsNSe / ILXISsG3NCMxNzcxRcExKaU0Jycxg5erYzMLAyMHg6yYIkuQ4M9 / l7siYpT2b / oFM5GVCWQcAxenAEykRYSFYcHRJWUetXMKmo78Ec5ueHZq52rX / vuHpJTf / G31ULsywdC23 + fM4tmaUbP2cXYm7y9kPHnAdbXgspWerkeXW8ZYmm2xrpdTF / Yyvi0aGdn5iMne8PQGgSgWxeOMKUo8IQvL3W1PN4gtYYkxfr6kMZ3t0tmSRR2qnu / fZ2yfqfdm9szOQpt2AA ===weDX"

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(
            command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://thehackernews.com/p/submit-news.html"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page):
        all_links = set()
        try:
            session = page
            current_url = session._seed_response.url
            max_pages = 5
            if self.is_crawled:
                max_pages = 2

            for _ in range(max_pages):
                resp = session.get(current_url, timeout=60)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "html.parser")

                selectors = [".blog-posts .body-post a.story-link[href]", ".body-post a.story-link[href]",
                    "article h2 a[href]", ".post-title a[href]", "h2.post-title a[href]", "a[href*='/20']",
                    ".article-title a[href]", "h3 a[href*='/']", ]
                for sel in selectors:
                    for tag in soup.select(sel):
                        href = tag.get("href")
                        if href:
                            full_url = urljoin(self.base_url, href)
                            if full_url.startswith(self.base_url) and "/20" in full_url and not any(
                                    x in full_url for x in ["tag", "search", "page"]):
                                all_links.add(full_url)

                next_tag = soup.select_one("a.blog-pager-older-link, a[href*='max-results']")
                if next_tag and next_tag.get("href"):
                    current_url = urljoin(self.base_url, next_tag.get("href"))
                else:
                    break

            for link in sorted(all_links):
                try:
                    r = session.get(link, timeout=60)
                    r.raise_for_status()
                    s = BeautifulSoup(r.text, "html.parser")

                    title_el = s.select_one("h1, .post-title, .entry-title, .article-title")
                    title = title_el.get_text(strip=True) if title_el else ""

                    date_raw = ""
                    date_el = s.select_one("span.author-url, .post-meta time, abbr.published")
                    if date_el:
                        date_raw = date_el.get_text(strip=True)

                    content_tag = None
                    for sel in ["div.articlebody", ".post-body", ".entry-content", ".article-content"]:
                        el = s.select_one(sel)
                        if el:
                            content_tag = el
                            break

                    full_text, first_two_sentences = "", "Content not found."
                    if content_tag:
                        full_text = content_tag.get_text(" ", strip=True).replace("\n", " ")
                        first_two_sentences = ". ".join(full_text.split(". ")[:2]).strip()
                        if not first_two_sentences.endswith("."):
                            first_two_sentences += "."
                        if not date_raw:
                            m = re.search(
                                r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}",
                                first_two_sentences)
                            if m:
                                date_raw = m.group(0)

                    parsed_date = None
                    for fmt in ("%B %d, %Y", "%b %d, %Y", "%Y-%m-%d"):
                        try:
                            parsed_date = datetime.strptime(date_raw, fmt).date()
                            break
                        except:
                            continue

                    card = leak_model(
                        m_screenshot="",
                        m_title=title,
                        m_weblink=[link],
                        m_dumplink=[link],
                        m_url=link,
                        m_base_url=self.base_url,
                        m_content=full_text,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=first_two_sentences,
                        m_content_type=["news"],
                        m_leak_date=parsed_date, )

                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__, m_team="hackernews live", )

                    self.append_leak_data(card, entity_data)

                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                    continue

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
