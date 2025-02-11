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


class _mirror_h(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_mirror_h, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "https://mirror-h.org/archive"

    @property
    def base_url(self) -> str:
        return "https://mirror-h.org"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "https://mirror-h.org/contact"

    def safe_find(self, page, selector, attr=None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    def parse_leak_data(self, page: Page):
        try:
            is_crawled = self.invoke_db(REDIS_COMMANDS.S_GET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED, False)
            if is_crawled:
                max_pages = 20
            else:
                max_pages = 500

            current_page = 1

            while current_page <= max_pages:
                full_url = f"{self.seed_url}/page/{current_page}"
                page.goto(full_url)
                page.wait_for_load_state('load')
                page.wait_for_selector("td[style='word-break: break-word;white-space: normal;min-width: 300px;'] a")

                links = page.query_selector_all("td[style='word-break: break-word;white-space: normal;min-width: 300px;'] a")
                collected_links = []
                for link in links:
                    href = link.get_attribute("href")
                    if 'zone' in href:
                        collected_links.append(urljoin(self.base_url, href))

                today_date = datetime.today().strftime('%Y-%m-%d')

                for link in collected_links:
                    page.goto(link)
                    page.wait_for_load_state('load')
                    page.wait_for_selector("table[width='100%']")

                    web_url = self.safe_find(page, "//td[i[contains(@class, 'mdi-web')]]/following-sibling::td/strong/a", "href")
                    location = self.safe_find(page, "//td[i[contains(@class, 'mdi-map-marker')]]/following-sibling::td/strong")
                    server_ip = self.safe_find(page, "//td[i[contains(@class, 'mdi-mapbox')]]/following-sibling::td/strong/a")
                    web_server = self.safe_find(page, "//td[i[contains(@class, 'mdi-server')]]/following-sibling::td/strong/a")
                    attacker = self.safe_find(page, "//td[i[contains(@class, 'mdi-account')]]/following-sibling::td/strong/a")
                    total = self.safe_find(page, "//td[i[contains(@class, 'mdi-clipboard-plus')]]/following-sibling::td/strong")
                    date = self.safe_find(page, "//td[i[contains(@class, 'mdi-calendar')]]/following-sibling::td/strong")
                    report_type = self.safe_find(page, "//td[i[contains(@class, 'mdi-arch')]]/following-sibling::td/strong")

                    iframe = page.query_selector("iframe")
                    if iframe:
                        iframe_content = iframe.content_frame().content()
                        soup = BeautifulSoup(iframe_content, 'html.parser')
                        m_content_container = soup.get_text(separator="\n", strip=True)

                        words = m_content_container.split()
                        if len(words) > 500:
                            m_important_content_container = " ".join(words[:500])
                            m_content_container = " ".join(words[500:])
                        else:
                            m_important_content_container = m_content_container
                            m_content_container = ""
                    else:
                        m_content_container = ""
                        m_important_content_container = ""

                    card_data = card_extraction_model(
                        m_name=report_type,
                        m_title=f"Hacked by {attacker}",
                        m_weblink=[web_url] if web_url else [],
                        m_url=link,
                        m_addresses=[location, server_ip] if location and server_ip else [],
                        m_base_url=self.base_url,
                        m_content=m_content_container,
                        m_websites=[web_server] if web_server else [],
                        m_important_content=m_important_content_container if m_important_content_container else "",
                        m_content_type=["leaks"],
                        m_email_addresses=helper_method.extract_emails(m_content_container),
                        m_phone_numbers=helper_method.extract_phone_numbers(m_content_container),
                        m_leak_date=date
                    )

                    self._card_data.append(card_data)

                current_page += 1

        except Exception as ex:
            print(f"An error occurred: {ex}")

        finally:
            self.invoke_db(REDIS_COMMANDS.S_SET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED, True)