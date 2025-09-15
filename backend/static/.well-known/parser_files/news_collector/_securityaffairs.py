from abc import ABC
from datetime import datetime
from typing import List
from urllib.parse import urljoin
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method

class _securityaffairs(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_securityaffairs, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def init_callback(self, callback=None):
        self.callback = callback

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self._initialized = None
        self._redis_instance = redis_controller()
        self._is_crawled = False

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def contact_page(self) -> str:
        return "https://securityaffairs.com/contact"

    @property
    def seed_url(self) -> str:
        return "https://securityaffairs.com/"

    @property
    def base_url(self) -> str:
        return "https://securityaffairs.com/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_threat_type=ThreatType.NEWS,m_fetch_proxy=FetchProxy.NONE,m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False)

    @property
    def card_data(self) -> List[RuleModel]:
        return self._card_data

    @property
    def entity_data(self) -> List[RuleModel]:
        return self._entity_data

    @property
    def developer_signature(self) -> str:
        return "Muhammad Abdullah: owGbwMvMwMEYdOzLoajv79gZTxskMWRU6bi8370 / LLUoMy0zNUUhJbUsNSe / ILXISsG3NCMxNzcxRcExKaU0Jycxg5erYzMLAyMHg6yYIkuQ4M9 / l7siYpT2b / oFM5GVCWQcAxenAEykRYSFYcHRJWUetXMKmo78Ec5ueHZq52rX / vuHpJTf / G31ULsywdC23 + fM4tmaUbP2cXYm7y9kPHnAdbXgspWerkeXW8ZYmm2xrpdTF / Yyvi0aGdn5iMne8PQGgSgWxeOMKUo8IQvL3W1PN4gtYYkxfr6kMZ3t0tmSRR2qnu / fZ2yfqfdm9szOQpt2AA ===weDX"

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(
            command, [key + self.__class__.__name__, default_value, expiry]
        )

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        all_links = set()
        for page_num in range(2, 7):
            url = f"{self.base_url}?page={page_num}#latest_news_section"
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_load_state("networkidle")

            links = page.locator("#latest_news_section a[href*='/']")
            for i in range(links.count()):
                href = links.nth(i).get_attribute("href")
                if href:
                    full_url = urljoin(self.base_url, href)
                    if full_url.startswith(self.base_url):
                        all_links.add(full_url)

        for idx, link in enumerate(sorted(all_links), start=1):
            page.goto(link, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_load_state("networkidle")


            title_selector = "div.common-heading.line-bottom.article-title.mb-3.wow.fadeInUp.animated > h2"
            title = page.locator(title_selector).first.inner_text().strip() if page.locator(title_selector).count() > 0 else ""

            date_selector = "div.post-time.mb-3 > span:nth-child(2)"
            date_raw = page.locator(date_selector).first.inner_text().strip() if page.locator(date_selector).count() > 0 else ""

            author_selector = "div.post-time.mb-3 > span:nth-child(1) > a"
            author = page.locator(author_selector).first.inner_text().strip() if page.locator(author_selector).count() > 0 else ""

            desc_selector = "div.article-details-block.wow.fadeInUp.animated > p:nth-child(6)"
            description = page.locator(desc_selector).first.inner_text().strip() if page.locator(desc_selector).count() > 0 else ""

            parsed_date = None
            for fmt in ("%B %d, %Y", "%b %d, %Y"):
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
                m_content=description,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=description,
                m_content_type=["news"],
                m_leak_date=parsed_date,
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_team="securityaffairs news"
            )

            self.append_leak_data(card, entity_data)
