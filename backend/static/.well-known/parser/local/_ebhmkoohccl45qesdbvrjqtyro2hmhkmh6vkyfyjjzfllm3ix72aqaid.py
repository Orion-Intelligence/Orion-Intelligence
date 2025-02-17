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


class _ebhmkoohccl45qesdbvrjqtyro2hmhkmh6vkyfyjjzfllm3ix72aqaid(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_ebhmkoohccl45qesdbvrjqtyro2hmhkmh6vkyfyjjzfllm3ix72aqaid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://ebhmkoohccl45qesdbvrjqtyro2hmhkmh6vkyfyjjzfllm3ix72aqaid.onion/leaks.php"

    @property
    def base_url(self) -> str:
        return "http://ebhmkoohccl45qesdbvrjqtyro2hmhkmh6vkyfyjjzfllm3ix72aqaid.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://ebhmkoohccl45qesdbvrjqtyro2hmhkmh6vkyfyjjzfllm3ix72aqaid.onion/chat.php"

    def safe_find(self, page, selector, attr=None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    def parse_leak_data(self, page: Page):
        try:
            full_url = self.seed_url
            page.goto(full_url)
            page.wait_for_load_state('load')
            page.wait_for_selector("div.advert_col")


            advert_blocks = page.query_selector_all("div.advert_col")
            for block in advert_blocks:
                soup = BeautifulSoup(block.inner_html(), 'html.parser')

                title = soup.select_one('div.advert_info_title').text.strip()

                content = soup.select_one('div.advert_info_p').get_text(separator="\n", strip=True)

                web_url_element = soup.select_one('div.advert_info_p a')
                web_url = web_url_element['href'] if web_url_element else None

                size = ""
                files = ""
                folders = ""
                for info_code in soup.select('div.advert_info_code span'):
                    info_text = info_code.text.strip()
                    if "Size:" in info_text:
                        size = info_text.replace("Size:", "").strip()
                    elif "Files:" in info_text:
                        files = info_text.replace("Files:", "").strip()
                    elif "Folders:" in info_text:
                        folders = info_text.replace("Folders:", "").strip()

                data_size = f"Size: {size}, Files: {files}, Folders: {folders}"

                image_urls = []
                for img in soup.select('div.advert_imgs_block img'):
                    img_src = img.get('src')
                    full_img_url = urljoin(self.base_url, img_src)
                    image_urls.append(full_img_url)

                actual_data_link_element = soup.select_one('div.advert_action a')
                actual_data_link = actual_data_link_element['href'] if actual_data_link_element else None

                card_data = card_extraction_model(
                    m_title=f"Leak of {title}",
                m_weblink=[web_url] if web_url else [],
                    m_url=full_url,
                    m_base_url=self.base_url,
                    m_dumplink=actual_data_link,
                    m_content=content,
                    m_important_content=content,
                    m_logo_or_images=image_urls,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_content_type=["leaks"],
                    m_data_size=data_size,
                    m_email_addresses=helper_method.extract_emails(content),
                    m_phone_numbers=helper_method.extract_phone_numbers(content),
                )

                self._card_data.append(card_data)

        except Exception as ex:
            print(f"An error occurred: {ex}")