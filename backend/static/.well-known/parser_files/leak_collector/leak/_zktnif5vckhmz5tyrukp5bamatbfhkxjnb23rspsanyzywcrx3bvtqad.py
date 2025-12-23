from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _zktnif5vckhmz5tyrukp5bamatbfhkxjnb23rspsanyzywcrx3bvtqad(leak_extractor_interface, ABC):
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
            cls._instance = super(_zktnif5vckhmz5tyrukp5bamatbfhkxjnb23rspsanyzywcrx3bvtqad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://zktnif5vckhmz5tyrukp5bamatbfhkxjnb23rspsanyzywcrx3bvtqad.onion"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://zktnif5vckhmz5tyrukp5bamatbfhkxjnb23rspsanyzywcrx3bvtqad.onion"

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
        return "http://zktnif5vckhmz5tyrukp5bamatbfhkxjnb23rspsanyzywcrx3bvtqad.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def extract_till_com(self, title: str) -> str:
        title = title.lower()

        if ".com" in title:
            extracted = title[: title.index(".com") + 4]
            if not extracted.startswith(("http://", "https://")):
                extracted = "https://" + extracted
            return extracted

        if title.endswith(".zip"):
            extracted = title.replace(".zip", ".com")
            if not extracted.startswith(("http://", "https://")):
                extracted = "https://" + extracted
            return extracted

        return title

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_load_state("networkidle", timeout=60000)

            links = page.query_selector_all("a.download-link")

            for link in links:
                title = (link.inner_text() or "").strip()

                if not title:
                    continue

                dumplinks = []
                href = link.get_attribute("href")
                if href:
                    dumplinks.append(href.strip())
                titlex = self.extract_till_com(title)
                ref_html = helper_method.extract_refhtml(titlex, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS,page)

                card_data = leak_model(
                    m_title=title,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_content="",
                    m_ref_html=ref_html,
                    m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content="",
                    m_dumplink=dumplinks,
                    m_content_type=["leaks"]
                )

                entity = entity_model(
                    m_team="BRAIN CIPHER",
                    m_scrap_file = self.__class__.__name__,
                )

                self.append_leak_data(card_data, entity)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} {self.__class__.__name__}")
