import datetime
from abc import ABC
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


class _orca66hwnpciepupe5626k2ib6dds6zizjwuuashz67usjps2wehz4id(leak_extractor_interface, ABC):
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
            cls._instance = super(_orca66hwnpciepupe5626k2ib6dds6zizjwuuashz67usjps2wehz4id, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://orca66hwnpciepupe5626k2ib6dds6zizjwuuashz67usjps2wehz4id.onion"

    @property
    def base_url(self) -> str:
        return "http://orca66hwnpciepupe5626k2ib6dds6zizjwuuashz67usjps2wehz4id.onion"

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
        return "http://orca66hwnpciepupe5626k2ib6dds6zizjwuuashz67usjps2wehz4id.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    @staticmethod
    def safe_find(page, selector, attr=None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_load_state('load')

            page.wait_for_selector("a.blog__card-btn.--button", timeout=10000)
            card_links = page.query_selector_all("a.blog__card-btn.--button")
            if not card_links:
                print("No card links found on the page.")
                return

            card_urls = [
                urljoin(self.base_url, link.get_attribute("href"))
                for link in card_links if link.get_attribute("href")
            ]

            error_count = 0

            for card_url in card_urls:
                try:
                    page.goto(card_url)
                    page.wait_for_load_state('load')

                    card_inner = page.query_selector("div.card__inner")
                    if not card_inner:
                        error_count += 1
                        if error_count >= 3:
                            break
                        continue

                    description = self.safe_find(page, "div.card__description-content", attr=None) or ""
                    company_url = self.safe_find(page, "a.card__info-text.--card__info-text-link", attr="href") or ""
                    download_url = self.safe_find(page, "a.card__download.--button", attr="href")
                    card_title = self.safe_find(page, "h1.card__title", attr=None) or "Untitled"

                    image_logos = []
                    image_elements = page.query_selector_all("img.card__photos-img")
                    for img in image_elements:
                        src = img.get_attribute("src")
                        if src:
                            image_logos.append(src)

                    data_size = None

                    info_items = card_inner.query_selector_all("div.card__info-item")
                    for item in info_items:
                        title_el = item.query_selector("h2.card__info-item-title")
                        value_el = item.query_selector("p.card__info-text")
                        if not title_el or not value_el:
                            continue

                        title_text = title_el.text_content().strip().lower()
                        value_text = value_el.text_content().strip()

                        if "files size" in title_text:
                            data_size = value_text

                    date_text = next(
                        (
                            item.query_selector("p.card__info-text").text_content().strip()
                            for item in page.query_selector_all("div.card__info-item")
                            if "date of publication" in (item.query_selector("h2").text_content().strip().lower() if item.query_selector("h2") else "")
                        ),
                        None
                    )
                    if date_text:
                        leak_date = datetime.datetime.strptime(date_text, "%d/%m/%Y").date()
                    else:
                        leak_date = None

                    card_data = leak_model(
                        m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
                        m_title=card_title,
                        m_url=self.base_url,
                        m_weblink=[company_url] if company_url else [],
                        m_dumplink=[download_url] if download_url else [],
                        m_network=helper_method.get_network_type(self.base_url),
                        m_base_url=self.base_url,
                        m_content=description + " " + self.base_url + " " + page.url,
                        m_important_content=description[:500],
                        m_content_type=["leaks"],
                        m_data_size=data_size,
                        m_leak_date=leak_date,
                    )

                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_company_name=card_title,
                        m_team="public ocra"
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
