import datetime
import re
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


class _rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad(leak_extractor_interface, ABC):
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
            cls._instance = super(_rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad, cls).__new__(cls)
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
        return "http://rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad.onion/index.html"

    @property
    def base_url(self) -> str:
        return "http://rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad.onion"

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
        return "http://rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad.onion"

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
            all_leak_urls = []
            pages = 8
            if self._is_crawled:
                pages = 2

            for page_num in range(1, pages):
                if page_num == 1:
                    current_url = f"{self.base_url}/index.html"
                else:
                    current_url = f"{self.base_url}/index{page_num}.html"

                page.goto(current_url)
                page.wait_for_load_state('load')

                page.wait_for_selector("ol li", timeout=10000)
                list_items = page.query_selector_all("ol li")
                if not list_items:
                    continue

                error_count = 0

                for item in list_items:
                    try:
                        link_element = item.query_selector("h4 b a")
                        if not link_element:
                            continue

                        href = link_element.get_attribute("href")
                        if not href:
                            continue

                        item_url = href if href.startswith(('http://', 'https://')) else urljoin(self.base_url, href)
                        all_leak_urls.append(item_url)

                        title = link_element.text_content().strip()

                        desc_element = item.query_selector("i p")
                        description = desc_element.text_content().strip() if desc_element else ""

                        date_text = None
                        bold_tags = item.query_selector_all("b")
                        for b in bold_tags:
                            if b.text_content().strip() == "Date:":
                                sibling = b.evaluate("el => el.nextSibling && el.nextSibling.textContent")
                                if sibling:
                                    date_text = sibling.strip()
                                break

                        leak_size = None
                        if description:
                            size_match = re.search(r'Leak size: ([\d.]+\s*[KMGT]B)', description)
                            if size_match:
                                leak_size = size_match.group(1)

                        tags = []
                        tag_elements = item.query_selector_all("em b span a")
                        for tag in tag_elements:
                            tag_text = tag.text_content().strip()
                            if tag_text.startswith('#'):
                                tags.append(tag_text[1:])

                        leak_date = None
                        if date_text:
                            try:
                                leak_date = datetime.datetime.strptime(' '.join(date_text.split()[1:]), '%d %B %Y').date()
                            except Exception:
                                pass

                        card_data = leak_model(
                            m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                            m_title=title,
                            m_url=item_url,
                            m_weblink=[],
                            m_network=helper_method.get_network_type(self.base_url),
                            m_base_url=self.base_url,
                            m_content=description + " " + self.base_url + " " + item_url,
                            m_important_content=description,
                            m_logo_or_images=[],
                            m_content_type=["leaks"],
                            m_data_size=leak_size,
                            m_leak_date=leak_date,
                        )

                        entity_data = entity_model(
                            m_scrap_file=self.__class__.__name__,
                            m_company_name=title,
                            m_team="ransomexx"
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
