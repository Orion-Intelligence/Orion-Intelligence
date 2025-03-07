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


class _ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad.onion"

    @property
    def base_url(self) -> str:
        return "http://ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad.onion"

    def safe_find(self, page, selector, attr=None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    def parse_leak_data(self, page: Page):
        try:
            current_page = 1
            while True:
                full_url = f"{self.seed_url}/page/{current_page}/"
                page.goto(full_url)
                page.wait_for_load_state('load')
                if not page.query_selector("h2.entry-title.heading-size-1 a"):
                    break

                links = page.query_selector_all("h2.entry-title.heading-size-1 a")
                collected_links = []
                for link in links:
                    href = link.get_attribute("href")
                    full_url = urljoin(self.base_url, href)
                    collected_links.append(full_url)
                print(collected_links)


                for link in collected_links:
                    page.goto(link)
                    page.wait_for_load_state('load')

                    title = self.safe_find(page, "h1.entry-title")
                    content_element = page.query_selector("div.entry-content")
                    content_html = content_element.inner_html() if content_element else ""
                    soup = BeautifulSoup(content_html, 'html.parser')
                    content = soup.get_text(separator="\n", strip=True)

                    image_urls = [img['src'] for img in soup.find_all('img', src=True)]
                    if not image_urls:
                        continue

                    content_words = content.split()
                    if len(content_words) > 500:
                        important_content = ' '.join(content_words[:500])
                    else:
                        important_content = content

                    weblinks = [a['href'] for a in soup.find_all('a', href=True)]

                    card_data = card_extraction_model(
                        m_title=title,
                        m_url=link,
                        m_weblink=weblinks,
                        m_base_url=self.base_url,
                        m_content=content,
                        m_logo_or_images=image_urls,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=important_content,
                        m_content_type=["leaks"],
                        m_email_addresses=helper_method.extract_emails(content),
                        m_phone_numbers=helper_method.extract_phone_numbers(content),

                    )

                    self._card_data.append(card_data)

                current_page += 1

        except Exception as ex:
            print(f"An error occurred: {ex}")