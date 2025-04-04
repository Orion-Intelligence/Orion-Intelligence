from abc import ABC
from typing import List
from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _vkvsgl7lhipjirmz6j5ubp3w3bwvxgcdbpi3fsbqngfynetqtw4w5hyd(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):

        if cls._instance is None:
            cls._instance = super(_vkvsgl7lhipjirmz6j5ubp3w3bwvxgcdbpi3fsbqngfynetqtw4w5hyd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:

        return "http://vkvsgl7lhipjirmz6j5ubp3w3bwvxgcdbpi3fsbqngfynetqtw4w5hyd.onion/"

    @property
    def base_url(self) -> str:

        return "http://vkvsgl7lhipjirmz6j5ubp3w3bwvxgcdbpi3fsbqngfynetqtw4w5hyd.onion/"

    @property
    def rule_config(self) -> RuleModel:

        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[leak_model]:

        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:

        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "https://www.iana.org/help/example-domains"

    def append_leak_data(self, leak: leak_model) -> None:
        self._card_data.append(leak)
        if self.callback:
            self.callback()

    def parse_leak_data(self, page: Page):
        title_elements = page.query_selector_all('div.card-body.p-3.pt-2 a.h5')
        title_urls_list = [element.get_attribute('href') for element in title_elements]

        print(title_urls_list)
        for link_url in title_urls_list:
            page.goto(link_url)

            content_element = page.query_selector('.card-body.ql-editor')
            m_content = content_element.inner_text().strip() if content_element else ""

            first_paragraph = m_content.split("\n")[0].strip() if m_content else "Untitled"


            link_elements = page.query_selector_all('a[href]')
            web_links = [a.get_attribute('href') for a in link_elements]

            self.append_leak_data(leak_model(
                m_screenshot=helper_method.get_screenshot_base64(page, first_paragraph),
                m_title=first_paragraph,
                m_url=page.url,
                m_base_url=self.base_url,
                m_content=m_content,
                m_important_content=m_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_weblink=web_links,
                m_dumplink=[],
                m_email_addresses=helper_method.extract_emails(m_content),
                m_phone_numbers=helper_method.extract_phone_numbers(m_content),
                m_content_type=["leaks"],
            ))
