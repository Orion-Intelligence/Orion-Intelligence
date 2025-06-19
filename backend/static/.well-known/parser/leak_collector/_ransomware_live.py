from abc import ABC
from datetime import datetime
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from urllib.parse import urljoin

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
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
        self.soup = None
        self._initialized = None
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
    def seed_url(self) -> str:
        return "https://www.ransomware.live/"

    @property
    def base_url(self) -> str:
        return "https://www.ransomware.live/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False)

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

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback and self.callback():
            self._card_data.clear()
            self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state("networkidle")

        anchors = page.query_selector_all(
            'div.d-flex.flex-column.text-start.flex-grow-1 a.text-body-emphasis.text-decoration-none'
        )

        victim_links = []
        for a in anchors:
            href = a.get_attribute("href")
            if href:
                victim_links.append(urljoin(self.base_url, href))

        if self.is_crawled:
            victim_links = victim_links[0:30]

        for victim_url in victim_links:
            try:
                page.goto(victim_url, timeout=60000, wait_until="load")
                page.wait_for_load_state("domcontentloaded")

                content_html = page.content()
                if not content_html:
                    continue

                soup = BeautifulSoup(content_html, 'html.parser')

                victim_name_tag = soup.find("h1")
                if victim_name_tag:
                    victim_name = victim_name_tag.get_text(strip=True)
                else:
                    h5_tag = soup.find("h5", class_="d-flex align-items-center")
                    victim_name = h5_tag.find("span").get_text(strip=True) if h5_tag and h5_tag.find("span") else (
                        soup.title.get_text(strip=True) if soup.title else None
                    )

                posted_on = datetime.today().date()
                posted_time_tag = soup.find("time")
                if posted_time_tag:
                    posted_on_str = posted_time_tag.get_text(strip=True)
                    if posted_on_str:
                        posted_on = datetime.strptime(posted_on_str, "%Y-%m-%d").date()

                content = soup.get_text(separator="\n", strip=True)
                if not content:
                    content = "No content available"

                image_urls = []
                for img in soup.find_all("img"):
                    src = img.get("src")
                    if src:
                        if src.startswith('http'):
                            image_urls.append(src)
                        else:
                            image_urls.append(urljoin(self.base_url, src))

                country = ""
                country_label = soup.find(string=lambda t: "Country" in t)
                if country_label and country_label.parent:
                    img_tag = country_label.parent.find_next("img")
                    if img_tag and img_tag.has_attr("alt"):
                        country = img_tag["alt"].strip()

                ref_html = helper_method.extract_refhtml(victim_name, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS)

                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_screenshot=helper_method.get_screenshot_base64(page, None, victim_name),
                    m_title=victim_name,
                    m_weblink=[victim_url],
                    m_dumplink=[victim_url],
                    m_url=victim_url,
                    m_base_url=self.base_url,
                    m_content=content,
                    m_logo_or_images=image_urls,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=content[:500],
                    m_content_type=["leaks"],
                    m_leak_date=posted_on
                )
                entity_data = entity_model(
                    m_country_name=country,
                    m_team="ransomware live"
                )


                entity_data = helper_method.extract_entities(content, entity_data)

                self.append_leak_data(card_data, entity_data)

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
