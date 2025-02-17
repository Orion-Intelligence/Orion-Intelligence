from abc import ABC
from datetime import datetime
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


class _orca66hwnpciepupe5626k2ib6dds6zizjwuuashz67usjps2wehz4id(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_orca66hwnpciepupe5626k2ib6dds6zizjwuuashz67usjps2wehz4id, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://orca66hwnpciepupe5626k2ib6dds6zizjwuuashz67usjps2wehz4id.onion"

    @property
    def base_url(self) -> str:
        return "http://orca66hwnpciepupe5626k2ib6dds6zizjwuuashz67usjps2wehz4id.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://orca66hwnpciepupe5626k2ib6dds6zizjwuuashz67usjps2wehz4id.onion"

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


            card_links = page.query_selector_all("a.blog__card-btn.--button")
            if not card_links:
                print("No card links found on the page.")
                return

            today_date = datetime.today().strftime('%Y-%m-%d')


            card_urls = [urljoin(self.base_url, link.get_attribute("href")) for link in card_links]


            for card_url in card_urls:

                page.goto(card_url)
                page.wait_for_load_state('load')


                page_html = page.content()
                self.soup = BeautifulSoup(page_html, 'html.parser')


                card_inner = self.soup.select_one("div.card__inner")
                if not card_inner:
                    print(f"No card inner found on the page: {card_url}")
                    continue


                description = self.safe_find(page, "div.card__description-content", attr=None)
                company_url = self.safe_find(page, "a.card__info-text.--card__info-text-link", attr="href")
                download_url = self.safe_find(page, "a.card__download.--button", attr="href")
                image_urls = [urljoin(self.base_url, img['src']) for img in card_inner.select("img.card__photos-img")]
                card_title = self.safe_find(page, "h1.card__title", attr=None)


                number_of_files = None
                file_size = None
                date_of_publication = None


                info_items = card_inner.select("div.card__info-item")
                for item in info_items:
                    title = item.select_one("h2.card__info-item-title.--small-title")
                    if title:
                        title_text = title.get_text(strip=True)
                        value = item.select_one("div.card__info-text")
                        if value:
                            value_text = value.get_text(strip=True)
                            if title_text == "Number of files":
                                number_of_files = value_text
                            elif title_text == "Files size":
                                file_size = value_text
                            elif title_text == "Date of publication":
                                date_of_publication = value_text


                card_data = card_extraction_model(
                    m_company_name=card_title,
                    m_title=card_title,
                    m_url=self.base_url,
                    m_weblink=[company_url] if company_url else [],
                    m_dumplink=download_url,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_base_url=self.base_url,
                    m_content=description,
                    m_important_content = description,
                    m_logo_or_images=image_urls,
                    m_content_type=["leaks"],
                    m_data_size=number_of_files,
                    m_email_addresses=helper_method.extract_emails(description) if description else [],
                    m_phone_numbers=helper_method.extract_phone_numbers(description) if description else [],
                    m_leak_date=date_of_publication,
                )


                self._card_data.append(card_data)

        except Exception as ex:
            print(f"An error occurred: {ex}")