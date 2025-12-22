import re
from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from crawler.crawler_services.log_manager.log_controller import log


class _warlockhga5iw3t54ps5iytlilf7hlvxy7kwrkidspn4qoh64s4vsuyd(leak_extractor_interface, ABC):
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
            cls._instance = super(_warlockhga5iw3t54ps5iytlilf7hlvxy7kwrkidspn4qoh64s4vsuyd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://warlockhga5iw3t54ps5iytlilf7hlvxy7kwrkidspn4qoh64s4vsuyd.onion"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://warlockhga5iw3t54ps5iytlilf7hlvxy7kwrkidspn4qoh64s4vsuyd.onion"

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
        return "http://warlockhga5iw3t54ps5iytlilf7hlvxy7kwrkidspn4qoh64s4vsuyd.onion"

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

            cards = page.query_selector_all("div.client-card")

            for card in cards:
                title_el = card.query_selector("h2.client-name")
                title = (title_el.inner_text() or "").strip() if title_el else ""

                if not title:
                    continue

                content = ""
                desc_el = card.query_selector("p.client-description")
                if desc_el:
                    desc_text = (desc_el.inner_text() or "").strip()
                    if desc_text and desc_text != "No description provided.":
                        content = desc_text

                dumplinks = []
                button = card.query_selector("button.client-button")
                if button:
                    is_disabled = button.get_attribute("disabled")
                    if not is_disabled:
                        onclick = button.get_attribute("onclick") or ""
                        match = re.search(r"window\.location\.href='([^']+)'", onclick)
                        if match:
                            detail_url = match.group(1)
                            dumplinks.append(detail_url)
                ref_html = helper_method.extract_refhtml(title, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                card_data = leak_model(
                    m_title=title,
                    m_ref_html=ref_html,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_content=content,
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=content[:500],
                    m_dumplink=dumplinks if dumplinks else [],
                    m_content_type=["leaks"]
                )

                entity = entity_model(
                    m_team="WarLock",
                    m_scrap_file=self.__class__.__name__,
                )

                self.append_leak_data(card_data, entity)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} {self.__class__.__name__}")
