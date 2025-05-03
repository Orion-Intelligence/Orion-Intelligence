from abc import ABC
from typing import List
from urllib.parse import urlparse

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
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

        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT)

    @property
    def card_data(self) -> List[leak_model]:

        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id.onion/index.php#contact"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

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
            weblink = page.query_selector('card in h h1').inner_text() if page.query_selector('card in h h1') else ""
            description = page.query_selector('card in p').inner_text() if page.query_selector('card in p') else ""
            payment_info = page.query_selector('card.rs in cont p').inner_text() if page.query_selector('card.rs in cont p') else ""

            content = f"{title}: {description} {payment_info}"
            important_content=description

            gallery_images = page.query_selector_all('gallery img')
            images = []
            for img in gallery_images:
                img_src = img.get_attribute('src')
                if img_src:
                    parsed_url = urlparse(img_src)
                    images.append(parsed_url.path.strip())

            download_url = ""
            download_btn = page.query_selector('a.btn[onclick*="showdir"]')
            if download_btn:
                onclick = download_btn.get_attribute('onclick')
                if onclick:
                    start = onclick.find("'") + 1
                    end = onclick.rfind("'")
                    if start != -1 and end != -1:
                        download_url = onclick[start:end].strip()

            is_crawled = self.invoke_db(REDIS_COMMANDS.S_GET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, False)
            ref_html = None
            if not is_crawled:
                ref_html = helper_method.extract_refhtml(weblink)
                if ref_html:
                    self.invoke_db(REDIS_COMMANDS.S_SET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, True)

            card_data = leak_model(
                m_ref_html=ref_html,
                m_screenshot=helper_method.get_screenshot_base64(page,title),
                m_title=title,
                m_url=url,
                m_base_url=self.base_url,
                m_content=content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=important_content,
                m_dumplink=[download_url],
                m_content_type=["leaks"],
                m_logo_or_images=images,
                m_weblink=[weblink],
            )

            entity_data = entity_model(
                m_email_addresses=helper_method.extract_emails(important_content),
                m_company_name=title,
                m_ip=[weblink]
            )

            self.append_leak_data(card_data, entity_data)
