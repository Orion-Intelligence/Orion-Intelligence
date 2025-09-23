from abc import ABC
from typing import List
import re
from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _intelrepository(leak_extractor_interface, ABC):
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
            cls._instance = super(_intelrepository, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "https://intelrepository.com/"

    @property
    def base_url(self) -> str:
        return "https://intelrepository.com/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "spectre05@keemail.me"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        leaks_header = page.locator('#test1-header')
        leaks_content = page.locator('#test1-content')

        if not leaks_content.is_visible():
            leaks_header.click()
            page.wait_for_timeout(1000)

        leak_entries = page.locator('#test1-content .accordion_child > h3')

        for i in range(leak_entries.count()):
            title = leak_entries.nth(i).inner_text().strip()

            description_element = leak_entries.nth(i).locator('xpath=following-sibling::p[1]')
            description = description_element.inner_text().strip()

            download_links = []
            url_pattern = r'https?://[^\s<>"\']+'
            urls = re.findall(url_pattern, description)
            for url in urls:
                cleaned_url = url.rstrip('.,;')
                if cleaned_url:
                    download_links.append(cleaned_url)

            card_data = leak_model(
                m_title=title,
                m_url=page.url,
                m_base_url=self.base_url,
                m_screenshot=helper_method.get_screenshot_base64(page,title,self.base_url),
                m_content=description,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=description[:500],
                m_dumplink=download_links,
                m_content_type=["leaks"],
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_team="intel repository"
            )

            self.append_leak_data(card_data, entity_data)
