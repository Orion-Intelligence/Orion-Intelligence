from abc import ABC
from datetime import datetime
from typing import List
from urllib.parse import urljoin

from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _idsirtii(leak_extractor_interface, ABC):
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
            cls._instance = super(_idsirtii, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:

        return "https://idsirtii.or.id/en/news/"

    @property
    def developer_signature(self) -> str:
        return "Usman Ali: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qDMP"

    @property
    def base_url(self) -> str:

        return "https://idsirtii.or.id"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_fetch_proxy=FetchProxy.NONE,
            m_fetch_config=FetchConfig.PLAYRIGHT,
            m_resoource_block=False,
            m_threat_type=ThreatType.TRACKING)

    @property
    def card_data(self) -> List[leak_model]:

        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:

        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:

        return "https://idsirtii.or.id/en/page/contact-us.html"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        max_pages = 2 if self._is_crawled else 4

        for page_idx in range(max_pages):
            page_suffix = "index.html" if page_idx == 0 else f"{page_idx * 10}.html"
            current_url = f"{self.seed_url}{page_suffix}"

            page.goto(current_url, timeout=30000)

            post_links = []
            for link in page.locator("div.span9 h2 a[href]").all():
                href = link.get_attribute("href")
                full_url = urljoin(current_url, href)
                post_links.append(full_url)

            if not post_links:
                break

            for url in post_links:

                page.goto(url, timeout=30000)

                title_element = page.locator("h2 a").first
                title = title_element.text_content().strip() if title_element.is_visible() else "No title"
                if title == "No title":
                    continue

                desc_container = page.locator("div.blog-item.margin-bottom-40").first
                if desc_container.is_visible():
                    desc_elements = desc_container.locator("p").all()
                    description = "\n".join(
                        p.text_content().strip() for p in desc_elements if p.text_content().strip())
                else:
                    description = "No description found"

                date, admin, date_obj = "", "", None
                info_items = page.locator("ul.blog-info li").all()
                for item in info_items:
                    text = item.text_content().strip()
                    if "calendar" in str(item.inner_html()):
                        date = text.replace("calendar", "").strip()
                        clean_date = date.split(", ", 1)[1]
                        try:
                            dt = datetime.strptime(clean_date, "%d %b %Y")
                            date_obj = dt.date()
                        except ValueError:
                            date_obj = None
                    elif "user" in str(item.inner_html()):
                        admin = text.replace("By", "").strip()

                m_content = f"{description}\n\nPublished on: {date}\nBy: {admin}"

                card_data = leak_model(
                    m_title=title,
                    m_url=url,
                    m_base_url=self.base_url,
                    m_content=m_content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=description[:500],
                    m_content_type=["news", "tracking"],
                    m_leak_date=date_obj, )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="Indonesia Security Incident Response Team",
                    m_author=[admin],
                    m_country=["indonesia"])

                self.append_leak_data(card_data, entity_data)
