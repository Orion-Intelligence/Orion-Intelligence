from abc import ABC
from datetime import datetime
from typing import List
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd(leak_extractor_interface, ABC):
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
            cls._instance = super(_omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd.onion/"

    @property
    def base_url(self) -> str:
        return "http://omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd.onion/"

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
        return "http://omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_selector("table.datatable", timeout=10000)
        datatable = page.query_selector("table.datatable")
        if not datatable:
            print("No datatable found.")
            return

        rows = datatable.query_selector_all("tr")
        page_urls = []
        for row in rows:
            links = row.query_selector_all("a[href]")
            for link in links:
                href = link.get_attribute("href")
                if href:
                    page_urls.append(urljoin(self.seed_url, href))

        error_count = 0

        for page_url in page_urls:
            try:
                page.goto(page_url, wait_until="networkidle")
                page.wait_for_load_state("networkidle")

                title_el = page.query_selector(".theading")
                title_text = helper_method.clean_text(title_el.text_content().strip()) if title_el else ""

                tstat_el = page.query_selector(".tstat")
                content = helper_method.clean_text(tstat_el.text_content().strip()) if tstat_el else ""
                important_content = content

                total_size = last_updated = ""
                last_updated_date = None

                for row in rows:
                    link = row.query_selector("a[href]")
                    if link:
                        href = link.get_attribute("href")
                        if href and page_url.endswith(href):
                            cells = row.query_selector_all("td")
                            if len(cells) > 3:
                                total_size = cells[3].text_content().strip()
                            if len(cells) > 4:
                                last_updated = cells[4].text_content().strip()
                            if last_updated:
                                last_updated_date = datetime.strptime(last_updated, "%Y-%m-%d").date()
                            break

                dump_links = []
                tdownload_table = page.query_selector("table.tdownload")
                if tdownload_table:
                    a_tags = tdownload_table.query_selector_all("a[href]")
                    for a in a_tags:
                        href = a.get_attribute("href")
                        if href:
                            dump_links.append(urljoin(self.base_url, href))

                card_data = leak_model(
                    m_screenshot=helper_method.get_screenshot_base64(page, title_text, self.base_url),
                    m_title=title_text,
                    m_url=page_url,
                    m_base_url=self.base_url,
                    m_content=content + " " + self.base_url + " " + page_url,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=important_content,
                    m_weblink=[page_url],
                    m_dumplink=dump_links,
                    m_content_type=["leaks"],
                    m_leak_date=last_updated_date,
                    m_data_size=total_size
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_company_name=title_text,
                    m_team="omega"
                )

                self.append_leak_data(card_data, entity_data)
                error_count = 0

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                error_count += 1
                if error_count >= 3:
                    break
