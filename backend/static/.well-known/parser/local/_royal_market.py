from abc import ABC
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from urllib.parse import urljoin

from crawler.crawler_services.shared.helper_method import helper_method


class _royal_market(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_royal_market, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "https://tor.link/site/royal-market/info"

    @property
    def base_url(self) -> str:
        return "https://tor.link"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "https://tor.link/contact"

    def safe_find(self, page, selector, attr=None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    def parse_leak_data(self, page: Page):
        try:
            page.goto(self.seed_url)
            page.wait_for_load_state('load')


            page_html = page.content()
            self.soup = BeautifulSoup(page_html, 'html.parser')


            list_items = self.soup.select("ul.mainrow.col-md-12")
            if not list_items:

                return



            for item in list_items:

                link_element = item.select_one("a.miniurl.downhead-head")
                item_url = link_element.get('href') if link_element else None
                if item_url and not item_url.startswith(('http://', 'https://')):
                    item_url = urljoin(self.base_url, item_url)


                title_element = item.select_one("h2.downhead-head")
                title = title_element.get_text(strip=True) if title_element else None


                desc_element = item.select_one("p.downhead-desc.inline-desc")
                description = desc_element.get_text(strip=True) if desc_element else None


                card_data = card_extraction_model(
                    m_company_name=title,
                    m_title=title,
                    m_url=item_url,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_base_url=self.base_url,
                    m_content=description,
                    m_important_content=description,
                    m_content_type=["leaks"],
                    m_email_addresses=helper_method.extract_emails(description) if description else [],
                    m_phone_numbers=helper_method.extract_phone_numbers(description) if description else [],

                )

                self._card_data.append(card_data)

        except Exception as ex:
            print(f"An error occurred: {ex}")