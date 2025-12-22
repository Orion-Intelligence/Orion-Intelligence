from abc import ABC
from typing import List
from urllib.parse import urljoin

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _dcarryhaih5oldidg3tbqwnde4lxljytnpvberrwgj2vlvunopd46dad(leak_extractor_interface, ABC):
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
            cls._instance = super(_dcarryhaih5oldidg3tbqwnde4lxljytnpvberrwgj2vlvunopd46dad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://dcarryhaih5oldidg3tbqwnde4lxljytnpvberrwgj2vlvunopd46dad.onion"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://dcarryhaih5oldidg3tbqwnde4lxljytnpvberrwgj2vlvunopd46dad.onion"

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
        return "http://dcarryhaih5oldidg3tbqwnde4lxljytnpvberrwgj2vlvunopd46dad.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_load_state("networkidle", timeout=60000)
            listing_base = page.url or self.base_url

            page.wait_for_selector("a.icon", timeout=10000)

            anchors = page.query_selector_all("a.icon")
            items = []
            for a in anchors:
                href = (a.get_attribute("href") or "").strip()
                div = a.query_selector("div")
                if div:
                    txt = (div.inner_text() or "").strip()
                else:
                    txt = (a.inner_text() or "").strip()
                name = ""
                for line in txt.splitlines():
                    line = line.strip()
                    if line:
                        name = line
                        break
                if href or name:
                    items.append({"href": href, "name": name})

            for it in items:
                href = (it.get("href") or "").strip()
                name = (it.get("name") or "").strip()
                if not href and not name:
                    continue

                dumplink = urljoin(listing_base, href) if href else listing_base

                card_data = leak_model(
                    m_title=name,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_content="",
                    m_screenshot=helper_method.get_screenshot_base64(page, name, self.base_url),
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content="",
                    m_weblink=[],
                    m_dumplink=[dumplink],
                    m_content_type=["leaks"],
                )

                entity_data = entity_model(
                    m_team="DataCarry",
                    m_scrap_file=self.__class__.__name__, )

                self.append_leak_data(card_data, entity_data)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
