import datetime
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


class _ransomlook(leak_extractor_interface, ABC):
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
            cls._instance = super(_ransomlook, cls).__new__(cls)
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
        return "https://www.ransomlook.io/leaks"

    @property
    def base_url(self) -> str:
        return "https://www.ransomlook.io"

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
        return "https://www.ransomlook.io/telegrams"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.goto(self.seed_url)
            processed_posts = set()
            error_count = 0

            rows = page.query_selector_all('tr')
            collected_links = []
            for row in rows:
                link_element = row.query_selector('td > a')
                if link_element:
                    href = link_element.get_attribute("href")
                    if href:
                        post_id = href.split('/leak/')[1]
                        if post_id not in processed_posts:
                            full_url = f"{self.base_url}{href}"
                            collected_links.append(full_url)
                            processed_posts.add(post_id)

            if self.is_crawled:
                collected_links = collected_links[0:50]

            for link in collected_links:
                try:
                    page.goto(link)
                    page.wait_for_selector('article#main')

                    title_element = page.query_selector("article#main > h1")
                    m_title = title_element.inner_text().strip() if title_element else ""

                    size_element = page.query_selector("table#table tbody tr td:nth-child(1) center")
                    m_data = size_element.inner_text().strip() if size_element else ""

                    records_element = page.query_selector("table#table tbody tr td:nth-child(2)")
                    m_records = records_element.inner_text().strip() if records_element else ""

                    m_data_size = f"{m_data} - {m_records} records" if m_data and m_records else m_data

                    date_element = page.query_selector("table#table tbody tr td:nth-child(3)")
                    m_date = date_element.inner_text().strip() if date_element else ""

                    columns_element = page.query_selector("table#table tbody tr td:nth-child(4)")
                    m_columns = columns_element.inner_text().strip() if columns_element else ""

                    m_content = m_columns.replace("[", "").replace("]", "")
                    ref_html = helper_method.extract_refhtml(m_title, self.invoke_db, REDIS_COMMANDS,
                                                             CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                    card_data = leak_model(
                        m_ref_html=ref_html,
                        m_screenshot=helper_method.get_screenshot_base64(page, m_title, self.base_url),
                        m_title=m_title,
                        m_url=page.url,
                        m_base_url=self.base_url,
                        m_content=m_content + " " + self.base_url + " " + page.url,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=m_content,
                        m_content_type=["leaks"],
                        m_data_size=m_data_size,
                        m_leak_date=datetime.datetime.strptime(m_date, '%Y-%m-%d').date()
                    )

                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_team="ransom look"
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
