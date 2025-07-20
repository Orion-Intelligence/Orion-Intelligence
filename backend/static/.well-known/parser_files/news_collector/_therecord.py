from abc import ABC
from datetime import datetime
from typing import List, Set
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _therecord(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_therecord, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, callback=None):
        if self._initialized:
            return
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._redis_instance = redis_controller()
        self._is_crawled = False
        self._initialized = True

    def init_callback(self, callback=None):
        self.callback = callback

    @property
    def seed_url(self) -> str:
        return "https://therecord.media/news"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "https://therecord.media"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False)

    @property
    def card_data(self) -> List:
        return self._card_data

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def entity_data(self) -> List:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(
            command, [key + self.__class__.__name__, default_value, expiry]
        )

    def contact_page(self) -> str:
        return self.base_url

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback and self.callback():
            self._card_data.clear()
            self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        self._is_crawled = False

        all_links: Set[str] = set()
        page.goto(self.seed_url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_load_state("networkidle")

        max_scrolls = 20

        for _ in range(max_scrolls):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

            soup = BeautifulSoup(page.content(), "html.parser")
            article_links = soup.select("div.article-listing__list a")

            new_links_count = 0
            for link in article_links:
                href = link.get("href")
                if href:
                    full_url = href if href.startswith("http") else urljoin(self.base_url, href)
                    if full_url not in all_links:
                        all_links.add(full_url)
                        new_links_count += 1

            if new_links_count == 0:
                break

        for idx, url in enumerate(all_links, 1):
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_load_state("networkidle")

                soup = BeautifulSoup(page.content(), "html.parser")

                title_tag = soup.select_one("h1") or soup.select_one("title")
                title = title_tag.get_text(strip=True) if title_tag else "No Title"

                content_selectors = [
                    "article", ".article-content", ".post-content", ".entry-content",
                    "div[class*='content']", "main article", ".article-body"
                ]

                content_tag = None
                for selector in content_selectors:
                    content_tag = soup.select_one(selector)
                    if content_tag:
                        break

                full_text = ""
                if content_tag:
                    for unwanted in content_tag.select("script, style, nav, aside, footer, .advertisement"):
                        unwanted.decompose()

                    paragraphs = content_tag.find_all("p")
                    if paragraphs:
                        full_text = "\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
                    else:
                        full_text = content_tag.get_text(separator="\n", strip=True)

                lines = [line.strip() for line in full_text.splitlines() if line.strip()]
                first_two_lines = "\n".join(lines[:2]) if lines else ""
                article_date = datetime.strptime(page.text_content('.article__date').replace('st', '').replace('nd', '').replace('rd', '').replace('th', ''), '%B %d, %Y').date()

                if title and title != "Error":
                    card_data = leak_model(
                        m_screenshot="",
                        m_leak_date=article_date,
                        m_title=title,
                        m_weblink=[url],
                        m_dumplink=[url],
                        m_url=url,
                        m_base_url=self.base_url,
                        m_content=first_two_lines,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=f"{title}\n{full_text}",
                        m_content_type=["news"]
                    )

                    entity_data = entity_model(m_team="The Record Media")
                    self.append_leak_data(card_data, entity_data)
            except Exception:
                continue

        self._is_crawled = True
