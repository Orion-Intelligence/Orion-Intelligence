from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _leak_lookup(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

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
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "https://twitter.com/LeakLookup"

    def append_leak_data(self, leak: leak_model) -> None:
        self._card_data.append(leak)
        if self.callback:
            self.callback()

    def parse_leak_data(self, page: Page):
        rows = page.query_selector_all("table tr")

        for row in rows:
            link_element = row.query_selector("td a")
            if not link_element:
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

                    page.wait_for_selector("#breachModal .modal-body")

                    modal_content_element = page.query_selector("#breachModal .modal-body")
                    modal_content = modal_content_element.inner_text() if modal_content_element else "No data available"

                    modal_content_cleaned = []
                    for line in modal_content.split("\n"):
                        stripped_line = line.strip()
                        if stripped_line:
                            modal_content_cleaned.append(stripped_line)

                    modal_content_cleaned = "\n".join(modal_content_cleaned)

                    self.append_leak_data(leak_model(
                        m_screenshot=helper_method.get_screenshot_base64(page, site_name),
                        m_title=site_name,
                        m_url=site_url,
                        m_base_url=self.base_url,
                        m_content=modal_content_cleaned,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=modal_content_cleaned,
                        m_data_size=breach_size,
                        m_leak_date=helper_method.extract_and_convert_date(date_indexed),
                        m_content_type=["leaks"],
                    ))

                    close_button = page.query_selector("#breachModal .btn-close")
                    if close_button:
                        close_button.click()

        next_button = page.query_selector("#datatables-indexed-breaches_next a.page-link")
        if next_button and "disabled" not in next_button.get_attribute("class"):
            next_button.click()
            page.wait_for_selector("table tr")
            self.parse_leak_data(page)

