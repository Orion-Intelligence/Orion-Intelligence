from abc import ABC
from typing import List
from urllib.parse import urljoin

from playwright.sync_api import Page
from datetime import datetime

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _genesis6ixpb5mcy4kudybtw5op2wqlrkocfogbnenz3c647ibqixiad(leak_extractor_interface, ABC):
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
            cls._instance = super(
                _genesis6ixpb5mcy4kudybtw5op2wqlrkocfogbnenz3c647ibqixiad, cls
            ).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://genesis6ixpb5mcy4kudybtw5op2wqlrkocfogbnenz3c647ibqixiad.onion/"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://genesis6ixpb5mcy4kudybtw5op2wqlrkocfogbnenz3c647ibqixiad.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_fetch_proxy=FetchProxy.TOR,
            m_fetch_config=FetchConfig.PLAYRIGHT,
            m_threat_type=ThreatType.LEAK,
        )

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(
            command, [key + self.__class__.__name__, default_value, expiry]
        )

    def contact_page(self) -> str:
        return "http://genesis6ixpb5mcy4kudybtw5op2wqlrkocfogbnenz3c647ibqixiad.onion/about/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()



    def parse_leak_data(self, page: Page):

        page.wait_for_selector("section.block-bg a.absolute", timeout=20000)

        card_links = page.eval_on_selector_all(
            "section.block-bg a.absolute", "els => els.map(e => e.getAttribute('href'))"
        )

        full_links = [urljoin(self.base_url, href) for href in card_links if href]

        for link in full_links:
            page.goto(link)
            page.wait_for_selector("main.prose", timeout=15000)

            title = page.locator("main.prose h1").inner_text() if page.locator("main.prose h1").count() else "N/A"

            date = None
            if page.locator("main.prose time").count():
                date_text = page.locator("main.prose time").inner_text().strip()
                try:
                    if "-" in date_text:
                        date = datetime.strptime(date_text, "%Y-%m-%d").date()
                    else:
                        date = datetime.strptime(date_text, "%b %d, %Y").date()
                except ValueError:
                    date = None

            about_company = ""
            revenue = ""
            website = ""
            description = ""
            download_link = ""

            all_p = page.locator("main.prose p")
            total_p = all_p.count()

            for i in range(total_p):
                text = all_p.nth(i).inner_text().strip()
                if text.startswith("About company:"):
                    if i + 1 < total_p:
                        next_text = all_p.nth(i + 1).inner_text().strip()
                        about_company = next_text
                elif text.startswith("Revenue:"):
                    revenue = text.replace("Revenue:", "").strip()
                elif text.startswith("Website:"):
                    website = text.replace("Website:", "").strip()
                elif text.startswith("- "):
                    description += text + "\n"

            if page.locator("main.prose pre code").count():
                description = page.locator("main.prose pre code").inner_text().strip()

            if description:
                about_company += "\nDescription:\n" + description.strip()


            if page.locator("main.prose a:has-text('Download')").count():
                download_anchors = page.locator("main.prose a:has-text('Download')")
                total_links = download_anchors.count()

                all_links = []
                for i in range(total_links):
                    href = download_anchors.nth(i).get_attribute("href")
                    if href:
                        all_links.append(href.strip())

                download_link = ", ".join(all_links)

            m_content = f"""
            Title: {title}
            Date: {date}
            About Company: {about_company}
            Revenue: {revenue}
            Website: {website}
            Download: {download_link}
            """.strip()

            ref_html = helper_method.extract_refhtml(title, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)


            card_data = leak_model(
                m_ref_html=ref_html,
                m_title=title,
                m_url=link,
                m_base_url=self.base_url,
                m_content=m_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                m_important_content=about_company,
                m_weblink=[website] if website else [],
                m_content_type=["leaks"],
                m_revenue=revenue,
                m_dumplink=[download_link] if download_link else [],
                m_leak_date=date,
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_team="GENESIS"
            )

            self.append_leak_data(card_data, entity_data)



