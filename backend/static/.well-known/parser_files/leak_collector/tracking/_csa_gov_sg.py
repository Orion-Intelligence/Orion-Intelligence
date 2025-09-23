from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _csa_gov_sg(leak_extractor_interface, ABC):
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
            cls._instance = super(_csa_gov_sg, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://www.csa.gov.sg/alerts-and-advisories/"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Marij Younas: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9UyN"

    @property
    def base_url(self) -> str:
        return "https://www.csa.gov.sg/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.TRACKING,m_resoource_block=False)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://www.csa.gov.sg/contact-us/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        max_pages = 20
        all_urls = set()
        current_page = 1
        if self._is_crawled:
            max_pages=5

        while current_page <= max_pages:
            links = page.locator('a.outline.outline-offset-2.outline-link')
            count = links.count()
            for i in range(count):
                href = links.nth(i).get_attribute("href")
                if href and "/alerts-and-advisories/" in href:
                    all_urls.add(self.base_url + href)

            next_button = page.locator('li.flex button[aria-label="Go to next page"]')
            if not next_button.is_visible():
                break
            current_page += 1
            next_button.first.click()
            page.wait_for_load_state("domcontentloaded")

        for article_url in all_urls:
            page.goto(article_url, timeout=30000)

            title = page.locator(
                "h1.prose-display-md.break-words.text-base-content-strong"
            ).first.inner_text() if page.locator(
                "h1.prose-display-md.break-words.text-base-content-strong"
            ).count() > 0 else ""

            raw_date = page.locator(
                "p.prose-label-sm-medium.text-base-content"
            ).first.inner_text() if page.locator(
                "p.prose-label-sm-medium.text-base-content"
            ).count() > 0 else ""
            date = raw_date.strip() if raw_date else ""

            content_parts = []
            for selector in [
                "div.prose-title-lg.text-base-content-light",
                "div.w-full.overflow-x-auto.break-words.lg\\:max-w-\\[660px\\]"
            ]:
                if page.locator(selector).count() > 0:
                    content_parts.append(page.locator(selector).first.inner_text().strip())
            content = "\n".join(content_parts)

            imp_content = " ".join(content.split()[:200])

            links_in_content = []
            content_links_elem = page.locator(
                "div.w-full.overflow-x-auto.break-words.lg\\:max-w-\\[660px\\]"
            ).first
            for link_elem in content_links_elem.locator("a").all():
                link_href = link_elem.get_attribute("href")
                if link_href:
                    links_in_content.append(link_href)

            card_data = leak_model(
                m_title=title,
                m_url=article_url,
                m_base_url=self.base_url,
                m_content=content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=imp_content,
                m_content_type=["cve", "tracking"],
                m_leak_date=helper_method.extract_and_convert_date(date),
                m_weblink=links_in_content,
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_team="csa-gov-sg",
                m_country=["Singapore"],
            )

            self.append_leak_data(card_data, entity_data)
