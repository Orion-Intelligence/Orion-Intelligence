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


class _monitor_mozilla(leak_extractor_interface, ABC):
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
            cls._instance = super(_monitor_mozilla, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "https://monitor.mozilla.org/breaches"

    @property
    def base_url(self) -> str:
        return "https://monitor.mozilla.org/breaches"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://support.mozilla.org"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state("domcontentloaded")
        breach_cards = page.locator('a[class^="BreachIndexView_breachCard"]')
        breach_cards.first.wait_for(state="visible")
        card_count = breach_cards.count()

        self._card_data = []
        error_count = 0
        max_errors = 20

        card_info_list = []

        for i in range(card_count):
            try:
                card = breach_cards.nth(i)
                card_href = card.get_attribute('href')
                if not card_href:
                    continue

                dumplink = "https://monitor.mozilla.org/" + card_href

                card_date = ""
                divs = card.locator("div")
                for j in range(divs.count()):
                    div = divs.nth(j)
                    dt = div.locator("dt")
                    dd = div.locator("dd")
                    if dt.count() > 0 and "Breach added:" in dt.text_content():
                        card_date = dd.text_content().strip() if dd.count() else ""
                        break

                card_info_list.append((dumplink, card_date))

            except Exception as ex:
                error_count += 1
                print(f"Error collecting URL for card {i}: {ex}")
                if error_count >= max_errors:
                    break
                continue

        for dumplink, date_text in card_info_list:
            if error_count >= max_errors:
                break

            try:
                page.goto(dumplink, wait_until="domcontentloaded")

                locator_text = page.locator("body").text_content(timeout=10000)
                card_content = helper_method.clean_text(locator_text)

                title_el = page.locator("h1").nth(1)
                card_title = helper_method.clean_text(title_el.text_content().strip())

                if len(card_title) > 3 and card_title[1] == ' ' and card_title[0] == card_title[2]:
                    card_title = card_title[2:]

                match = page.locator("a[href^='http']").first
                weblink = match.get_attribute("href") if match.count() > 0 else page.url

                current_url = page.url
                ref_html = helper_method.extract_refhtml(weblink, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)
                card_title = card_title[1:] if card_title[:2] and card_title[0] == card_title[1] else card_title

                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
                    m_title=card_title,
                    m_url=current_url,
                    m_base_url=self.base_url,
                    m_content=card_content[0:500] + " " + self.base_url + " " + current_url,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=card_content,
                    m_weblink=[current_url],
                    m_dumplink=[dumplink],
                    m_content_type=["leaks"],
                    m_leak_date=datetime.datetime.strptime(date_text, '%B %d, %Y').date() if date_text else None
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_company_name=card_title,
                    m_team="mozilla monitor"
                )

                self.append_leak_data(card_data, entity_data)
                error_count = 0

            except Exception as ex:
                error_count += 1
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                continue

        return self._card_data
