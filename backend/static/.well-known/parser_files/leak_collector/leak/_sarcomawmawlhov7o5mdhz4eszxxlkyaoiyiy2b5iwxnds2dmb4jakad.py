from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _sarcomawmawlhov7o5mdhz4eszxxlkyaoiyiy2b5iwxnds2dmb4jakad(leak_extractor_interface, ABC):
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
            cls._instance = super(_sarcomawmawlhov7o5mdhz4eszxxlkyaoiyiy2b5iwxnds2dmb4jakad, cls).__new__(cls)
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
        return "http://sarcomawmawlhov7o5mdhz4eszxxlkyaoiyiy2b5iwxnds2dmb4jakad.onion/"

    @property
    def base_url(self) -> str:
        return "http://sarcomawmawlhov7o5mdhz4eszxxlkyaoiyiy2b5iwxnds2dmb4jakad.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, value, expiry])

    def contact_page(self) -> str:
        return "SarcomaGroup@onionmail.org"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        page_allowed = 7
        if self.is_crawled:
            page_allowed = 2

        for page_number in range(1, page_allowed):

            url = f"{self.base_url}?page={page_number}"
            page.goto(url, wait_until="domcontentloaded")

            buttons = page.query_selector_all(".card-footer .company_button")

            for idx, button in enumerate(buttons, start=1):

                button.scroll_into_view_if_needed()

                target_modal_id = button.get_attribute("data-bs-target")
                if not target_modal_id:
                    continue

                button.click()

                page.wait_for_selector(f"{target_modal_id} .modal-title", state="visible", timeout=15000)

                title_elem = page.query_selector(f"{target_modal_id} .modal-title")
                title = title_elem.inner_text().strip() if title_elem else "N/A"

                description_elem = page.query_selector(f"{target_modal_id} .modal-body pre")
                description = description_elem.inner_text().strip() if description_elem else ""

                leak_size_elem = page.query_selector(f"{target_modal_id} .modal-body div:has-text('Leak size:')")
                leak_size = (
                    leak_size_elem.inner_text().split(":", 1)[1].strip() if leak_size_elem else ""
                )

                images = page.query_selector_all(f"{target_modal_id} .modal-body img")
                image_urls = [img.get_attribute("src") for img in images]


                download_link_elem = page.query_selector(
                    f"{target_modal_id} div:has-text('Download Link:') a[href^='http']"
                )
                download_link = download_link_elem.get_attribute("href") if download_link_elem else ""

                geo_elem = page.query_selector(f"{target_modal_id} .modal-body div:has-text('GEO:')")
                geo_location = (
                    geo_elem.inner_text().split(":", 1)[1].strip() if geo_elem else ""
                )
                if len(description)<10:
                    break

                leak = leak_model(
                    m_title=title,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_screenshot=helper_method.get_screenshot_base64(page,title,self.base_url),
                    m_content=description,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=description[:500],
                    m_dumplink=[download_link],
                    m_content_type=["leaks"],
                    m_data_size=leak_size,
                    m_logo_or_images=image_urls

                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="sarcoma group",
                    m_location=[geo_location]

                )

                self.append_leak_data(leak, entity_data)

                close_button = page.query_selector(f"{target_modal_id} .modal-header button.btn-close")
                if close_button:
                    close_button.click()







