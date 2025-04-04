from abc import ABC
from typing import List
import time
from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _basheqtvzqwz4vp6ks5lm2ocq7i6tozqgf6vjcasj4ezmsy4bkpshhyd(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_basheqtvzqwz4vp6ks5lm2ocq7i6tozqgf6vjcasj4ezmsy4bkpshhyd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:

        return "http://basheqtvzqwz4vp6ks5lm2ocq7i6tozqgf6vjcasj4ezmsy4bkpshhyd.onion/"

    @property
    def base_url(self) -> str:

        return "http://basheqtvzqwz4vp6ks5lm2ocq7i6tozqgf6vjcasj4ezmsy4bkpshhyd.onion/"

    @property
    def rule_config(self) -> RuleModel:

        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[leak_model]:

        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:

        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://basheqtvzqwz4vp6ks5lm2ocq7i6tozqgf6vjcasj4ezmsy4bkpshhyd.onion/contact_us.php"

    def append_leak_data(self, leak: leak_model) -> None:
        self._card_data.append(leak)
        if self.callback:
            self.callback()

    def parse_leak_data(self, page: Page):
        page.wait_for_selector('.main__contant')

        card_elements = page.query_selector_all('.segment.published')
        card_urls = [card.get_attribute('onclick').split("window.location.href='")[1].split("'")[0] for card in
                     card_elements]

        for card_url in card_urls:
            page.goto(self.base_url + card_url)
            page.wait_for_selector('.main__contant')

            time.sleep(2)

            title_element = page.query_selector('.offer__text')
            title = title_element.inner_text().strip() if title_element else "N/A"

            deadline_element = page.query_selector('.deadline:first-of-type')
            deadline = deadline_element.inner_text().replace("Deadline: ", "").strip() if deadline_element else "N/A"
            deadline = helper_method.extract_and_convert_date(deadline)
            country_element = page.query_selector('.count__text')
            country = country_element.inner_text().strip() if country_element else "N/A"

            description_element = page.query_selector('.dsc__text')
            description = description_element.inner_text().strip() if description_element else "N/A"

            image_urls = []
            images = page.query_selector_all('img')
            for img in images:
                src = img.get_attribute('src')
                if src:
                    full_src = self.base_url + src if not src.startswith('http') else src
                    image_urls.append(full_src)

            dumps = []
            links = page.query_selector_all('a')
            for link in links:
                div_element = link.query_selector('.segment__block__small.published.download')
                if div_element:
                    href = link.get_attribute('href')
                    if href:
                        dumps.append(href)

            web_link = []
            links = page.query_selector_all('a')
            for link in links:
                div_element = link.query_selector('.segment__block.active.download')
                if div_element:
                    href = link.get_attribute('href')
                    if href:
                        full_href = self.base_url + href if not href.startswith('http') else href
                        web_link.append(full_href)

            card_data = leak_model(
                m_screenshot=helper_method.get_screenshot_base64(page, title),
                m_title=title,
                m_url=page.url,
                m_base_url=self.base_url,
                m_content=description,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=description,
                m_dumplink=dumps,
                m_weblink=web_link,
                m_leak_date=deadline,
                m_logo_or_images=image_urls,
                m_country_name=country,
                m_email_addresses=helper_method.extract_emails(description),
                m_phone_numbers=helper_method.extract_phone_numbers(description),
                m_content_type=["leaks"],
            )

            self.append_leak_data(card_data)