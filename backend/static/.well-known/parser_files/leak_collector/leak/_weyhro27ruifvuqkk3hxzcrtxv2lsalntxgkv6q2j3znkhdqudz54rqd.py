import datetime
from abc import ABC
from typing import List
from urllib.parse import urljoin

from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _weyhro27ruifvuqkk3hxzcrtxv2lsalntxgkv6q2j3znkhdqudz54rqd(leak_extractor_interface, ABC):
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
            cls._instance = super(_weyhro27ruifvuqkk3hxzcrtxv2lsalntxgkv6q2j3znkhdqudz54rqd, cls).__new__(cls)
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
        return "http://weyhro27ruifvuqkk3hxzcrtxv2lsalntxgkv6q2j3znkhdqudz54rqd.onion/leaks"

    @property
    def base_url(self) -> str:
        return "http://weyhro27ruifvuqkk3hxzcrtxv2lsalntxgkv6q2j3znkhdqudz54rqd.onion"

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
        return "http://weyhro27ruifvuqkk3hxzcrtxv2lsalntxgkv6q2j3znkhdqudz54rqd.onion/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        article_anchors = page.query_selector_all('div.border.rounded-xl a[href*="/leaks/"]')

        article_info_list = []
        for anchor in article_anchors:
            href = anchor.get_attribute('href')
            date_element = anchor.query_selector('time')
            date_str = date_element.get_attribute('datetime') if date_element else None

            if href:
                full_url = href if href.startswith('http') else urljoin(self.base_url, href)
                article_info_list.append((full_url, date_str))

        for full_url, date_str in article_info_list:
            try:
                page.goto(full_url)
                page.wait_for_load_state("load")

                title_element = page.query_selector('h1.text-4xl.font-bold')
                title = title_element.inner_text().strip() if title_element else ""

                description_element = page.query_selector('p.mt-6.text-lg')
                description = description_element.inner_text().strip() if description_element else ""

                article_element = page.query_selector('article.prose.prose-zinc.prose-quoteless')
                article_content = article_element.inner_text().strip() if article_element else ""

                full_content = f"{description}\n{article_content}" if description and article_content else description or article_content

                files_link_element = page.query_selector('a[href*="p7teg7yh2dwxg2tsbgnki3zrt5p7wgaegtfh4cobeqbhcq55nwt2m6yd.onion/s/"]')
                files_url = files_link_element.get_attribute('href') if files_link_element else ""

                website_link_element = page.query_selector('a[href*="adriaticglass.com"]')
                website_url = website_link_element.get_attribute('href') if website_link_element else ""

                leak_date = None
                if date_str:
                    try:
                        leak_date = datetime.datetime.fromisoformat(date_str.replace("Z", "")).date()
                    except Exception:
                        pass

                card_data = leak_model(
                    m_title=title,
                    m_url=full_url,
                    m_base_url=self.base_url,
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_content=full_content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=full_content[:500],
                    m_weblink=[website_url] if website_url else [],
                    m_dumplink=[files_url] if files_url else [],
                    m_content_type=["leaks"],
                    m_leak_date=leak_date
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="Weyhro",
                )

                self.append_leak_data(card_data, entity_data)

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                continue


