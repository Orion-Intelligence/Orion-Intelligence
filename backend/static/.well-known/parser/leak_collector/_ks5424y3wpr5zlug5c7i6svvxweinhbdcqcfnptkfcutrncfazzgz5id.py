from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id(leak_extractor_interface, ABC):
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
            cls._instance = super(_ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:

        return "http://ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id.onion/posts.php?pid=kjR1jYcN0m8P5Il0SbJ6hvDm"

    @property
    def base_url(self) -> str:

        return "http://ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id.onion"

    @property
    def rule_config(self) -> RuleModel:

        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[leak_model]:

        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value):

        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id.onion/index.php#contact"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            self.callback()

    def parse_leak_data(self, page: Page):
        links = page.query_selector_all('a[post]')
        link_urls = []
        for link in links:
            href = link.get_attribute('href')
            if href:
                full_url = f"{self.base_url}/posts.php{href}"
                link_urls.append(full_url)

        for url in link_urls:
            page.goto(url)

            title = page.query_selector('st').inner_text() if page.query_selector('st') else ""
            card_title = page.query_selector('card in h h1').inner_text() if page.query_selector('card in h h1') else ""
            description = page.query_selector('card in p').inner_text() if page.query_selector('card in p') else ""
            payment_title = page.query_selector('card.rs h2').inner_text() if page.query_selector('card.rs h2') else ""
            payment_info = page.query_selector('card.rs in cont p').inner_text() if page.query_selector('card.rs in cont p') else ""

            description = f"{card_title}: {description}" if card_title and description else description
            payment_info = f"{payment_title}: {payment_info}" if payment_title and payment_info else payment_info

            content = f"{description}{payment_info}"
            words = content.split()
            if len(words) > 500:
                important_content = ' '.join(words[:500])
            else:
                important_content = content


            gallery_images = page.query_selector_all('gallery img')
            images = [img.get_attribute('src').strip() for img in gallery_images if
                      img.get_attribute('src') and img.get_attribute('src').endswith('.png')]

            download_url = ""
            download_btn = page.query_selector('a.btn[onclick*="showdir"]')
            if download_btn:
                onclick = download_btn.get_attribute('onclick')
                if onclick:
                    start = onclick.find("'") + 1
                    end = onclick.rfind("'")
                    if start != -1 and end != -1:
                        download_url = onclick[start:end].strip()
                        if not download_url.startswith('http'):
                            download_url = f"http://{download_url}"

            card_data = leak_model(
                m_screenshot=helper_method.get_screenshot_base64(page, title),
                m_title=title,
                m_url=url,
                m_base_url=self.base_url,
                m_content=content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=important_content,
                m_dumplink=[download_url],
                m_content_type=["leaks"],
                m_logo_or_images=images,
            )

            entity_data = entity_model(
                m_email_addresses=helper_method.extract_emails(content),
                m_phone_numbers=helper_method.extract_phone_numbers(content),
            )

            self.append_leak_data(card_data, entity_data)
