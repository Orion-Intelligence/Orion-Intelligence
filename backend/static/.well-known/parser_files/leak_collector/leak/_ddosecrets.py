import re
from abc import ABC
from typing import List
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _ddosecrets(leak_extractor_interface, ABC):
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

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_ddosecrets, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "https://ddosecrets.com/all_articles/a-z"

    @property
    def base_url(self) -> str:
        return "https://ddosecrets.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_resoource_block=False, m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://ddosecrets.com/about"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state("networkidle")

        article_divs = page.query_selector_all("div.article")
        article_links = []
        for div in article_divs:
            h4 = div.query_selector("h4")
            if h4:
                a = h4.query_selector("a")
                if a:
                    href = a.get_attribute("href")
                    if href:
                        article_links.append(urljoin(self.base_url, href))

        error_count = 0

        for article_url in article_links:
            try:
                page.goto(article_url, wait_until="networkidle")

                content_divs = page.query_selector_all("div.content")
                content_div = None
                for div in content_divs:
                    if div.get_attribute("id") is None or div.get_attribute("id") != "promo":
                        content_div = div
                        break
                if not content_div:
                    continue

                title_el = content_div.query_selector("h1")
                title = title_el.text_content().strip() if title_el else ""

                meta_el = content_div.query_selector("p.meta")
                published_date = meta_el.text_content().strip() if meta_el else ""
                published_date = helper_method.extract_and_convert_date(published_date)

                metadata_div = content_div.query_selector("div.metadata")
                countries = []
                download_size = ""
                dumplinks = []

                match = re.findall(r'href=["\']/source/([^"\']+)', page.content())
                sources = match[0] if match else ""

                if metadata_div:
                    country_els = metadata_div.query_selector_all("a[href*='/country/']")
                    countries = [c.text_content().strip() for c in country_els]

                    size_els = metadata_div.query_selector_all("p")
                    for p in size_els:
                        text = p.text_content().strip()
                        if "Download Size:" in text:
                            download_size = text.replace("Download Size:", "").strip()
                            break

                    a_tags = metadata_div.query_selector_all("a[href]")
                    for a in a_tags:
                        href = a.get_attribute("href")
                        if href:
                            dumplinks.append(urljoin(self.base_url, href))

                article_content = content_div.query_selector("div.article-content")
                content_text = ""
                weblinks = []
                if article_content:
                    ps = article_content.query_selector_all("p")
                    content_text = " ".join(p.text_content().strip() for p in ps)

                    a_tags = article_content.query_selector_all("a[href]")
                    for a in a_tags:
                        href = a.get_attribute("href")
                        if href:
                            weblinks.append(urljoin(self.base_url, href))

                card_data = leak_model(
                    m_screenshot=helper_method.get_screenshot_base64(page, None, title),
                    m_title=title,
                    m_url=article_url,
                    m_base_url=self.base_url,
                    m_content=content_text + " " + self.base_url + " " + article_url + " " + sources,
                    m_content_type=["leaks"],
                    m_important_content=content_text,
                    m_weblink=weblinks,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_dumplink=dumplinks,
                    m_leak_date=published_date,
                    m_data_size=download_size,
                )

                country = " - ".join(countries) if countries else None
                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_attacker=[sources],
                    m_location=countries,
                    m_country=[country] or [],
                    m_team="ddosecret"
                )

                self.append_leak_data(card_data, entity_data)
                error_count = 0

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                error_count += 1
                if error_count >= 3:
                    break
