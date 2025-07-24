from abc import ABC
from datetime import datetime
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _postswigger(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_postswigger, cls).__new__(cls)
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
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://portswigger.net/daily-swig/hacking-news"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "https://portswigger.net"

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
        return self.base_url

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback and self.callback():
            self._card_data.clear()
            self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        self._is_crawled = False
        all_links = set()

        page.goto(self.seed_url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_load_state("networkidle")
        soup = BeautifulSoup(page.content(), "html.parser")

        for tag in soup.select("div[class*='tile'] a[href^='/daily-swig/']"):
            href = tag.get("href")
            if href and href.startswith("/daily-swig/"):
                full_url = urljoin(self.base_url, href)
                all_links.add(full_url)

        for link in all_links:
            try:
                page.goto(link, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_load_state("networkidle")
                soup = BeautifulSoup(page.content(), "html.parser")

                title_tag = next(
                    (soup.select_one(sel) for sel in ["h1.article-title", "h1", ".title"] if soup.select_one(sel)),
                    None
                )
                title = title_tag.get_text(strip=True) if title_tag else "No Title"

                author = ""
                for sel in [
                    "span.author-name", ".author a", ".post-author", "a[rel='author']",
                    "div.byline span.name", "p.byline", ".article-author", ".author-name a", ".entry-author"
                ]:
                    author_tag = soup.select_one(sel)
                    if author_tag:
                        author = author_tag.get_text(strip=True)
                        break

                for sel in [
                    "article", "div.article-body", "div.article-content", "section.article__body",
                    "div.article-text", "div.post-content", "div.content-body", "section.content"
                ]:
                    content_tag = soup.select_one(sel)
                    if content_tag:
                        break

                full_text = ""
                if content_tag:
                    paragraphs = content_tag.find_all("p")
                    if paragraphs:
                        full_text = "\n".join(p.get_text(strip=True) for p in paragraphs)
                    else:
                        full_text = content_tag.get_text(separator="\n", strip=True)

                lines = [line.strip() for line in full_text.splitlines() if line.strip()]
                first_two_lines = "\n".join(lines[:2])
                article_date = datetime.strptime([line for line in page.text_content('.post-additionalinfo').split('\n') if 'at' in line and 'Updated' not in line][0].strip(), '%d %B %Y at %H:%M %Z').date()

                card_data = leak_model(
                    m_screenshot="",
                    m_title=title,
                    m_weblink=[link],
                    m_dumplink=[link],
                    m_url=link,
                    m_base_url=self.base_url,
                    m_content=first_two_lines,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=full_text,
                    m_content_type=["news"],
                    m_leak_date=article_date,
                )

                entity_data = entity_model(m_team="PortSwigger DailySwig", m_name=author)
                self.append_leak_data(card_data, entity_data)

            except Exception as ex:
                log.g().e(ex)

        self._is_crawled = True

