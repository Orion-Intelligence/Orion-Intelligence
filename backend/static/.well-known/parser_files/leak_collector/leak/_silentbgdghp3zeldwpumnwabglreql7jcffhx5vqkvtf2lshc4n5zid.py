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


class _silentbgdghp3zeldwpumnwabglreql7jcffhx5vqkvtf2lshc4n5zid(leak_extractor_interface, ABC):
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
            cls._instance = super(_silentbgdghp3zeldwpumnwabglreql7jcffhx5vqkvtf2lshc4n5zid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://silentbgdghp3zeldwpumnwabglreql7jcffhx5vqkvtf2lshc4n5zid.onion/"

    @property
    def base_url(self) -> str:
        return "http://silentbgdghp3zeldwpumnwabglreql7jcffhx5vqkvtf2lshc4n5zid.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_timeout = 17200, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://silentbgdghp3zeldwpumnwabglreql7jcffhx5vqkvtf2lshc4n5zid.onion/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state("networkidle")

        cards = page.query_selector_all('div._companieInfoCard_48fxr_1')

        for card in cards:
            title_el = card.query_selector('div._companyName_48fxr_51')
            title = title_el.text_content().strip() if title_el else None

            country_el = card.query_selector('span._countryName_48fxr_223')
            country_name = country_el.text_content().strip() if country_el else None

            link_el = card.query_selector('a._productLink_48fxr_147')
            custom_link = link_el.get_attribute('href') if link_el else None

            info_cards = card.query_selector_all('div._companyCardInfo_48fxr_63')

            revenue = None
            employees = None
            disclosures = None

            for info in info_cards:
                spans = info.query_selector_all('span')
                if len(spans) >= 2:
                    label = spans[0].text_content().strip()
                    value = spans[1].text_content().strip()

                    if label == "Revenue":
                        revenue = value
                    elif label == "Employees":
                        employees = value
                    elif label == "Disclosures":
                        disclosures = value

            m_content = f"Title: {title}, Country: {country_name}, Revenue: {revenue}, Employees: {employees}, Disclosures: {disclosures}"

            ref_html = helper_method.extract_refhtml(custom_link, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

            card_data = leak_model(
                m_ref_html=ref_html,
                m_title=title,
                m_url=page.url,
                m_base_url=self.base_url,
                m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                m_content=m_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=m_content,
                m_weblink=[custom_link],
                m_dumplink=[page.url],
                m_content_type=["leaks"],
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_team="Silent Blog"
            )

            self.append_leak_data(card_data, entity_data)

