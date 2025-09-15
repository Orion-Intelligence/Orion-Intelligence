from abc import ABC
from typing import List
from urllib.parse import urlencode

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _business_data_leaks(leak_extractor_interface, ABC):
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
            cls._instance = super(_business_data_leaks, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "https://business-data-leaks.com/"

    @property
    def base_url(self) -> str:
        return "https://business-data-leaks.com/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_timeout=147200, m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://business-data-leaks.com/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        page.wait_for_load_state('networkidle')
        cards = page.locator('div.block_1').all()

        for card in cards:
            company_name = card.locator('table tbody tr:nth-child(1) td:nth-child(2) b').inner_text().strip()

            revenue = card.locator('table tbody tr:nth-child(2) td:nth-child(2)').inner_text().strip()

            form_action = card.locator('table tbody tr:nth-child(4) td:nth-child(2) form').get_attribute('action')
            form_action = '/' + form_action.lstrip('/')


            csrf_token = card.locator(
                'table tbody tr:nth-child(4) td:nth-child(2) form input[name="csrfmiddlewaretoken"]').get_attribute(
                'value') if card.locator(
                'table tbody tr:nth-child(4) td:nth-child(2) form input[name="csrfmiddlewaretoken"]').count() > 0 else ""
            who_value = card.locator(
                'table tbody tr:nth-child(4) td:nth-child(2) form input[name="who"]').get_attribute(
                'value') if card.locator(
                'table tbody tr:nth-child(4) td:nth-child(2) form input[name="who"]').count() > 0 else ""

            query_params = {
                'csrfmiddlewaretoken': csrf_token,
                'who': who_value
            }
            download_href = f"{form_action}?{urlencode(query_params)}" if csrf_token and who_value else form_action

            status = card.locator('table tbody tr:nth-child(3) td:nth-child(2) span.non').inner_text().strip()

            total_downloads = card.locator('table tbody tr:nth-child(5) td:nth-child(2)').inner_text().strip()


            company_info = card.locator(
                'table tbody tr:nth-child(6) td:nth-child(2) p#company_info').inner_text().strip()

            m_content = f"Company: {company_name}\nRevenue: {revenue}\nStatus: {status}\nDownload Link: {download_href}\nTotal Downloads: {total_downloads}\nCompany Info: {company_info}"


            card_data = leak_model(
                m_title=company_name,
                m_url=page.url,
                m_screenshot=helper_method.get_screenshot_base64(page, company_name, self.base_url),
                m_base_url=self.base_url,
                m_content=m_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=company_info,
                m_dumplink=[download_href],
                m_content_type=["leaks"],
                m_revenue=revenue
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_team="business-data-leaks",
            )

            self.append_leak_data(card_data, entity_data)

        self._is_crawled = True
