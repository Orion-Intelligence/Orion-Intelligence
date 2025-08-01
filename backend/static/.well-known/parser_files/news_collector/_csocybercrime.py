from abc import ABC
from datetime import datetime
from typing import List
from playwright.sync_api import Page
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _csocybercrime(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_csocybercrime, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, callback=None):
        if self._initialized:
            return
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self._redis_instance = redis_controller()
        self._is_crawled = False
        self._initialized = True

    def init_callback(self, callback=None):
        self.callback = callback

    @property
    def seed_url(self) -> str:
        return "https://www.csoonline.com/uk/cybercrime/"

    @property
    def base_url(self) -> str:
        return "https://www.csoonline.com"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Abdullah:owGbwMvMwMEYdOzLoajv79gZTxskMWRU6bi8370/...===weDX"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_fetch_proxy=FetchProxy.NONE,
            m_fetch_config=FetchConfig.PLAYRIGHT,
            m_resoource_block=False,
            m_threat_type=ThreatType.NEWS
        )

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
        all_links = set()

        try:
            selectors = [
                "div.river-well.article h3 a",
                "h3 a[href*='/article/']",
                "a[href*='/cybercrime/']",
                ".content-listing a"
            ]

            for selector in selectors:
                try:
                    elements = page.query_selector_all(selector)
                    if elements:
                        for el in elements[:10]:
                            href = el.get_attribute("href")
                            if href and "/article/" in href:
                                all_links.add(urljoin(self.base_url, href))
                        if all_links:
                            break
                except:
                    continue

            if not all_links:
                fallback_links = page.query_selector_all("a[href]")
                for el in fallback_links:
                    try:
                        href = el.get_attribute("href")
                        if href and "/article/" in href:
                            all_links.add(urljoin(self.base_url, href))
                    except:
                        continue

            for idx, link in enumerate(list(all_links), 1):
                try:
                    page.goto(link, wait_until="commit", timeout=8000)

                    title = "Untitled Article"
                    h1 = page.query_selector("h1")
                    if h1:
                        title = h1.inner_text().strip() or title

                    article_date = datetime.now().date()

                    content_text = "No content found."
                    paragraphs = page.query_selector_all("p")
                    text_blocks = [
                        p.inner_text().strip()
                        for p in paragraphs[:3]
                        if p.inner_text().strip() and len(p.inner_text()) > 20
                    ]
                    if text_blocks:
                        content_text = "\n".join(text_blocks)
                    else:
                        continue

                    summary = "\n".join(content_text.split('\n')[:2])

                    card = leak_model(
                        m_title=title,
                        m_weblink=[link],
                        m_dumplink=[link],
                        m_url=link,
                        m_base_url=self.base_url,
                        m_content=summary,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=f"{title}\n{content_text}",
                        m_content_type=["news"],
                        m_leak_date=article_date,
                    )

                    entity_data = entity_model(
                        m_team="CSO Cybercrime Section",
                        m_country_name="united kingdom",
                    )

                    entity_data = helper_method.extract_entities(summary, entity_data)
                    self.append_leak_data(card, entity_data)

                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                    continue

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR: {ex} [{self.__class__.__name__}]")
