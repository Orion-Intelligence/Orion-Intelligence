from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _schneier(leak_extractor_interface, ABC):
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
            cls._instance = super(_schneier, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:

        return "https://www.schneier.com/tag/data-breaches/"

    @property
    def base_url(self) -> str:

        return "https://www.schneier.com/"

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

        return "https://www.schneier.com/blog/about/contact/"

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
            max_pages = 20
            current_page = 1
            if self.is_crawled:
                max_pages = 5
                
            while current_page <= max_pages:

                page.wait_for_selector("h3.entry a", timeout=10000)
                links = page.locator("h3.entry a")
                for i in range(links.count()):
                    href = links.nth(i).get_attribute("href")
                    if href:
                        all_links.append(href)

                next_button = page.locator("a.next.page-numbers")
                if next_button.count() and next_button.is_visible() and next_button.is_enabled():
                    next_button.scroll_into_view_if_needed()
                    next_button.click()
                    page.wait_for_timeout(1000)
                    current_page += 1
                else:
                    print("🚫 No more pages to crawl.")
                    break

            for idx, url in enumerate(list(all_links)):
                try:
                    page.goto(url,timeout=10000)

                    title_locator = page.locator("h2.entry")
                    title = (
                        title_locator.inner_text()
                        if title_locator.count()
                        else ""
                    )

                    description = ""
                    p_tag = page.locator("h2.entry ~ p").first
                    if p_tag.count():
                        description += p_tag.inner_text() + "\n"
                    for bq in page.locator("h2.entry ~ blockquote").all():
                        description += bq.inner_text() + "\n"

                    full_description = description.strip()
                    short_description = " ".join(description.strip().split()[:100])


                    card_data = leak_model(
                        m_title=title.strip(),
                        m_url=url,
                        m_base_url=self.base_url,
                        m_screenshot="",
                        m_content=full_description,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=short_description,
                        m_weblink=[],
                        m_dumplink=[],
                        m_content_type=["news"],
                    )

                    entity_data = entity_model(m_team="schneier")
                    self.append_leak_data(card_data, entity_data)

                except Exception as post_error:
                    print(f"⚠️ Skipped post {idx + 1} due to error: {post_error}")

        except Exception as e:
            print(f"❌ Error in parse_leak_data: {e}")
