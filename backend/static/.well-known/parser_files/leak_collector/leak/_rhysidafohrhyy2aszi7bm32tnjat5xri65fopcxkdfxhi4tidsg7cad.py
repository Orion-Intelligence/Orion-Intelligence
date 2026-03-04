import re
from abc import ABC
from typing import List

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad(leak_extractor_interface, ABC):
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
            cls._instance = super(_rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion/"

    @property
    def base_url(self) -> str:
        return "http://rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=True, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_selector("#companies_online", timeout=10000)
            page.click("#companies_online")

            page.wait_for_selector(".btn.btn-secondary[data-company]", timeout=5000)

            error_count = 0
            buttons = page.query_selector_all(".btn.btn-secondary[data-company]")

            for btn in buttons:
                try:
                    company_id = btn.get_attribute("data-company")
                    if not company_id:
                        continue

                    btn.click()

                    modal_selector = f"#company_modal_{company_id}"
                    title_selector = f"#company_modal_label_{company_id}"

                    page.wait_for_selector(modal_selector, state="visible")

                    title_el = page.query_selector(title_selector)
                    title = title_el.text_content().strip() if title_el else f"Company {company_id}"

                    description_els = page.query_selector_all(f"{modal_selector} p")
                    description = "\n".join(
                        p.text_content().strip() for p in description_els if p.text_content()
                    )

                    href_el = page.query_selector(f"{modal_selector} a[href^='http']")
                    external_link = href_el.get_attribute("href") if href_el else ""

                    image_els = page.query_selector_all(f"{modal_selector} img")
                    images = [img.get_attribute("src") for img in image_els if img.get_attribute("src")]

                    content = f"{title}\n{description}\n{external_link}"

                    ref_html = helper_method.extract_refhtml(
                        external_link,
                        self.invoke_db,
                        REDIS_COMMANDS,
                        CUSTOM_SCRIPT_REDIS_KEYS,
                        RAW_PATH_CONSTANTS,
                        page,
                    )

                    card_data = leak_model(
                        m_ref_html=ref_html,
                        m_title=title,
                        m_url=self.base_url,
                        m_base_url=self.base_url,
                        m_content=content,
                        m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=content[:500],
                        m_weblink=[external_link] if external_link else [],
                        m_dumplink=[],
                        m_content_type=["leaks"],
                        m_logo_or_images=images,
                    )

                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_company_name=title,
                        m_team="rhysida",
                    )

                    self.append_leak_data(card_data, entity_data)

                    close_btn = page.query_selector(f"{modal_selector} button[data-bs-dismiss='modal']")
                    if close_btn:
                        close_btn.click()

                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                    page.keyboard.press("Escape")
                    continue

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            raise