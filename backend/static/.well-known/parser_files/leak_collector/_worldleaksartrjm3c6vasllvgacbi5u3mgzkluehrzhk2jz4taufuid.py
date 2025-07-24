import time

from playwright.sync_api import Page
from abc import ABC
from typing import List
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import datetime


class _worldleaksartrjm3c6vasllvgacbi5u3mgzkluehrzhk2jz4taufuid(leak_extractor_interface, ABC):
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
            cls._instance = super(_worldleaksartrjm3c6vasllvgacbi5u3mgzkluehrzhk2jz4taufuid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://worldleaksartrjm3c6vasllvgacbi5u3mgzkluehrzhk2jz4taufuid.onion/companies/"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "https://worldleaksartrjm3c6vasllvgacbi5u3mgzkluehrzhk2jz4taufuid.onion"

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
        return "https://x.com/share?url=https%3A%2F%2Fworldleaksartrjm3c6vasllvgacbi5u3mgzkluehrzhk2jz4taufuid.onion%2Fcompanies%2F0886726786"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    @staticmethod
    def extract_leak_date(text):
        text = text.strip().lower()
        now = datetime.now()
        if "m" in text or "h" in text:
            return now.date()
        parts = text.split()
        try:
            if len(parts) == 3:
                return datetime.strptime(text, "%d %b %Y").date()
            if len(parts) == 2:
                return datetime.strptime(text + f" {now.year}", "%d %b %Y").date()
        except:
            return None

    def parse_leak_data(self, page: Page):
        page.wait_for_selector('div.search', state='visible', timeout=165000)

        company_list_container = page.query_selector("app-company-list")
        company_wrappers = company_list_container.query_selector_all(".wrapper")

        for wrapper in company_wrappers:
            try:
                wrapper.scroll_into_view_if_needed()
                wrapper.click(force=True)
                time.sleep(0.5)

                full_data_div = page.query_selector("div.wrapper.flex.fullDisclosed")
                if not full_data_div:
                    continue

                title_el = full_data_div.query_selector("div.title .content")
                revenue_el = full_data_div.query_selector("div.meta .item:nth-child(1) .value")
                country_el = full_data_div.query_selector("div.country .title")
                employees_el = full_data_div.query_selector("div.meta .item:nth-child(2) .value")
                country = country_el.inner_text().strip() if country_el else ""
                employees = employees_el.inner_text().strip() if employees_el else ""
                title_name = title_el.inner_text().strip() if title_el else ""
                title_url = page.url
                full_text = full_data_div.inner_text()
                revenue = revenue_el.inner_text().strip() if revenue_el else ""
                desc_el = page.query_selector("div.desc.ng-star-inserted")
                description = desc_el.inner_text().strip() if desc_el else ""
                full_text = description + " " + full_text
                date_el = page.query_selector("span.date.ng-star-inserted")
                date_raw = date_el.inner_text().strip() if date_el else ""
                leak_date = self.extract_leak_date(date_raw)

                card_data = leak_model(
                    m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
                    m_title=title_name,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_content=full_text,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=description,
                    m_dumplink=[title_url],
                    m_content_type=["leaks"],
                    m_revenue=revenue,
                    m_leak_date = leak_date
                )

                entity_data = entity_model(
                    m_company_name=title_name if title_name else None,
                    m_team="hunter",
                    m_employee_count = str(employees),
                    m_country_name = country,
                )
                self.append_leak_data(card_data, entity_data)
            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))




