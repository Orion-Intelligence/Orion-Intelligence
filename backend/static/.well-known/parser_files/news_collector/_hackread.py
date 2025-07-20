from abc import ABC
from datetime import datetime
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _hackread(leak_extractor_interface, ABC):
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
            cls._instance = super(_hackread, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://hackread.com/category/hacking-news/leaks-affairs/"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "https://hackread.com/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False, m_threat_type=ThreatType.NEWS)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://hackread.com/contact-us/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            for i in range(10):
                load_more = page.locator("button.cs-load-more")
                if load_more.is_visible():
                        load_more.scroll_into_view_if_needed()
                        load_more.click()
                        page.wait_for_timeout(3000)
                else:
                    break

            page.wait_for_selector('h2.cs-entry__title a', timeout=10000)
            link_elements = page.locator('h2.cs-entry__title a')
            urls_to_visit = []

            for i in range(link_elements.count()):
                href = link_elements.nth(i).get_attribute("href")
                if href:
                    urls_to_visit.append(href)

            for idx, link_url in enumerate(urls_to_visit):
                try:
                    page.goto(link_url,timeout=10000)

                    if page.locator("h1.cs-entry__title.cs-entry__title-line").count():
                        title = page.locator("h1.cs-entry__title.cs-entry__title-line").inner_text()
                    elif page.locator("h1.cs-entry__title").count():
                        title = page.locator("h1.cs-entry__title").inner_text()
                    else:
                        title = ""

                    subtitle = page.locator(".cs-entry__subtitle").inner_text() if page.locator(
                        ".cs-entry__subtitle").count() else ""

                    entry = page.locator(".entry-content").inner_text() if page.locator(
                        ".entry-content").count() else ""

                    full_content = f"{subtitle}\n\n{entry}"

                    important_text = subtitle if subtitle else " ".join(entry.split()[:150])
                    article_date = datetime.strptime(page.text_content('div.cs-meta-date').strip(), '%B %d, %Y').date()

                    card_data = leak_model(
                        m_title=title,
                        m_url=page.url,
                        m_base_url=self.base_url,
                        m_screenshot="",
                        m_leak_date=article_date,
                        m_content=full_content,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=important_text,
                        m_weblink=[],
                        m_dumplink=[],
                        m_content_type=['news'],
                    )

                    entity_data = entity_model(m_team="hackread")
                    self.append_leak_data(card_data, entity_data)

                except Exception as e:
                    print(f"⚠️ Skipped post {idx + 1} due to error: {e}")

        except Exception as e:
            print(f"❌ Fatal error in parse_leak_data: {e}")
