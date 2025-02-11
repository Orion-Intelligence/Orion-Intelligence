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


class _handala_hack(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_handala_hack, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "https://handala-hack.to"

    @property
    def base_url(self) -> str:
        return "https://handala-hack.to"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "https://t.me/Handala_hack"

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
                if not page.query_selector("h2.wp-block-post-title a"):
                    break

                links = page.query_selector_all("h2.wp-block-post-title a")
                collected_links = []
                for link in links:
                    href = link.get_attribute("href")
                    full_url = urljoin(self.base_url, href)
                    collected_links.append(full_url)

                today_date = datetime.today().strftime('%Y-%m-%d')

                for link in collected_links:
                    page.goto(link)
                    page.wait_for_load_state('load')

                    title = self.safe_find(page, "h1.wp-block-post-title.has-x-large-font-size")
                    date_time = self.safe_find(page, "div.wp-block-post-date time", "datetime")
                    content_element = page.query_selector("div.entry-content.wp-block-post-content.has-global-padding.is-layout-constrained.wp-block-post-content-is-layout-constrained")
                    content_html = content_element.inner_html() if content_element else ""
                    soup = BeautifulSoup(content_html, 'html.parser')
                    content = soup.get_text(separator="\n", strip=True)

                    image_urls = [img['src'] for img in soup.find_all('img')]

                    content_words = content.split()
                    if len(content_words) > 500:
                        important_content = ' '.join(content_words[:500])
                    else:
                        important_content = content

                    dump_links = []
                    external_links = []
                    for a in soup.find_all('a', href=True):
                        if 'class' in a.attrs and 'link link--external' in a['class']:
                            external_links.append(a['href'])
                        else:
                            dump_links.append(a['href'])

                    card_data = card_extraction_model(
                        m_title=title,
                        m_weblink=external_links,
                        m_dumplink=dump_links,
                        m_url=link,
                        m_base_url=self.base_url,
                        m_content=content,
                        m_logo_or_images=image_urls,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=important_content,
                        m_content_type=["leaks"],
                        m_email_addresses=helper_method.extract_emails(content),
                        m_phone_numbers=helper_method.extract_phone_numbers(content),
                        m_leak_date=date_time
                    )

                    self._card_data.append(card_data)

                current_page += 1

        except Exception as ex:
            print(f"An error occurred: {ex}")