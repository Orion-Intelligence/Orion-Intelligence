import datetime
from abc import ABC
from typing import List

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad(leak_extractor_interface, ABC):
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
            cls._instance = super(_nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad.onion/"

    @property
    def base_url(self) -> str:
        return "http://nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_fetch_proxy=FetchProxy.TOR,
            m_fetch_config=FetchConfig.PLAYRIGHT,
            m_threat_type=ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "kairossup@onionmail.com"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        visited_pages = set()
        visited_cards = set()

        while True:
            current_url = page.url
            if current_url in visited_pages:
                break
            visited_pages.add(current_url)

            page.wait_for_selector('.card', timeout=10000)
            card_links = page.locator('.card').all()

            for card in card_links:
                card_text = card.inner_text()
                if card_text in visited_cards:
                    continue
                visited_cards.add(card_text)

                card.click()
                page.wait_for_selector('.text-block', timeout=15000)

                title_el = card.locator('.title')
                title = title_el.text_content().strip() if title_el.count() else "N/A"

                content = page.locator(".detail .desc").inner_text().replace("\n", " ")

                website_el = card.locator('.desc a[href]')
                website = website_el.get_attribute("href").strip() if website_el.count() else "N/A"

                revenue = "N/A"
                industry = "N/A"
                address = "N/A"
                desc_divs = card.locator('.desc div')
                for i in range(desc_divs.count()):
                    text = desc_divs.nth(i).text_content().strip()
                    if "Revenue" in text:
                        revenue = text.split(":", 1)[-1].strip()
                    elif "Industry" in text:
                        industry = text.split(":", 1)[-1].strip()
                    elif "Address" in text:
                        address = text.split(":", 1)[-1].strip()

                image_elements = card.locator('.images img')
                image_urls = []
                for i in range(image_elements.count()):
                    src = image_elements.nth(i).get_attribute("src")
                    if src:
                        image_urls.append(src)

                date_el = card.locator('.date')
                date_time = date_el.text_content().strip() if date_el.count() else "N/A"

                all_links = card.locator("a[href]")
                dumplinks = []
                for i in range(all_links.count()):
                    href = all_links.nth(i).get_attribute("href")
                    if href and ".onion" in href:
                        dumplinks.append(href.strip())

                title = title.split("\\")[0]
                ref_html = helper_method.extract_refhtml(
                    website, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_title=title,
                    m_content=content + " " + self.base_url + " " + page.url,
                    m_weblink=[website],
                    m_logo_or_images=image_urls,
                    m_revenue=revenue,
                    m_leak_date=datetime.datetime.strptime(
                        date_time.split()[0], '%m/%d/%Y').date() if date_time != "N/A" else None,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=content,
                    m_dumplink=dumplinks,
                    m_content_type=["leaks"], )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_location=[address] if address != "N/A" else [],
                    m_company_name=title,
                    m_industry=industry,
                    m_team="kairos")

                self.append_leak_data(card_data, entity_data)

                page.go_back()
                page.wait_for_selector('.card', timeout=5000)

            next_button = page.locator('.pagination .page-link', has_text="Next")
            if next_button.count() > 0:
                next_button.click()
                page.wait_for_selector('.card', timeout=5000)
            else:
                break
