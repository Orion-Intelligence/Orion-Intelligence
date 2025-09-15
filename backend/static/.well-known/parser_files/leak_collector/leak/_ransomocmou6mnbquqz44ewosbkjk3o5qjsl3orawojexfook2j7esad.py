import re
from abc import ABC
from datetime import datetime
from typing import List
from urllib.parse import urljoin

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


class _ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad(leak_extractor_interface, ABC):
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
            cls._instance = super(_ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad, cls).__new__(cls)
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
        return "http://ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad.onion/news"

    @property
    def base_url(self) -> str:
        return "http://ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad.onion/about"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            self.callback()

    def parse_leak_data(self, page: Page):
        page.wait_for_selector('div.category-item')

        error_count = 0
        index = 0

        while True:
            try:
                category_items = page.query_selector_all('div.category-item.js-open-chat')
                if index >= len(category_items):
                    break

                item = category_items[index]
                index += 1

                translit = item.get_attribute('data-translit')
                if not translit:
                    continue

                item.click()
                page.wait_for_timeout(1000)
                item.click()
                page.wait_for_timeout(5000)

                timeline_item = page.query_selector(f"li.timeline-item[data-translit='{translit}']")
                if not timeline_item:
                    continue

                title_element = timeline_item.query_selector("h3")
                description_element = timeline_item.query_selector("p.publication-description")
                date_element = timeline_item.query_selector("div.date-view")
                views_element = timeline_item.query_selector("div.count-view")
                image_elements = timeline_item.query_selector_all("a.form-image-preview img")

                title = title_element.inner_text().strip() if title_element else "No title"
                description = description_element.inner_text().strip() if description_element else ""
                date = date_element.inner_text().strip() if date_element else ""
                views = views_element.inner_text().strip() if views_element else ""

                images = []
                for img in image_elements:
                    src = img.get_attribute("src")
                    if src:
                        images.append(urljoin(self.base_url, src))

                content = f"{title}\n{description}\nDate: {date}\nViews: {views}"
                cleaned_content = content.replace('\n', ' - ')
                match = re.search(r'https?://[^\s\-]+', cleaned_content)
                first_url = match.group(0) if match else None

                ref_html = helper_method.extract_refhtml(first_url, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)
                date_object = datetime.strptime(date.title(), '%d %b %Y').date()
                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_title=title,
                    m_url=f"{self.seed_url}/{translit}",
                    m_base_url=self.base_url,
                    m_content=content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=description[:500],
                    m_dumplink=[],
                    m_leak_date=date_object,
                    m_content_type=["leaks"],
                    m_logo_or_images=images,
                    m_weblink=[]
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_company_name=title,
                    m_team="everest group"
                )

                self.append_leak_data(card_data, entity_data)
                error_count = 0

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                error_count += 1
                if error_count >= 3:
                    break
