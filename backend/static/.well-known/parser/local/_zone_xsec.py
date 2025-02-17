from abc import ABC
from datetime import datetime
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page, TimeoutError
from urllib.parse import urljoin

from crawler.crawler_instance.local_interface_model.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _zone_xsec(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = False
        self._redis_instance = redis_controller()

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_zone_xsec, cls).__new__(cls)
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "https://zone-xsec.com/archive"

    @property
    def base_url(self) -> str:
        return "https://zone-xsec.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value):
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "https://zone-xsec.com/contact"

    def safe_find(self, page: Page, selector: str, attr: str = None) -> str:
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return ""

    def parse_leak_data(self, page: Page):
        try:
            is_crawled = self.invoke_db(REDIS_COMMANDS.S_GET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED, False)
            if is_crawled:
                max_pages = 20
            else:
                max_pages = 500

            current_page = 1

            while current_page <= max_pages:
                full_url = f"{self.seed_url}/page={current_page}"
                page.goto(full_url)
                page.wait_for_load_state("load")
                page.wait_for_selector("a[title='Show Mirror']")

                links = page.query_selector_all("a[title='Show Mirror']")
                collected_links = []
                for link in links:
                    href = link.get_attribute("href")
                    if href:
                        collected_links.append(urljoin(self.base_url, href))

                today_date = datetime.today().strftime('%Y-%m-%d')

                for link in collected_links:
                    try:
                        page.goto(link)
                        page.wait_for_load_state("load")
                        page.wait_for_selector(".panel.panel-danger")

                        web_url = self.safe_find(page, "#url")
                        ip = self.safe_find(page, "p:has(strong):has-text('IP') strong")
                        defacer = self.safe_find(page, "p:has(strong):has-text('Defacer') strong")
                        team = self.safe_find(page, "p:has(strong):has-text('Team') strong")
                        location = self.safe_find(page, "p:has(strong):has-text('Location') strong")
                        web_server = self.safe_find(page, "p:has(strong):has-text('Web Server') strong")
                        date = self.safe_find(page, "p:has(strong):has-text('Saved on') strong")

                        # Check if the iframe is already present without waiting
                        iframe = page.query_selector("iframe")
                        if not iframe:
                            try:
                                # Wait for the iframe to load, but with a shorter timeout
                                iframe = page.wait_for_selector("iframe", timeout=10000)  # Reduced timeout to 5 seconds
                            except TimeoutError:
                                print(f"Iframe not found for link: {link}")
                                continue

                        if iframe:
                            iframe_content_frame = iframe.content_frame()
                            if iframe_content_frame:
                                iframe_content_frame.wait_for_load_state("load")
                                iframe_html = iframe_content_frame.content()
                                soup = BeautifulSoup(iframe_html, "html.parser")

                                m_content_container = soup.get_text(separator="\n", strip=True)
                                if len(m_content_container.split()) > 500:
                                    words = m_content_container.split()
                                    m_important_content_container = " ".join(words[:500])
                                    m_content_container = " ".join(words[500:])
                                else:
                                    m_important_content_container = m_content_container
                                    m_content_container = ""

                                m_full_iframe_html = iframe_html
                            else:
                                m_content_container = ""
                                m_important_content_container = ""
                                m_full_iframe_html = ""
                        else:
                            m_content_container = ""
                            m_important_content_container = ""
                            m_full_iframe_html = ""

                        card_data = card_extraction_model(
                            m_name="Defacement Report",
                            m_title=f"Hacked by {defacer}",
                            m_weblink=[web_url] if web_url else [],
                            m_url=link,
                            m_addresses=[location, ip] if location and ip else [],
                            m_base_url=self.base_url,
                            m_content=m_content_container,
                            m_websites=[web_server] if web_server else [],
                            m_network=helper_method.get_network_type(self.base_url),
                            m_important_content=m_important_content_container if m_important_content_container else "",
                            m_content_type=["leaks"],
                            m_leak_date=date
                        )

                        self._card_data.append(card_data)
                    except Exception as ex:
                        print(f"Error processing link {link}: {ex}")
                        continue

                current_page += 1

        except Exception as ex:
            print(f"An error occurred: {ex}")
        finally:
            self.invoke_db(REDIS_COMMANDS.S_SET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED, True)