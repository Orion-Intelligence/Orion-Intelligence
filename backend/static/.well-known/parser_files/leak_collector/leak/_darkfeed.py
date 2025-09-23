from abc import ABC
from typing import List

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _darkfeed(leak_extractor_interface, ABC):
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
            cls._instance = super(_darkfeed, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "https://darkfeed.io/threat-intelligence/"

    @property
    def base_url(self) -> str:
        return "https://darkfeed.io"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://darkfeed.io/aboutus/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            error_count = 0

            articles = page.query_selector_all("article.elementor-post")

            for article in articles:
                try:
                    title_link_el = article.query_selector("h3.elementor-post__title a")
                    url = title_link_el.get_attribute("href") if title_link_el else None
                    title = title_link_el.text_content().strip() if title_link_el else None

                    date_el = article.query_selector("span.elementor-post-date")
                    posted_date = date_el.text_content().strip() if date_el else None

                    if url and title and posted_date:
                        content_message = f"{title}, To visit or explore more visit the website: {url}"

                        card_data = leak_model(
                            m_title=title,
                            m_screenshot="",
                            m_url=url,
                            m_base_url=self.base_url,
                            m_content=content_message + " " + self.base_url + " " + url,
                            m_network=helper_method.get_network_type(self.base_url),
                            m_important_content=content_message,
                            m_content_type=["leaks"],
                        )

                        entity_data = entity_model(
                            m_scrap_file=self.__class__.__name__,
                            m_team="dark feed"
                        )

                        self.append_leak_data(card_data, entity_data)
                        error_count = 0

                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                    error_count += 1
                    if error_count >= 3:
                        break

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            raise
