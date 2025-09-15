from abc import ABC
from datetime import datetime
from typing import List

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _lockbit7z2jwcskxpbokpemdxmltipntwlkmidcll2qirbu7ykg46eyd(leak_extractor_interface, ABC):
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
            cls._instance = super(_lockbit7z2jwcskxpbokpemdxmltipntwlkmidcll2qirbu7ykg46eyd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://lockbit3g3ohd3katajf6zaehxz4h4cnhmz5t735zpltywhwpc6oy3id.onion"

    @property
    def base_url(self) -> str:
        return "http://lockbit3g3ohd3katajf6zaehxz4h4cnhmz5t735zpltywhwpc6oy3id.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_resoource_block=False, m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://lockbit3753ekiocyo5epmpy6klmejchjtzddoekjlnt6mu3qh4de2id.onion/conditions"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_load_state("networkidle")

            page.wait_for_load_state("networkidle")
            page.wait_for_selector("a.post-block.good", timeout=20000)
            post_links = page.query_selector_all("a.post-block.good")
            error_count = 0
            if self.is_crawled:
                post_links = post_links[0:15]

            post_urls = [
                self.base_url + link.get_attribute("href")
                for link in post_links
                if link.get_attribute("href")
            ]

            for link in post_urls:
                try:
                    
                    page.goto(link, timeout=30000)
                    page.wait_for_load_state("networkidle")

                    title_element = page.query_selector("div.post-big-title")
                    title = title_element.inner_text().strip() if title_element else "No Title"

                    desc_element = page.query_selector("div.desc")
                    description = desc_element.inner_text().strip() if desc_element else ""

                    upload_date_element = page.query_selector("div.uploaded-date-utc")
                    date_text = upload_date_element.inner_text().strip() if upload_date_element else None
                    date = None
                    if date_text:
                        try:
                            date = datetime.strptime(date_text, "%d %b, %Y %H:%M %Z").date()
                        except ValueError:
                            try:
                                date = datetime.strptime(date_text, "%d %B, %Y %H:%M %Z").date()
                            except ValueError:
                                error_count += 1
                                if error_count >= 3:
                                    break
                                continue

                    leak_content = f"Title: {title}\nDate: {date}\n\n{description}"

                    ref_html = helper_method.extract_refhtml(title, self.invoke_db, REDIS_COMMANDS,
                                                             CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                    card_data = leak_model(
                        m_ref_html=ref_html,
                        m_title=title,
                        m_url=page.url,
                        m_base_url=self.base_url,
                        m_screenshot=helper_method.get_screenshot_base64(page, "", self.base_url),
                        m_content=leak_content,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=leak_content,
                        m_content_type=["leaks"],
                        m_leak_date=date,
                        m_weblink=[page.url],
                    )

                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_weblink=[title],
                        m_team="lockbit"
                    )

                    self.append_leak_data(card_data, entity_data)

                    error_count = 0

                except Exception as ex:
                    log.g().e(f"DETAIL PAGE ERROR {ex} " + str(self.__class__.__name__))
                    error_count += 1
                    if error_count >= 3:
                        break

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            raise