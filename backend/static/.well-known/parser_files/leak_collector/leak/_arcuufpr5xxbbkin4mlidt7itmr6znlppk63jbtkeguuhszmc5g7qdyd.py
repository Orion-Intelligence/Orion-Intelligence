from abc import ABC
from typing import List
from datetime import datetime
from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _arcuufpr5xxbbkin4mlidt7itmr6znlppk63jbtkeguuhszmc5g7qdyd(leak_extractor_interface, ABC):
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
            cls._instance = super(_arcuufpr5xxbbkin4mlidt7itmr6znlppk63jbtkeguuhszmc5g7qdyd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://arcuufpr5xxbbkin4mlidt7itmr6znlppk63jbtkeguuhszmc5g7qdyd.onion/"

    @property
    def base_url(self) -> str:
        return "http://arcuufpr5xxbbkin4mlidt7itmr6znlppk63jbtkeguuhszmc5g7qdyd.onion/"

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
        return "http://arcuufpr5xxbbkin4mlidt7itmr6znlppk63jbtkeguuhszmc5g7qdyd.onion/?page_id=9"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()


    def parse_leak_data(self, page: Page):
        page_number = 1

        while True:
            page.goto(f"{self.seed_url}?paged={page_number}", timeout=60000,wait_until='domcontentloaded')
            articles = page.locator("article[class*='post-']")
            count = articles.count()

            if count == 0:
                break

            post_ids = []
            for i in range(count):
                article = articles.nth(i)
                post_id = article.get_attribute("id")
                if post_id and post_id.startswith("post-"):
                    id_number = post_id.replace("post-", "")
                    post_ids.append(id_number)

            for id_number in post_ids:
                post_url = f"{self.seed_url}?p={id_number}"
                try:
                    page.goto(post_url, timeout=15000, wait_until="domcontentloaded")
                except Exception as e:
                    print(e)
                    continue

                if not page.locator("article[class*='post-']").is_visible():
                    print(f"Post {id_number} not found or offline, skipping.")
                    continue

                post_title = page.locator("div.entry-title h1").inner_text()

                post_date_str = page.locator("time.published").get_attribute("datetime")
                post_date = None
                if post_date_str:
                    post_date = datetime.fromisoformat(post_date_str).date()

                content_div = page.locator("div.kenta-article-content")
                paragraphs = content_div.locator("p")

                weblink = ""
                if paragraphs.count() >= 1:
                    weblink = paragraphs.nth(0).inner_text().strip()

                description_text = ""
                if paragraphs.count() >= 2:
                    description_text = paragraphs.nth(1).inner_text().strip()

                dump_urls = []
                if paragraphs.count() >= 3:
                    for j in range(2, paragraphs.count()):
                        para_text = paragraphs.nth(j).inner_text().strip()
                        parts = para_text.split()
                        for part in parts:
                            if part.startswith("http"):
                                dump_urls.append(part)




                full_content = content_div.inner_text()

                card_data = leak_model(
                    m_title=post_title,
                    m_url=post_url,
                    m_base_url=self.base_url,
                    m_screenshot=helper_method.get_screenshot_base64(page,post_title,self.base_url),
                    m_content=full_content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=description_text,
                    m_weblink=[weblink],
                    m_dumplink=dump_urls,
                    m_content_type=["leaks"],
                    m_leak_date=post_date
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="ARCUS",
                )

                self.append_leak_data(card_data, entity_data)

            page_number += 1

        self._is_crawled = True



