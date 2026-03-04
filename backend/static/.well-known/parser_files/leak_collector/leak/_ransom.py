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


class _ransom(leak_extractor_interface, ABC):
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
            cls._instance = super(_ransom, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "https://ransom.wiki/"

    @property
    def base_url(self) -> str:
        return "https://ransom.wiki/"

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
        return "https://www.linkedin.com/in/soufianetahiri/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_selector('li.list-group-item', timeout=10000)
        victim_elements = page.query_selector_all('li.list-group-item')

        victim_names = []
        for victim in victim_elements:
            text = victim.text_content().strip()
            if text.startswith("Victime:"):
                clean_name = text.replace("Victime:", "").strip().rstrip("...")
                victim_names.append(clean_name)

        error_count = 0

        for victim_name in victim_names:
            try:
                search_box = page.locator('input#search_box')
                search_box.fill(victim_name)
                search_box.press('Enter')

                page.wait_for_selector('table.table', timeout=5000)
                table_cell = page.locator('table.table tbody tr td')
                raw_data = table_cell.text_content().strip()

                data = {}
                lines = raw_data.split('\n')

                victim = None
                group = None
                description = None
                website = None
                m_leak_date = None
                post_url = None
                country = None

                for line in lines:
                    if "Victime" in line:
                        victim = line.split(":", 1)[-1].strip()
                        data["Victime"] = victim
                    if "Group" in line:
                        group = line.split(":", 1)[-1].strip()
                        data["Group"] = group
                    if "Discovered" in line:
                        discovered = line.split(":", 1)[-1].strip()
                        data["Discovered"] = discovered
                    if "Description" in line:
                        description = line.split(":", 1)[-1].strip()
                        data["Description"] = description
                    if "Website" in line:
                        website = line.split(":", 1)[-1].strip()
                        data["Website"] = website
                    if "Published" in line:
                        try:
                            date_str = line.split("Published:", 1)[-1].strip().split(" ")[0]
                            m_leak_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                        except Exception as _:
                            m_leak_date = None
                    if "Post_url" in line:
                        post_url = line.split(":", 1)[-1].strip()
                        data["Post_url"] = post_url
                    if "Country" in line:
                        country = line.split(":", 1)[-1].strip()
                        data["Country"] = country

                if victim is None:
                    error_count += 1
                    if error_count >= 3:
                        break
                    continue

                ref_html = helper_method.extract_refhtml(
                    website, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page
                )

                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_screenshot=helper_method.get_screenshot_base64(page, victim, self.base_url),
                    m_title=victim,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_content=(description or "") + " " + post_url + " " + page.url,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=description or "",
                    m_weblink=[website] if website else [],
                    m_leak_date=m_leak_date,
                    m_dumplink=[],
                    m_content_type=["leaks"],
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_location=[country] if country else [],
                    m_company_name=group,
                    m_team="ransom wiki"
                )

                self.append_leak_data(card_data, entity_data)
                error_count = 0

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                error_count += 1
                if error_count >= 3:
                    break
