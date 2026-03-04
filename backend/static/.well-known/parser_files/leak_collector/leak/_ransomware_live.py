import re
from abc import ABC
from datetime import datetime
from typing import List
from playwright.sync_api import Page
from urllib.parse import urljoin
from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _ransomware_live(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self._redis_instance = redis_controller()
        self._is_crawled = False

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_ransomware_live, cls).__new__(cls)
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def developer_signature(self) -> str:
        return "Muhammad Abdullah:owGbwMvMwMEYdOzLoajv79gZTxskMWRU6bi8370 / LLUoMy0zNUUhJbUsNSe / ILXISsG3NCMxNzcxRcExKaU0Jycxg5erYzMLAyMHg6yYIkuQ4M9 / l7siYpT2b / oFM5GVCWQcAxenAEykRYSFYcHRJWUetXMKmo78Ec5ueHZq52rX / vuHpJTf / G31ULsywdC23 + fM4tmaUbP2cXYm7y9kPHnAdbXgspWerkeXW8ZYmm2xrpdTF / Yyvi0aGdn5iMne8PQGgSgWxeOMKUo8IQvL3W1PN4gtYYkxfr6kMZ3t0tmSRR2qnu / fZ2yfqfdm9szOQpt2AA ===weDX"

    @property
    def seed_url(self) -> str:
        return "https://www.ransomware.live/"

    @property
    def base_url(self) -> str:
        return "https://www.ransomware.live/"

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://ransomwarelive.freshdesk.com/support/tickets/new"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False, m_threat_type= ThreatType.LEAK)

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback and self.callback():
            self._card_data.clear()
            self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state("networkidle")

        anchors = page.query_selector_all(
            'div.d-flex.flex-column.text-start.flex-grow-1 a.text-body-emphasis.text-decoration-none')
        victim_links = [urljoin(self.base_url, a.get_attribute("href")) for a in anchors if a.get_attribute("href")]

        if self.is_crawled:
            victim_links = victim_links[:30]

        for victim_url in victim_links:
            try:
                page.goto(victim_url, timeout=60000, wait_until="load")
                page.wait_for_load_state("domcontentloaded")

                victim_name_elem = page.query_selector("h1") or page.query_selector("h5 span")
                victim_name = victim_name_elem.inner_text().strip() if victim_name_elem else "Unknown"

                posted_on = datetime.today().date()
                date_elem = page.query_selector("time")
                if date_elem:
                    date_text = date_elem.inner_text().strip()
                    try:
                        posted_on = datetime.strptime(date_text, "%Y-%m-%d").date()
                    except Exception:
                        pass

                country = ""
                country_img = page.query_selector("body > div.container-fluid.px-lg-5.my-3 > p:nth-child(6) > img")
                if country_img:
                    alt_text = country_img.get_attribute("alt")
                    if alt_text:
                        country = alt_text.strip()

                group = "ransomware live"
                group_elem = page.query_selector("body > div.container-fluid.px-lg-5.my-3 > p:nth-child(3) > a > span")
                if group_elem:
                    group = group_elem.inner_text().strip()

                paragraphs = page.query_selector_all("div.container-fluid.px-lg-5.my-3 p")
                content_lines = [
                    para.inner_text().strip()
                    for para in paragraphs
                    if para.inner_text().strip() and not any(
                        kw in para.inner_text().strip().lower()
                        for kw in ["press", "search", "statistics", "worldmap", "api", "ttp", "ioc", "notifications"]
                    )
                ]
                complete_description = "\n".join(content_lines)

                match = re.search(r'Description:\n(.*?)\nLeak Screenshot:', complete_description, re.DOTALL)
                if match:
                    description_text = match.group(1).replace("[AI generated]","").strip()
                else:
                    description_text = complete_description

                ref_html = ""
                if victim_name and " " not in victim_name:
                    try:
                        ref_html = helper_method.extract_refhtml(
                            victim_name,
                            self.invoke_db,
                            REDIS_COMMANDS,
                            CUSTOM_SCRIPT_REDIS_KEYS,
                            RAW_PATH_CONSTANTS,
                            page
                        )
                    except Exception as ex:
                        log.g().e(f"HTMLREF ERROR {ex} - Offending victim: {victim_name}")

                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_title=victim_name,
                    m_weblink=[victim_url],
                    m_dumplink=[victim_url],
                    m_url=victim_url,
                    m_base_url=self.base_url,
                    m_screenshot="",
                    m_content=complete_description,
                    m_logo_or_images=[],
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=complete_description,
                    m_content_type=["leaks"],
                    m_leak_date=posted_on
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_country=[country],
                    m_team=group
                )

                self.append_leak_data(card_data, entity_data)

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
