from abc import ABC
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd(leak_extractor_interface, ABC):
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
            cls._instance = super(_3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd, cls).__new__(cls)
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion/"

    @property
    def base_url(self) -> str:
        return "http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value):
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.goto(self.seed_url, wait_until="networkidle")
        self.soup = BeautifulSoup(page.content(), "html.parser")

        buttons = self.soup.find_all("button", class_="btn btn-lg btn-outline-light")

        for index, button in enumerate(buttons, start=1):
            try:
                page.locator(f'button:has-text("Show")').nth(index - 1).click()
                page.wait_for_selector(".modal-content", timeout=5000)

                modal_content = BeautifulSoup(page.content(), "html.parser").find("div", class_="modal-content")
                if not modal_content:
                    print(f"No modal content found for button {index}")
                    continue

                title_element = modal_content.find("h5", id="full-card-title")
                title_text = helper_method.clean_text(title_element.get_text(strip=True)) if title_element else ""

                body_element = modal_content.find("p", id="full-card-text")
                body_text = helper_method.clean_text(body_element.get_text(strip=True)) if body_element else ""

                links_element = modal_content.find("p", id="full-card-links")
                dump_links = [link["href"] for link in links_element.find_all("a", href=True)] if links_element else []

                card_data = leak_model(
                    m_screenshot=helper_method.get_screenshot_base64(page, title_text),
                    m_title=title_text,
                    m_url=self.seed_url,
                    m_base_url=self.base_url,
                    m_content=body_text + " " + self.seed_url + " " + self.base_url,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=body_text,
                    m_weblink=[self.seed_url],
                    m_dumplink=dump_links,
                    m_content_type=["leaks"],
                )

                entity_data = entity_model(
                    m_email_addresses=helper_method.extract_emails(body_text),
                    m_phone_numbers=helper_method.extract_phone_numbers(body_text),
                )

                self.append_leak_data(card_data, entity_data)
                page.locator(".modal .btn-close").click()

            except Exception as e:
                print(f"Error processing button {index}: {e}")

