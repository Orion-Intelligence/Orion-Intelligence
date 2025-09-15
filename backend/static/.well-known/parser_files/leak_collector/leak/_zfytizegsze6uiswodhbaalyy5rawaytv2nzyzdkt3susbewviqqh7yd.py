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


class _zfytizegsze6uiswodhbaalyy5rawaytv2nzyzdkt3susbewviqqh7yd(leak_extractor_interface, ABC):
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
            cls._instance = super(_zfytizegsze6uiswodhbaalyy5rawaytv2nzyzdkt3susbewviqqh7yd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://zfytizegsze6uiswodhbaalyy5rawaytv2nzyzdkt3susbewviqqh7yd.onion"


    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://zfytizegsze6uiswodhbaalyy5rawaytv2nzyzdkt3susbewviqqh7yd.onion"

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
        return "http://zfytizegsze6uiswodhbaalyy5rawaytv2nzyzdkt3susbewviqqh7yd.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        page.wait_for_selector("div.client-card",timeout=30000)
        cards = page.query_selector_all("div.client-card")

        for card in cards:
            title = card.query_selector(".client-name").inner_text().strip() if card.query_selector(
                ".client-name") else ""
            img_url = card.query_selector("img.client-logo").get_attribute("src") if card.query_selector(
                "img.client-logo") else ""
            description = card.query_selector(".client-description").inner_text().strip() if card.query_selector(
                ".client-description") else ""

            button = card.query_selector(".client-actions .client-button")
            button_link = ""
            if button:
                onclick_val = button.get_attribute("onclick")
                if onclick_val and "window.location.href=" in onclick_val:
                    button_link = onclick_val.split("window.location.href=")[1].strip(" '\";")

            card_text = f"Title: {title}\nImage: {img_url}\nDescription: {description}\nView Data: {button_link}"
            ref_html = helper_method.extract_refhtml(title, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

            card_data = leak_model(
                m_title=title if title else page.title(),
                m_url=page.url,
                m_base_url=self.base_url,
                m_ref_html=ref_html,
                m_content=card_text,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=card_text,
                m_logo_or_images=[img_url],
                m_dumplink=[button_link] if button_link else [],
                m_content_type=["leaks"],
                m_screenshot=helper_method.get_screenshot_base64(page,title, self.base_url)
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_team="WarLock",
            )

            self.append_leak_data(card_data, entity_data)



