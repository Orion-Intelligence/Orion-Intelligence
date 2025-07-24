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


class _scworld(leak_extractor_interface, ABC):
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
            cls._instance = super(_scworld, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:

        return "https://www.scworld.com/topic/data-security"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:

        return "https://www.scworld.com/"

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

        return "https://www.scworld.com/contact-us"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_timeout(25000)
            previous_height = 0
            for _ in range(10):
                page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
                page.wait_for_timeout(5000)


                new_height = page.evaluate("document.body.scrollHeight")
                if new_height == previous_height:
                    break
                previous_height = new_height


            page.wait_for_selector("a:has(h5.font-heading)", timeout=10000)
            link_locator = page.locator("a:has(h5.font-heading)")
            count = link_locator.count()


            hrefs = []
            for i in range(count):
                href = link_locator.nth(i).get_attribute("href")
                if href and href not in hrefs:
                    hrefs.append(href)


            for i, href in enumerate(hrefs):
                try:

                    full_url = href if href.startswith("http") else self.base_url.rstrip("/") + href
                    page.goto(full_url, timeout=30000)  # 30s max wait
                    page.wait_for_selector("h1.tmb-3", timeout=15000)

                    page.wait_for_timeout(2000)

                    title = page.locator("h1.tmb-3").inner_text()
                    desc_node = page.locator("article.Content_content__tfAq8.font-body-large.tmt-3")
                    description = desc_node.inner_text() if desc_node.count() else ""
                    article_date = datetime.fromisoformat(page.get_attribute('time.d-inline-block.non-interactive.text-small', 'datetime')).date()

                    card_data = leak_model(
                        m_title=title,
                        m_url=page.url,
                        m_base_url=self.base_url,
                        m_screenshot="",
                        m_content=description,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=" ".join(description.split()[:150]),
                        m_weblink=[],
                        m_dumplink=[],
                        m_leak_date=article_date,
                        m_content_type=["news"],
                    )

                    entity_data = entity_model(m_team="scworld")
                    self.append_leak_data(card_data, entity_data)

                except Exception as post_err:
                    print(f"⚠️ Skipped post {i + 1} due to error: {post_err}")

        except Exception as e:
            print(f"❌ Error in parse_leak_data: {e}")
