from abc import ABC
from datetime import datetime
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _bleepingcomputer(leak_extractor_interface, ABC):
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
            cls._instance = super(_bleepingcomputer, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:

        return "https://www.bleepingcomputer.com/news/security/"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:

        return "https://www.bleepingcomputer.com/"

    @property
    def rule_config(self) -> RuleModel:

        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False)

    @property
    def card_data(self) -> List[leak_model]:

        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:

        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:

        return "https://www.bleepingcomputer.com/contact/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            all_links = []
            max_pages = 10
            current_page = 1

            while current_page <= max_pages:

                page.wait_for_selector("div.bc_latest_news_text h4 a", timeout=10000)
                links = page.locator("div.bc_latest_news_text h4 a")
                for i in range(links.count()):
                    href = links.nth(i).get_attribute("href")
                    if href:
                        all_links.append(href)


                page.wait_for_selector('a[aria-label="Next Page"]',timeout=10000)
                next_btn = page.locator('a[aria-label="Next Page"]')
                if next_btn.count() and next_btn.is_visible() and next_btn.is_enabled():
                    next_btn.scroll_into_view_if_needed()
                    next_btn.click()
                    current_page += 1
                else:
                    break

            for idx, url in enumerate(all_links):
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    page.wait_for_selector("div.article_section h1",timeout=3000)

                    title = (
                        page.locator("div.article_section h1").first.inner_text()
                        if page.locator("div.article_section h1").count()
                        else ""
                    )
                    description = (
                        page.locator("div.articleBody").inner_text()
                        if page.locator("div.articleBody").count()
                        else ""
                    )
                    short_description = " ".join(description.strip().split()[:100])
                    article_date = datetime.strptime(page.text_content('li.cz-news-date').strip(), '%B %d, %Y').date()

                    card_data = leak_model(
                        m_title=title.strip(),
                        m_url=url,
                        m_leak_date=article_date,
                        m_base_url=self.base_url,
                        m_screenshot="",
                        m_content=description.strip(),
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=short_description,
                        m_weblink=[],
                        m_dumplink=[],
                        m_content_type=["news"],
                    )

                    entity_data = entity_model(m_team="bleeping computer")
                    self.append_leak_data(card_data, entity_data)

                except Exception as post_error:
                    print(f"⚠️ Skipped post {idx + 1} due to error: {post_error}")

        except Exception as e:
            print(f"❌ Error in parse_leak_data: {e}")
