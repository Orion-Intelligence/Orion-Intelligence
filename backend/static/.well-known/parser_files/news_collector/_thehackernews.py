from abc import ABC
from datetime import datetime
from typing import List
import re
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
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
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False)

    @property
    def card_data(self) -> List[RuleModel]:
        return self._card_data

    @property
    def entity_data(self) -> List[RuleModel]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(
            command, [key + self.__class__.__name__, default_value, expiry]
        )

    def contact_page(self) -> str:
        return "https://thehackernews.com/p/submit-news.html"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        self._is_crawled = False
        all_links = set()
        current_url = self.seed_url

        for _ in range(2):
            page.goto(current_url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_load_state("networkidle")


            soup = BeautifulSoup(page.content(), "html.parser")
            selectors = [
                "a.story-link", "article h2 a", ".post-title a",
                "h2.post-title a", "a[href*='/20']", ".article-title a",
                "h3 a[href*='/']"
            ]
            for sel in selectors:
                for tag in soup.select(sel):
                    href = tag.get("href")
                    if href:
                        full_url = urljoin(self.base_url, href)
                        if full_url.startswith(self.base_url) and "/20" in full_url and not any(
                                x in full_url for x in ["tag", "search", "page"]):
                            all_links.add(full_url)

            next_page = soup.select_one("a.blog-pager-older-link, a[href*='max-results']")
            if next_page and next_page.get("href"):
                current_url = urljoin(self.base_url, next_page["href"])
            else:
                break

        for link in sorted(all_links):

            page.goto(link, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_load_state("networkidle")


            soup = BeautifulSoup(page.content(), "html.parser")
            title_tag = soup.select_one("h1, .post-title, .entry-title, .article-title")
            title = title_tag.get_text(strip=True) if title_tag else "No Title"

            author = soup.select_one("span.author-name, .author a, .post-author")
            author = author.get_text(strip=True) if author else None

            date_raw = soup.select_one("span.author-url, .post-meta time, abbr.published")
            date_raw = date_raw.get_text(strip=True) if date_raw else None

            content_tag = soup.select_one("div.articlebody, .post-body, .entry-content, .article-content")
            full_text, first_two_sentences = "", "Content not found."
            if content_tag:
                full_text = " ".join(content_tag.get_text(separator=" ").split())
                first_two_sentences = ". ".join(full_text.split(". ")[:2]).strip()
                if not first_two_sentences.endswith("."):
                    first_two_sentences += "."

                if not author or not date_raw:
                    if not date_raw:
                        date_match = re.search(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}",
                                               first_two_sentences)
                        if date_match:
                            date_raw = date_match.group(0)
                    if not author:
                        author_match = re.search(r"\d{4}\s+\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)", first_two_sentences)
                        if author_match:
                            author = author_match.group(1)

            composed_content = first_two_sentences
            parsed_date = None
            for fmt in ("%B %d, %Y", "%b %d, %Y", "%Y-%m-%d"):
                try:
                    parsed_date = datetime.strptime(date_raw, fmt).date()
                    break
                except Exception:
                    continue
            parsed_date = parsed_date

            card = leak_model(
                m_screenshot="",
                m_title=title,
                m_weblink=[link],
                m_dumplink=[link],
                m_url=link,
                m_base_url=self.base_url,
                m_content=composed_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=full_text,
                m_content_type=["news"],
                m_leak_date=parsed_date,
            )
            entity = entity_model(m_team="hackernews live")

            self.append_leak_data(card, entity)

        self._is_crawled = True
