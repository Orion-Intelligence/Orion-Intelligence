from abc import ABC
from datetime import datetime
from typing import List
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _twniiyed6mydtbe64i5mdl56nihl7atfaqtpww6gqyaiohgc75apzpad(leak_extractor_interface, ABC):
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
            cls._instance = super(_twniiyed6mydtbe64i5mdl56nihl7atfaqtpww6gqyaiohgc75apzpad, cls).__new__(cls)
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
        return "http://twniiyed6mydtbe64i5mdl56nihl7atfaqtpww6gqyaiohgc75apzpad.onion/posts/"

    @property
    def base_url(self) -> str:
        return "http://twniiyed6mydtbe64i5mdl56nihl7atfaqtpww6gqyaiohgc75apzpad.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://twniiyed6mydtbe64i5mdl56nihl7atfaqtpww6gqyaiohgc75apzpad.onion/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        page.wait_for_load_state("networkidle")
        page.wait_for_selector("h4.post-item-title a")
        links = page.query_selector_all("h4.post-item-title a")
        post_ids = []

        for link in links:
            href = link.get_attribute("href")
            if href:
                parts = href.strip("/").split("/")
                if len(parts) >= 2:
                    post_ids.append(parts[1])


        for post_id in post_ids:
            try:
                post_url = f"{self.base_url}posts/{post_id}/{post_id}/"
                page.goto(post_url)
                page.wait_for_selector("article")

                title_elem = page.query_selector("article header h1.header-title")
                date_elem = page.query_selector("article header .post-meta time")
                content_elem = page.query_selector("article .page-content")

                title = title_elem.inner_text().strip() if title_elem else ""
                date = date_elem.inner_text().strip() if date_elem else ""

                description = ""
                revenue = ""
                data_size = ""
                attachment_links = []

                if content_elem:
                    paragraphs = content_elem.query_selector_all("p")
                    i = 0
                    while i < len(paragraphs):
                        text = paragraphs[i].inner_text().strip().lower()

                        if text == "revenue:":
                            if i + 1 < len(paragraphs):
                                revenue = paragraphs[i + 1].inner_text().strip()
                            i += 1

                        elif text.startswith("revenue:"):
                            revenue = text.split(":", 1)[-1].strip()

                        elif text == "data:":
                            if i + 1 < len(paragraphs):
                                data_size = paragraphs[i + 1].inner_text().strip()
                            i += 1

                        elif text.startswith("data:"):
                            data_size = text.split(":", 1)[-1].strip()

                        elif not description:
                            desc_text = paragraphs[i].inner_text().strip()
                            if desc_text and not desc_text.lower().startswith(("revenue:", "data:")):
                                description = desc_text

                        i += 1

                    anchors = content_elem.query_selector_all("a")
                    for a in anchors:
                        href = a.get_attribute("href")
                        if href:
                            full_url = self.base_url.rstrip("/") + href
                            attachment_links.append(full_url)

                m_content = f"{description}\nRevenue: {revenue}\nData Size: {data_size}\nAttachments: {attachment_links}"

                ref_html = helper_method.extract_refhtml(title, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)
                date_object = datetime.strptime(date, '%d %b %Y').date()

                card_data = leak_model(
                    m_title=title,
                    m_ref_html=ref_html,
                    m_url=post_url,
                    m_base_url=self.base_url,
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_content=m_content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=description,
                    m_weblink=[title],
                    m_dumplink=attachment_links,
                    m_content_type=["leaks"],
                    m_leak_date=date_object,
                    m_revenue=revenue,
                    m_data_size=data_size
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="J Group"
                )

                self.append_leak_data(card_data, entity_data)

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))


