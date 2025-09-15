from abc import ABC
from typing import List

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad(leak_extractor_interface, ABC):
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
            cls._instance = super(_j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad.onion"

    @property
    def base_url(self) -> str:
        return "http://j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad.onion"

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
        return "http://j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            processed_entries = set()

            while True:
                page.wait_for_selector('.ant-card-body')
                cards = page.query_selector_all('.ant-card-body')

                for card in cards:
                    try:
                        view_button = card.query_selector('button.custom-button')
                        if view_button and view_button.is_visible() and view_button.is_enabled():
                            view_button.click()
                        else:
                            continue

                        page.wait_for_selector('div.popup')

                        popup = page.query_selector('div.popup')
                        if not popup:
                            continue

                        company = popup.query_selector('h2').inner_text().strip() if popup.query_selector('h2') else ""
                        country = popup.query_selector('p img').get_attribute('alt') if popup.query_selector(
                            'p img') else ""
                        domain_el = popup.query_selector('a[href^="http"]')
                        domain = domain_el.get_attribute('href') if domain_el else ""
                        data_size_el = popup.query_selector('p:has-text("Data Size:")')
                        data_size = data_size_el.inner_text().split(":")[-1].strip() if data_size_el else ""

                        download_links = [
                            self.base_url + href
                            for a in popup.query_selector_all('a[download]')
                            if (href := a.get_attribute("href")) is not None
                        ]

                        entry_id = f"{country}_{company}_{domain}"
                        if entry_id in processed_entries:
                            close_button = popup.query_selector('button')
                            if close_button:
                                close_button.click()
                                page.wait_for_timeout(500)
                            continue

                        ref_html = helper_method.extract_refhtml(domain, self.invoke_db, REDIS_COMMANDS,CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                        content_el = page.query_selector("div.popup div[style*='overflow-y: auto']")
                        content_text = content_el.text_content().strip() if content_el else ""

                        card_data = leak_model(
                            m_ref_html=ref_html,
                            m_screenshot=helper_method.get_screenshot_base64(page, company, self.base_url),
                            m_title=company,
                            m_url=page.url,
                            m_base_url=self.base_url,
                            m_content=content_text,
                            m_network=helper_method.get_network_type(self.base_url),
                            m_important_content=content_text,
                            m_content_type=["leaks"],
                            m_data_size=data_size,
                            m_dumplink=download_links,
                        )

                        entity_data = entity_model(
                            m_scrap_file=self.__class__.__name__,
                            m_company_name=company,
                            m_location=[country],
                            m_country=[country],
                            m_team="crypto74"
                        )
                        button = page.query_selector('div.popup button')
                        if button and button.is_visible():
                            button.click()


                        self.append_leak_data(card_data, entity_data)
                        processed_entries.add(entry_id)

                    except Exception as ex:
                        log.g().e(f"{ex} {self.__class__.__name__}")

                next_button = None
                pagination_buttons = page.query_selector_all('div.pagination button')
                found_active = False
                for btn in pagination_buttons:
                    if "active" in btn.get_attribute("class"):
                        found_active = True
                        continue
                    if found_active:
                        next_button = btn
                        break

                if next_button:
                    next_button.click()
                    page.wait_for_load_state("networkidle")
                    page.wait_for_selector('.ant-card-body')
                else:
                    break
        except Exception as ex:
            log.g().e(f"{ex} {self.__class__.__name__}")
            raise
