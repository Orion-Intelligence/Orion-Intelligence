import re
import time
from abc import ABC
from datetime import datetime
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


class _nsalewdnfclsowcal6kn5csm4ryqmfpijznxwictukhrgvz2vbmjjjyd(leak_extractor_interface, ABC):
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
            cls._instance = super(_nsalewdnfclsowcal6kn5csm4ryqmfpijznxwictukhrgvz2vbmjjjyd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://nsalewdnfclsowcal6kn5csm4ryqmfpijznxwictukhrgvz2vbmjjjyd.onion"

    @property
    def base_url(self) -> str:
        return "http://nsalewdnfclsowcal6kn5csm4ryqmfpijznxwictukhrgvz2vbmjjjyd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://t.me/fresh_leaks_today"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        self._card_data = []

        try:
            page.wait_for_selector("div.elem_ibody", timeout=30000)
            time.sleep(3)
            cards = page.query_selector_all("div.elem_ibody")

            if not cards:
                return

            error_count = 0

            for index, card in enumerate(cards):
                try:
                    cards = page.query_selector_all("div.elem_ibody")
                    card = cards[index]

                    title_element = card.query_selector("div.ibody_title")
                    company_name = title_element.inner_text().strip() if title_element else "Unknown"

                    date_element = card.query_selector("div.ibody_ft_left p:nth-child(1)")
                    leak_date = (
                        date_element.inner_text().replace("Date:", "").strip()
                        if date_element else "Unknown"
                    )
                    try:
                        leak_date = datetime.strptime(leak_date, "%d.%m.%Y").strftime(
                            "%Y-%m-%d") if leak_date != "Unknown" else "Unknown"
                    except ValueError:
                        leak_date = "Unknown"

                    image_element = card.query_selector("div.ibody_logo picture img")
                    image_url = image_element.get_attribute("src") if image_element else None

                    if not image_url:
                        error_count += 1
                        if error_count >= 3:
                            break
                        continue

                    with page.expect_navigation(wait_until="domcontentloaded"):
                        image_element.click()

                    page.wait_for_load_state("domcontentloaded")
                    time.sleep(3)

                    content_element = page.query_selector("main section .custom-container")
                    raw_content_text = content_element.inner_text().strip() if content_element else "No content available"

                    data_size_match = re.search(r"The amount of data reaches ([\d.]+[TGM]B)", raw_content_text,
                                                re.IGNORECASE)
                    total_data_size = data_size_match.group(1) if data_size_match else "Unknown"

                    dumplinks = []
                    download_elements = page.query_selector_all("li.download__list-item a")
                    for element in download_elements:
                        link = element.get_attribute("href")
                        if link:
                            dumplinks.append(link.strip())

                    weblinks = []
                    a_tags = page.query_selector_all("main section .custom-container a")
                    for a_tag in a_tags:
                        href = a_tag.get_attribute("href")
                        if href and href.startswith("http"):
                            weblinks.append(href.strip())

                    inline_links = re.findall(r"https?://[^\s,<>]+", raw_content_text)
                    weblinks.extend(inline_links)
                    weblinks = list(set(weblinks))

                    content_text = raw_content_text
                    content_text = "\n".join([line for line in content_text.split("\n") if line.strip()])

                    slick_images = []
                    slick_elements = page.query_selector_all("div.slick-track img")
                    for img in slick_elements:
                        img_src = img.get_attribute("src")
                        if img_src:
                            slick_images.append(img_src.strip())

                    with page.expect_navigation(wait_until="domcontentloaded"):
                        page.go_back()
                    page.wait_for_selector("div.elem_ibody", timeout=10000)

                    url = weblinks[0]
                    ref_html = helper_method.extract_refhtml(url, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                    card_data = leak_model(
                        m_ref_html=ref_html,
                        m_screenshot=helper_method.get_screenshot_base64(page, company_name, self.base_url),
                        m_title=company_name,
                        m_url=page.url,
                        m_content=content_text,
                        m_weblink=weblinks,
                        m_base_url=self.base_url,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=content_text[:500],
                        m_content_type=["leaks"],
                        m_leak_date=helper_method.extract_and_convert_date(leak_date),
                        m_logo_or_images=slick_images,
                        m_dumplink=dumplinks,
                        m_data_size=total_data_size,
                    )

                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_company_name=company_name,
                        m_team="dunghill leak"
                    )

                    self.append_leak_data(card_data, entity_data)
                    error_count = 0

                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                    error_count += 1
                    if error_count >= 3:
                        break

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            raise
