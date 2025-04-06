from abc import ABC

from typing import List

from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _csidb(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_csidb, cls).__new__(cls)
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "https://www.csidb.net/csidb/actors/88d6ccdf-1758-4014-b7ff-bfdffb7c2c1e/"

    @property
    def base_url(self) -> str:
        return "https://www.csidb.net"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value):
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return self.base_url

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            self.callback()

    @staticmethod
    def safe_find(page, selector, attr=None):

        try:
            element = page.locator(selector).first
            if element.count() > 0:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    def parse_leak_data(self, page: Page):
        try:
            page.goto(self.seed_url)
            page.wait_for_load_state('load')

            page_html = page.content()
            soup = BeautifulSoup(page_html, 'html.parser')


            incident_rows = soup.select("tbody tr.text-nowrap")
            if not incident_rows:
                print("No incident data found on the page.")
                return

            for row in incident_rows:

                date_cell = row.select_one("td:nth-child(1) a")
                incident_date = date_cell.get_text(strip=True) if date_cell else None
                incident_date = helper_method.extract_and_convert_date(incident_date)


                victim_cell = row.select_one("td:nth-child(2) a")
                victim_name = victim_cell.get_text(strip=True) if victim_cell else None


                location_cell = row.select_one("td:nth-child(3) div div")
                location = location_cell.get_text(strip=True) if location_cell else None


                summary_cell = row.select_one("td.text-wrap.d-none.d-md-inline-block")
                summary = summary_cell.get_text(strip=True) if summary_cell else None

                if summary:
                    words = summary.split()
                    if len(words) > 500:
                        important_content = " ".join(words[:500])
                    else:
                        important_content = summary
                else:
                    important_content = ""

                card_data = leak_model(
                    m_screenshot=helper_method.get_screenshot_base64(page, victim_name),
                    m_title=victim_name,
                    m_url=self.seed_url,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_base_url=self.base_url,
                    m_content=summary,
                    m_important_content=important_content,
                    m_content_type=["hacking"],
                    m_leak_date=incident_date,
                )

                entity_data = entity_model(
                    m_email_addresses=helper_method.extract_emails(summary),
                    m_phone_numbers=helper_method.extract_phone_numbers(summary),
                    m_company_name=victim_name,
                    m_country_name=location
                )

                self.append_leak_data(card_data, entity_data)


        except Exception as ex:
            print(f"An error occurred: {ex}")

