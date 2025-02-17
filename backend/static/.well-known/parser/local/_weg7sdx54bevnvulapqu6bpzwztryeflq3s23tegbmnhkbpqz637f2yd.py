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

class _weg7sdx54bevnvulapqu6bpzwztryeflq3s23tegbmnhkbpqz637f2yd(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_weg7sdx54bevnvulapqu6bpzwztryeflq3s23tegbmnhkbpqz637f2yd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://weg7sdx54bevnvulapqu6bpzwztryeflq3s23tegbmnhkbpqz637f2yd.onion"

    @property
    def base_url(self) -> str:
        return "http://weg7sdx54bevnvulapqu6bpzwztryeflq3s23tegbmnhkbpqz637f2yd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config = FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command:REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://weg7sdx54bevnvulapqu6bpzwztryeflq3s23tegbmnhkbpqz637f2yd.onion/?contact"

    def parse_leak_data(self, page:Page ):

        pagination_links = self.soup.select("div.pagination a")
        page_urls = [urljoin(self.seed_url, link['href']) for link in pagination_links]

        for page_url in page_urls:
            page.goto(page_url, wait_until="networkidle")
            self.soup = BeautifulSoup(page.content(), 'html.parser')

            cards = self.soup.find_all(class_="card")
            for card in cards:
                title = card.find(class_="title")
                text_elements = card.find_all(class_="text")
                link_elements = card.find_all(class_="links")

                title_text = helper_method.clean_text(title.get_text(strip=True)) if title else ""
                content = ' '.join(helper_method.clean_text(text.get_text(strip=True)) for text in text_elements if text)
                weblinks = [urljoin(self.base_url, title.a['href'])] if title and title.a else []
                dumplinks = [urljoin(self.base_url, link.a['href']) for link in link_elements if link and link.a]

                card_data = card_extraction_model(
                    m_title=title_text,
                    m_url=page_url,
                    m_base_url=self.base_url,
                    m_content=content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=content,
                    m_weblink=weblinks,
                    m_dumplink=dumplinks,
                    m_email_addresses= helper_method.extract_emails(content),
                    m_phone_numbers= helper_method.extract_phone_numbers(content),
                    m_content_type=["leaks"]
                )
                self._card_data.append(card_data)
