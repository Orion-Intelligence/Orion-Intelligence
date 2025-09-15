from abc import ABC
from typing import List
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import datetime

class _zohlm7ahjwegcedoz7lrdrti7bvpofymcayotp744qhx6gjmxbuo2yid(leak_extractor_interface, ABC):
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
            cls._instance = super(_zohlm7ahjwegcedoz7lrdrti7bvpofymcayotp744qhx6gjmxbuo2yid, cls).__new__(cls)
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
        return "http://zohlm7ahjwegcedoz7lrdrti7bvpofymcayotp744qhx6gjmxbuo2yid.onion"

    @property
    def base_url(self) -> str:
        return "http://zohlm7ahjwegcedoz7lrdrti7bvpofymcayotp744qhx6gjmxbuo2yid.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_timeout = 97200, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://t.me/RHouseNews"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state("networkidle")
        processed_urls = set()

        page.wait_for_selector(".cls_records .cls_record", timeout=10000)

        title_links = []
        cards = page.query_selector_all(".cls_records .cls_record")
        for card in cards:
            title_link = card.query_selector("a")
            if title_link:
                href = title_link.get_attribute("href")
                if href:
                    title_links.append(href)

        for index, link in enumerate(title_links):
            try:
                if link in processed_urls:
                    print(f"Link {link} already processed, skipping...")
                    continue
                processed_urls.add(link)

                with page.expect_navigation(wait_until="domcontentloaded"):
                    page.goto(self.base_url + link)

                title_element = page.wait_for_selector("p.cls_headerXtraLarge", timeout=60000)
                if not title_element:
                    continue

                title = title_element.inner_text().strip() if title_element else "Unknown"

                description_element = page.query_selector(
                    ".cls_recordDetailsTop .cls_verticalContent p:not(.cls_headerMedium):not(.cls_headerXtraLarge)"
                )
                description = description_element.inner_text().strip() if description_element else "No description"

                website_element = page.query_selector(".cls_recordDetailsMiddleBottom .cls_verticalContent a")
                website_link = website_element.get_attribute("href").strip() if website_element else "No website link"

                revenue_element = page.query_selector(
                    ".cls_recordDetailsMiddleBottom .cls_verticalContent p:has-text('Revenue') + p"
                )
                revenue = revenue_element.inner_text().strip() if revenue_element else "Unknown"

                employees_element = page.query_selector(
                    ".cls_recordDetailsMiddleBottom .cls_verticalContent p:has-text('Employees') + p"
                )
                employees = employees_element.inner_text().strip() if employees_element else "Unknown"

                action_date_element = page.query_selector(".cls_recordDetailsMiddleTopRight .cls_headerMedium")
                action_date_text = action_date_element.inner_text().strip() if action_date_element else "Unknown"
                try:
                    action_date = (
                        datetime.strptime(action_date_text, "%d/%m/%Y").date()
                        if action_date_text != "Unknown"
                        else None
                    )
                except ValueError:
                    action_date = None

                data_size_element = page.query_selector(
                    ".cls_recordDetailsMiddleBottom .cls_verticalContent p:has-text('Downloaded') + p"
                )
                data_size = data_size_element.inner_text().strip() if data_size_element else "Unknown"

                status_element = page.query_selector(
                    ".cls_recordDetailsMiddleBottom p.cls_headerLarge:has-text('Status:')"
                )
                status = status_element.inner_text().replace("Status:", "").strip() if status_element else "Unknown"

                social_links = []
                social_elements = page.query_selector_all(".cls_recordDetailsRight a")
                for social in social_elements:
                    social_link = social.get_attribute("href")
                    if social_link:
                        social_links.append(social_link.strip())

                dumplink_element = page.query_selector(".cls_rawText a")
                dumplink = dumplink_element.get_attribute("href").strip() if dumplink_element else "No dumplink"

                description += f"\n status: {status} \nemployee count: {employees}"

                ref_html = helper_method.extract_refhtml(title, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                card_data = leak_model(
                    m_title=title,
                    m_url=page.url,
                    m_ref_html=ref_html,
                    m_base_url=self.base_url,
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_content=description,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=description[:500],
                    m_weblink=[website_link],
                    m_dumplink=[dumplink],
                    m_content_type=["leaks"],
                    m_revenue=revenue,
                    m_leak_date=action_date,
                    m_data_size=data_size,
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="ransome house",
                    m_social_media_profiles=social_links,
                )

                self.append_leak_data(card_data, entity_data)

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
