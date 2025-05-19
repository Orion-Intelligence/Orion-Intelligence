import time
from abc import ABC
from datetime import datetime
from typing import List
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method


class _leak_lookup(leak_extractor_interface, ABC):
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
            cls._instance = super(_leak_lookup, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "https://leak-lookup.com/breaches"

    @property
    def base_url(self) -> str:
        return "https://leak-lookup.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block =False)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://twitter.com/LeakLookup"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        rows = page.query_selector_all("table tr")

        error_count = 0
        m_prev_content = ""

        for row in rows:
            try:
                link_element = row.query_selector("td a")
                if not link_element:
                    error_count += 1
                    if error_count >= 3:
                        break
                    continue

                site_name = link_element.inner_text().strip()
                site_url = link_element.get_attribute("href")

                if site_url.startswith("#"):
                    site_url = f"{self.base_url}/breaches{site_url}"
                elif not site_url.startswith("http"):
                    site_url = f"{self.base_url}/{site_url.lstrip('/')}"

                breach_size_element = row.query_selector("td.d-xl-table-cell:nth-of-type(2)")
                breach_size = breach_size_element.inner_text().strip() if breach_size_element else "Unknown"

                date_indexed_element = row.query_selector("td.d-xl-table-cell:nth-of-type(3)")
                date_indexed = date_indexed_element.inner_text().strip() if date_indexed_element else "Unknown"

                dropdown_button = row.query_selector("td .dropdown a")
                if dropdown_button:
                    dropdown_button.click()

                    info_link = row.query_selector("td .dropdown-menu a[data-bs-toggle='modal']")
                    if info_link:
                        info_link.click()

                        page.wait_for_selector('h5.modal-title#modalTitle')
                        page.wait_for_selector("#breachModal .modal-body")

                        modal_content_element = page.query_selector("#breachModal .modal-body")
                        start = time.time()
                        while time.time() - start < 5:
                            m_data = page.query_selector("#breachModal .modal-body").inner_text()
                            if page.query_selector("#breachModal .modal-body").inner_text() != m_prev_content:
                                break
                            page.wait_for_timeout(200)

                        m_prev_content = page.query_selector("#breachModal .modal-body").inner_text()
                        modal_content = modal_content_element.inner_text() if modal_content_element else "No data available"
                        modal_content_cleaned = []
                        for line in modal_content.split("\n"):
                            stripped_line = line.strip()
                            if stripped_line:
                                modal_content_cleaned.append(stripped_line)

                        modal_content_cleaned = "\n".join(modal_content_cleaned)

                        is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + site_name, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
                        ref_html = None
                        if is_crawled != -1 and is_crawled < 5:
                            ref_html = helper_method.extract_refhtml(site_name)
                            if ref_html:
                                self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + site_name, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
                            else:
                                self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + site_name, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

                        cleaned = " - ".join(
                            line.strip() for line in modal_content_cleaned.strip().splitlines() if line.strip()
                        )

                        card_data = leak_model(
                            m_ref_html=ref_html,
                            m_screenshot=helper_method.get_screenshot_base64(page, site_name, self.base_url),
                            m_title=site_name,
                            m_url=site_url,
                            m_base_url=self.base_url,
                            m_content=modal_content_cleaned + " " + self.base_url + " " + site_url,
                            m_network=helper_method.get_network_type(self.base_url),
                            m_important_content=cleaned,
                            m_data_size=breach_size,
                            m_leak_date=datetime.strptime(date_indexed, '%Y-%m-%d').date(),
                            m_content_type=["leaks"],
                        )

                        entity_data = entity_model(
                            m_email=helper_method.extract_emails(modal_content_cleaned),
                            m_company_name=site_name,
                            m_ip=[site_name],
                            m_team="leak lookup"
                        )

                        entity_data = helper_method.extract_entities(modal_content_cleaned, entity_data)
                        self.append_leak_data(card_data, entity_data)
                        error_count = 0

                        close_button = page.query_selector("#breachModal .btn-close")
                        if close_button:
                            close_button.click()

            except Exception:
                error_count += 1
                if error_count >= 3:
                    break

        next_button = page.query_selector("#datatables-indexed-breaches_next a.page-link")
        if next_button and "disabled" not in next_button.get_attribute("class"):
            next_button.click()
            page.wait_for_selector("table tr")
            self.parse_leak_data(page)

