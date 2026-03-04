from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _securo45z554mw7rgrt7wcgv5eenj2xmxyrsdj3fcjsvindu63s4bsid(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()
        self._is_crawled = False

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls, callback=None):
        if cls._instance is None:
            cls._instance = super(_securo45z554mw7rgrt7wcgv5eenj2xmxyrsdj3fcjsvindu63s4bsid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://securo45z554mw7rgrt7wcgv5eenj2xmxyrsdj3fcjsvindu63s4bsid.onion/"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://securo45z554mw7rgrt7wcgv5eenj2xmxyrsdj3fcjsvindu63s4bsid.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT,
                         m_threat_type=ThreatType.LEAK, m_resoource_block=False, m_block_default_javascript=False)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://www.iana.org/help/example-domains"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_selector("#section-companies ul li", timeout=60000)
        except Exception:
            return

        cards = page.locator("#section-companies ul li")
        count = cards.count()

        for i in range(count):
            try:
                card = cards.nth(i)

                card.scroll_into_view_if_needed(timeout=5000)

                h3 = card.locator("h3")
                title = h3.inner_text(timeout=5000).strip() if h3.count() > 0 else f"Unknown_Title_{i}"

                clickable = card.locator("div.cursor-pointer").first
                if clickable.count() == 0:
                    continue

                clickable.click(timeout=5000)

                page.wait_for_selector("#section-company-info", state="visible", timeout=15000)

                revenue = "N/A"
                rev_loc = page.locator("#section-company-info span:has-text('Revenue') + span")
                if rev_loc.count() > 0:
                    revenue = rev_loc.inner_text(timeout=5000).strip()

                website = ""
                web_loc = page.locator("#section-company-info a").first
                if web_loc.count() > 0:
                    website = web_loc.get_attribute("href", timeout=5000)

                description = ""
                desc_loc = page.locator("#section-company-info p").first
                if desc_loc.count() > 0:
                    description = desc_loc.inner_text(timeout=5000).strip()

                storage_btn = page.locator("#section-company-info button:has-text('Storage')")
                if storage_btn.count() > 0:
                    storage_btn.click(timeout=5000)

                    overview_btn = page.locator("#section-company-info button:has-text('Overview')")
                    if overview_btn.count() > 0:
                        overview_btn.click(timeout=5000)

                ref_html = helper_method.extract_refhtml(website, self.invoke_db, REDIS_COMMANDS,
                                                         CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_title=title,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_content=description,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_important_content=description[:500] if description else "",
                    m_content_type=["leaks"],
                    m_revenue=revenue,
                )

                entity_data = entity_model(
                    m_team="securo",
                    m_scrap_file=self.__class__.__name__,
                )

                self.append_leak_data(card_data, entity_data)

            except Exception:
                continue