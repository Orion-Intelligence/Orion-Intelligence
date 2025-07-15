from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _ransomed(leak_extractor_interface, ABC):
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
            cls._instance = super(_ransomed, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://ransomed.biz/"

    @property
    def base_url(self) -> str:
        return "https://ransomed.biz/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://ransomed.biz/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        page.wait_for_load_state('networkidle',timeout=30000)
        cards = page.locator('div.card').all()

        for card in cards:
            company_header = card.locator('div.company-header').inner_text().strip() if card.locator(
                'div.company-header').count() > 0 else ""

            revenue = card.locator('div.revenue').inner_text().strip() if card.locator(
                'div.revenue').count() > 0 else ""

            description = card.locator('div.victim-details').inner_text().strip() if card.locator(
                'div.victim-details').count() > 0 else ""

            ransom_amount = card.locator('div.ransom-amount').inner_text().strip() if card.locator(
                'div.ransom-amount').count() > 0 else ""


            m_content = f"Company: {company_header}\nRevenue: {revenue}\nDescription: {description}\nRansom Amount: {ransom_amount}"

            card_data = leak_model(
                m_title=company_header,
                m_url=page.url,
                m_screenshot=helper_method.get_screenshot_base64(page, company_header, self.base_url),
                m_base_url=self.base_url,
                m_content=m_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=description,
                m_weblink=[company_header],
                m_content_type=["leaks"],
                m_revenue=revenue
            )

            entity_data = entity_model(
                m_team="RansomedVC",
            )

            self.append_leak_data(card_data, entity_data)

        self._is_crawled = True
