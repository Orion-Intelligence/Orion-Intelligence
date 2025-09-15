from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import datetime

class _kawasa2qo7345dt7ogxmx7qmn6z2hnwaoi3h5aeosupozkddqwp6lqqd(leak_extractor_interface, ABC):
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
            cls._instance = super(_kawasa2qo7345dt7ogxmx7qmn6z2hnwaoi3h5aeosupozkddqwp6lqqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://kawasa2qo7345dt7ogxmx7qmn6z2hnwaoi3h5aeosupozkddqwp6lqqd.onion"

    @property
    def base_url(self) -> str:
        return "http://kawasa2qo7345dt7ogxmx7qmn6z2hnwaoi3h5aeosupozkddqwp6lqqd.onion"

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
        return "http://kawasa2qo7345dt7ogxmx7qmn6z2hnwaoi3h5aeosupozkddqwp6lqqd.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_selector("#terminal-command")

        page.fill("#terminal-command", "leaks")
        page.keyboard.press("Enter")

        page.wait_for_selector(".leaks-table")

        public_links = []
        weblinks = []
        rows = page.query_selector_all(".leaks-table tbody tr")

        for row in rows:
            cells = row.query_selector_all("td")
            if not cells:
                continue
            if cells[0].inner_text().strip().lower() == "public":
                link_el = cells[4].query_selector("a")
                if link_el:
                    link_href = link_el.get_attribute("href").strip()
                    full_link = f"{self.base_url}/{link_href.lstrip()}"
                    public_links.append(full_link)

                    desc_text = cells[2].inner_text().strip()
                    weblinks.append(desc_text)


        for idx, link in enumerate(public_links):
            page.goto(link)

            title = page.inner_text(".article-title")

            raw_date = page.inner_text(".article-date").strip()
            clean_date_str = raw_date.replace("Published:", "").strip()

            date_obj = datetime.strptime(clean_date_str, "%Y-%m-%d")

            total_leaked_text = page.inner_text("h3:has-text('Total leaked:')").strip()
            data_size = total_leaked_text.replace("Total leaked:", "").strip()

            body_element = page.query_selector(".article-body")
            description_text = body_element.inner_text().strip()


            image_elements = body_element.query_selector_all("img")
            image_urls = [img.get_attribute("src") for img in image_elements]

            dump_links = [
                a.get_attribute("href")
                for a in body_element.query_selector_all("a.download-button")
            ]

            weblink = weblinks[idx]

            ref_html = helper_method.extract_refhtml(weblink, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

            card_data = leak_model(
                m_title=title,
                m_url=link,
                m_ref_html=ref_html,
                m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                m_base_url=self.base_url,
                m_content=description_text,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=description_text[:500],
                m_weblink=[weblink],
                m_content_type=["leaks"],
                m_dumplink=dump_links,
                m_logo_or_images=image_urls,
                m_data_size=data_size,
                m_leak_date=date_obj
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_team="Kawa4096"
            )

            self.append_leak_data(card_data, entity_data)

        self._is_crawled = True

