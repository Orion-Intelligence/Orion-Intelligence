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


class _securityweek(leak_extractor_interface, ABC):
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
            cls._instance = super(_securityweek, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:

        return "https://www.securityweek.com/category/data-breaches/"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:

        return "https://www.securityweek.com/"

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

        return "https://advertise.securityweek.com/info"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            collected_urls = []
            max_clicks = 10
            clicks = 0

            popup = page.locator("button.pum-close.popmake-close")
            if popup.count():
                popup.wait_for(state="visible", timeout=10000)
                popup.click()

            while clicks < max_clicks:
                more_button = page.locator("a.zox-inf-more-but")
                if more_button.count() == 0:
                    break

                more_button.scroll_into_view_if_needed()
                more_button.click()
                page.wait_for_timeout(3000)
                clicks += 1

            post_links = page.locator("a:has(h2.zox-s-title2)")
            for i in range(post_links.count()):
                href = post_links.nth(i).get_attribute("href")
                if href and not href.startswith("#"):
                    collected_urls.append(href)

            for idx, url in enumerate(collected_urls):
                try:
                    page.goto(url,timeout=20000)

                    title = page.locator("h1.zox-post-title.left.entry-title").inner_text() if page.locator(
                        "h1.zox-post-title.left.entry-title").count() else ""
                    description_text = ""

                    if page.locator("span.zox-post-excerpt").count():
                        description_text += page.locator("span.zox-post-excerpt").inner_text() + "\n"

                    if page.locator("div.zox-post-body.left.zoxrel.zox100").count():
                        description_text += page.locator("div.zox-post-body.left.zoxrel.zox100").inner_text()

                    short_description = " ".join(description_text.split()[:100])
                    article_date = datetime.fromisoformat(page.get_attribute('time.post-date.updated', 'datetime')).date()

                    card_data = leak_model(
                        m_title=title,
                        m_url=url,
                        m_base_url=self.base_url,
                        m_screenshot="",
                        m_content=description_text.strip(),
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=short_description,
                        m_weblink=[],
                        m_dumplink=[],
                        m_leak_date=article_date,
                        m_content_type=["news"],
                    )

                    entity_data = entity_model(m_team="securityweek")
                    self.append_leak_data(card_data, entity_data)

                except Exception as post_error:
                    print(f"⚠️ Skipped post {idx + 1} due to error: {post_error}")

        except Exception as e:
            print(f"❌ Error in parse_leak_data: {e}")
