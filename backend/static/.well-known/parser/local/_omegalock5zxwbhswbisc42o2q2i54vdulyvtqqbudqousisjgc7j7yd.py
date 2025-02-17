from abc import ABC
from typing import List
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method

class _omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd.onion/"

    @property
    def base_url(self) -> str:
        return "http://omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd.onion"

    def parse_leak_data(self, page: Page):
        datatable = self.soup.find("table", class_="datatable")
        if not datatable:
            print("No datatable found.")
            return

        rows = datatable.find_all("tr")
        page_urls = [
            urljoin(self.seed_url, link["href"])
            for row in rows
            for link in row.find_all("a", href=True)
        ]

        for page_url in page_urls:
            try:
                page.goto(page_url, wait_until="networkidle")
                self.soup = BeautifulSoup(page.content(), "html.parser")

                title_element = self.soup.find(class_="theading")
                title_text = helper_method.clean_text(title_element.get_text(strip=True)) if title_element else ""

                tstat_element = self.soup.find(class_="tstat")
                content = helper_method.clean_text(tstat_element.get_text(strip=True)) if tstat_element else ""
                important_content = content

                tdownload_table = self.soup.find("table", class_="tdownload")
                dump_links = []
                if tdownload_table:
                    dump_links = [
                        urljoin(self.base_url, link["href"])
                        for link in tdownload_table.find_all("a", href=True)
                    ]

                card_data = card_extraction_model(
                    m_title=title_text,
                    m_url=page_url,
                    m_base_url=self.base_url,
                    m_content=content,
                    m_network=helper_method.get_network_type(self.base_url).value,
                    m_important_content=important_content,
                    m_weblink=[page_url],
                    m_dumplink=dump_links,
                    m_email_addresses=helper_method.extract_emails(content),
                    m_phone_numbers=helper_method.extract_phone_numbers(content),
                    m_content_type=["leaks"],
                )

                self._card_data.append(card_data)

            except Exception as e:
                print(f"Error processing {page_url}: {e}")
