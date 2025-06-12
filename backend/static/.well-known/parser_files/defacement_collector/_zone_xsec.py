import datetime
from abc import ABC
from typing import List
from playwright.sync_api import Page
from urllib.parse import urljoin
import requests
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.defacement_model import defacement_model
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method

class _zone_xsec(leak_extractor_interface, ABC):
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
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.DEFACEMENT, m_resoource_block = False)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://zone-xsec.com/contact"

    def append_leak_data(self, leak: defacement_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    @staticmethod
    def safe_find(page: Page, selector: str, attr: str = None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return ""

    def parse_leak_data(self, page: Page):
        is_crawled = self.invoke_db(REDIS_COMMANDS.S_GET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value, False)
        max_pages = 50 if is_crawled else 500

        current_page = 1
        consecutive_errors = 0

        while current_page <= max_pages:
            try:
                full_url = f"{self.seed_url}/page={current_page}"
                page.goto(full_url)
                page.wait_for_load_state("load")
                page.wait_for_selector("a[title='Show Mirror']")

                links = [
                    urljoin(self.base_url, link.get_attribute("href"))
                    for link in page.query_selector_all("a[title='Show Mirror']")
                    if link.get_attribute("href")
                ]

                for link in links:
                    try:
                        response = requests.get(link, timeout=10)
                        response.raise_for_status()

                        page.set_content(response.text.replace("iframe","safeframe"))
                        page.wait_for_selector(".panel.panel-danger", timeout=5000)

                        url_span = page.query_selector("span#url")
                        extracted_url = url_span.inner_text().strip() if url_span else link

                        ip = self.safe_find(page, "p:has(strong):has-text('IP') strong")
                        defacer = self.safe_find(page, "p:has(strong):has-text('Defacer') strong")
                        location = self.safe_find(page, "p:has(strong):has-text('Location') strong")
                        web_server = self.safe_find(page, "p:has(strong):has-text('Web Server') strong")
                        date = self.safe_find(page, "p:has(strong):has-text('Saved on') strong")
                        team = self.safe_find(page, "p:has(strong):has-text('Team') strong")

                        m_mirror = ""
                        iframe = page.query_selector("safeframe")
                        if iframe:
                            iframe_src = iframe.get_attribute("src")
                            if iframe_src:
                                m_mirror = iframe_src

                        card_data = defacement_model(
                            m_web_server=[web_server],
                            m_web_url=[extracted_url],
                            m_content="",
                            m_base_url=self.base_url,
                            m_url=link,
                            m_date_of_leak=datetime.datetime.strptime(date.split()[0], '%Y-%m-%d').date(),
                            m_mirror_links=[m_mirror],
                            m_network=helper_method.get_network_type(self.base_url),
                        )

                        entity_data = entity_model(
                            m_ip=[ip],
                            m_location = [location],
                            m_team = team,
                            m_attacker = [defacer],
                        )

                        self.append_leak_data(card_data, entity_data)

                    except Exception as ex:
                        print(f"Error processing link {link}: {ex}")
                        continue

                current_page += 1
                consecutive_errors = 0

            except Exception as ex:
                print(f"An error occurred on page {current_page}: {ex}")
                consecutive_errors += 1
                if consecutive_errors >= 5:
                    print(f"Stopping due to {consecutive_errors} consecutive errors")
                    break
                current_page += 1
                continue

        self.invoke_db(REDIS_COMMANDS.S_SET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value, True)
