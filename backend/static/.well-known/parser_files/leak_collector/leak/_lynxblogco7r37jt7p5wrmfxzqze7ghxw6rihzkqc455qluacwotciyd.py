import re
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
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd(leak_extractor_interface, ABC):
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
            cls._instance = super(_lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd.onion/leaks"

    @property
    def base_url(self) -> str:
        return "http://lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd.onion"

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
        return "http://lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd.onion/leaks"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_load_state("networkidle")
            page.click('a.button.button-blue', timeout=5000)

            error_count = 0
            max_counter = 30
            more_counter = 0
            if self._is_crawled:
                max_counter = 3

            processed_titles = set()

            while more_counter < max_counter:
                try:
                    page.mouse.wheel(0, 5000)
                    page.wait_for_selector('button.button-blue', timeout=5000)
                    button = page.query_selector('button.button-blue')
                    if button and button.is_visible():
                        button.click()
                        more_counter=more_counter+1
                    else:
                        break
                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                    break

            while True:
                try:
                    cards = page.query_selector_all('div.chat__chats-el.chat__block-header')
                    new_cards_found = False
                    skip_count = len(processed_titles)
                    card_index = 0

                    for card in cards:
                        if card_index < skip_count:
                            card_index += 1
                            continue

                        try:
                            card.click()

                            page.wait_for_function(
                                "el => el && el.innerText.trim().length > 0",
                                arg=page.query_selector('.detailed p'),
                                timeout=15000
                            )
                            page.wait_for_selector("div.chat__window")

                            chat_window = page.query_selector("div.chat__window")
                            title_el = chat_window.query_selector("div.chat__window-header-wrap .chat__block-title")
                            title = title_el.inner_text().strip() if title_el else "No Title"

                            if title in processed_titles:
                                card_index += 1
                                continue
                            processed_titles.add(title)

                            revenue_el = chat_window.query_selector("div.detailed span:has-text('Income') + p")
                            revenue = revenue_el.inner_text().strip() if revenue_el else None

                            date_el = chat_window.query_selector(
                                "div.detailed span:has-text('Date of publication') + p")
                            date_text = date_el.inner_text().strip() if date_el else None
                            leak_date = None
                            if date_text:
                                try:
                                    leak_date = datetime.strptime(date_text, "%d/%m/%Y").date()
                                except ValueError:
                                    pass

                            description_element = page.query_selector('.detailed p')
                            description = description_element.inner_text().strip() if description_element else ""

                            downloaded_match = re.search(r"(\d+\s?(GB|MB|TB))", description, re.IGNORECASE)
                            downloaded = downloaded_match.group(1) if downloaded_match else None

                            images = [
                                self.base_url + img.get_attribute('src')
                                for img in page.query_selector_all('.disclosured__images img')
                                if img.get_attribute('src')
                            ]

                            ref_html = helper_method.extract_refhtml(
                                title,
                                self.invoke_db,
                                REDIS_COMMANDS,
                                CUSTOM_SCRIPT_REDIS_KEYS,
                                RAW_PATH_CONSTANTS,
                                page
                            )

                            card_data = leak_model(
                                m_ref_html=ref_html,
                                m_title=title,
                                m_url=page.url,
                                m_base_url=self.base_url,
                                m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                                m_content=description,
                                m_network=helper_method.get_network_type(self.base_url),
                                m_important_content=description[:500],
                                m_content_type=["leaks"],
                                m_revenue=revenue,
                                m_data_size=downloaded,
                                m_leak_date=leak_date,
                                m_logo_or_images=images,
                            )

                            entity_data = entity_model(
                                m_scrap_file=self.__class__.__name__,
                                m_company_name=title,
                                m_team="lynx"
                            )

                            self.append_leak_data(card_data, entity_data)
                            new_cards_found = True

                        except Exception as ex:
                            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))

                        card_index += 1

                    if new_cards_found:
                        error_count = 0
                    else:
                        error_count += 1
                        if error_count >= 3:
                            break

                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                    error_count += 1
                    if error_count >= 3:
                        break

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            raise
