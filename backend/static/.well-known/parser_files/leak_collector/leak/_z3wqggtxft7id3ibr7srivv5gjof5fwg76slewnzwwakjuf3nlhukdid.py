from abc import ABC
from datetime import datetime
from typing import List
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method


class _z3wqggtxft7id3ibr7srivv5gjof5fwg76slewnzwwakjuf3nlhukdid(leak_extractor_interface, ABC):
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
            cls._instance = super(_z3wqggtxft7id3ibr7srivv5gjof5fwg76slewnzwwakjuf3nlhukdid, cls).__new__(cls)
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
        return "http://z3wqggtxft7id3ibr7srivv5gjof5fwg76slewnzwwakjuf3nlhukdid.onion/blog"

    @property
    def base_url(self) -> str:
        return "http://z3wqggtxft7id3ibr7srivv5gjof5fwg76slewnzwwakjuf3nlhukdid.onion"

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
        return "http://z3wqggtxft7id3ibr7srivv5gjof5fwg76slewnzwwakjuf3nlhukdid.onion/blog"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_selector(".publications-list")

            while True:
                cards = page.query_selector_all(".publications-list__publication")
                if not cards:
                    break

                for card_index, card in enumerate(cards, start=1):
                    try:
                        title, weblink, address, datasize, description, date, dumplink = (None,) * 7

                        title_el = card.query_selector("h3.list-publication__name")
                        title = title_el.text_content().strip() if title_el else None

                        for _ in range(3):
                            try:
                                open_button = card.query_selector("button.publication-footer_readmore")
                                if open_button:
                                    open_button.click()
                                    page.wait_for_selector(".publication-content")
                                    break
                            except Exception as e:
                                print(f"Retrying click on 'Open' button for card {card_index} due to error: {e}")

                        weblink_el = page.query_selector(".content-addictional__row a.addictional-row__link")
                        weblink = weblink_el.get_attribute("href") if weblink_el else None

                        address_el = page.query_selector(
                            ".content-addictional__row:nth-child(2) .addictional-row__text")
                        address = address_el.text_content().strip() if address_el else None

                        datasize_el = page.query_selector(
                            ".content-addictional__row:nth-child(3) .addictional-row__text")
                        datasize = datasize_el.text_content().strip() if datasize_el else None

                        description_el = page.query_selector(".content-description__description")
                        description = description_el.text_content().strip() if description_el else None

                        date_el = page.query_selector(".content-footer__date span:nth-child(2)")
                        if date_el:
                            try:
                                date = datetime.strptime(date_el.text_content().strip(), "%d %B %Y").date()
                            except ValueError:
                                date = None

                        dumplink_el = page.query_selector(".content-statuses__publicated a.publicated-files__link")
                        if dumplink_el:
                            with page.expect_popup() as popup_info:
                                dumplink_el.click()
                            new_page = popup_info.value
                            dumplink = popup_info.value.url
                            new_page.close()

                        close_button = page.query_selector(".publication-header__close")
                        if close_button:
                            close_button.click()
                            page.wait_for_selector(".publications-list")

                        ref_html = helper_method.extract_refhtml(weblink, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                        card_data = leak_model(
                            m_title=title,
                            m_ref_html = ref_html,
                            m_url=page.url,
                            m_base_url=self.base_url,
                            m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                            m_content=description,
                            m_network=helper_method.get_network_type(self.base_url),
                            m_important_content=description,
                            m_weblink=[weblink] if weblink else [],
                            m_dumplink=[dumplink] if dumplink else [],
                            m_content_type=["leaks"],
                            m_data_size=datasize,
                            m_leak_date=date,
                        )
                        entity_data = entity_model(
                            m_scrap_file=self.__class__.__name__,
                            m_team="dragon force",
                            m_location=[address] if address else [],
                            m_company_name=title,
                        )

                        self.append_leak_data(card_data, entity_data)

                    except Exception as ex:
                        log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))

                next_button = page.query_selector(".navigation-button__next:not([disabled])")
                if next_button:
                    next_button.click()
                    page.wait_for_selector(".publications-list")
                else:
                    break

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            raise
