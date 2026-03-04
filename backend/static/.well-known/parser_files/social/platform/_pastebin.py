import re
from datetime import datetime
from abc import ABC
from typing import List
from collections import OrderedDict
from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _pastebin(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):

        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self.m_seed_url = ""
        self._initialized = None
        self._redis_instance = redis_controller()
        self._is_crawled = False
        self._title_seen = OrderedDict()

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls, callback=None):
        if cls._instance is None:
            cls._instance = super(_pastebin, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return self.m_seed_url

    @property
    def developer_signature(self) -> str:
        return "Muhammad Marij Younas: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9UyN"

    @property
    def base_url(self) -> str:
        return "https://pastebin.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False, m_threat_type=ThreatType.PASTEBIN)

    @property
    def card_data(self) -> List[social_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:

        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://pastebin.com/contact"

    def append_leak_data(self, leak: social_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()


    def parse_leak_data(self, page: Page):

            try:
                url_lists = []

                links = page.locator("td:has(span) a")

                for i in range(links.count()):
                    href = links.nth(i).get_attribute("href")
                    if href:
                        full_url = self.base_url + href
                        url_lists.append(full_url)

                if self._is_crawled:
                    url_lists = url_lists[0:2]

                for url in url_lists:

                        try:
                            page.goto(url, wait_until="load", timeout=25000)
                        except:
                            pass

                        title = page.locator("div.info-top").inner_text()

                        username = page.locator("div.info-bar div.info-bottom div.username a").first.inner_text()

                        raw_date = page.locator("div.info-bar div.info-bottom div.date").first.inner_text()
                        clean_date = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', raw_date, flags=re.IGNORECASE)
                        clean_date = re.sub(r'\(.*?\)', '', clean_date).strip()
                        clean_date = clean_date.title()
                        month = clean_date.split()[0]
                        fmt = "%b %d, %Y" if len(month) <= 3 else "%B %d, %Y"
                        date = datetime.strptime(clean_date, fmt).date()

                        tags_locator = page.locator("div.tags a")
                        if tags_locator.count():
                            tags = tags_locator.all_inner_texts()
                        else:
                            tags = []

                        visits_locator = page.locator("div.visits")
                        visits = visits_locator.inner_text().strip()

                        expire_locator = page.locator("div.expire")
                        expire = expire_locator.inner_text().strip()

                        try:
                            source = page.locator("ol.diff , .post-view ol").first.inner_text(timeout=5000)
                        except:
                            source = None

                        m_content = source.replace("\xa0", " ").strip()

                        cleaned = source.replace("\xa0", " ")
                        cleaned = re.sub(r'[ \t]+', ' ', cleaned)

                        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
                        ip_pattern = r'\b\d{1,3}(?:\.\d{1,3}){3}\b'
                        domain_pattern = r'\b(?:https?://[^\s@]+|www\.[^\s@]+)'

                        emails = list(set(re.findall(email_pattern, cleaned)))
                        ips = list(set(re.findall(ip_pattern, cleaned)))
                        domains = list(set(re.findall(domain_pattern, cleaned)))

                        content_type = ["leak"]
                        if helper_method.is_code(m_content):
                            content_type.append('code')

                        card_data = social_model(
                            m_title=title,
                            m_channel_url=page.url,
                            m_message_sharable_link=page.url,
                            m_content=m_content,
                            m_network=helper_method.get_network_type(self.base_url),
                            m_content_type=content_type,
                            m_platform="pastebin",
                            m_message_date=date,
                            m_post_tags=tags,
                            m_post_views=visits,
                            m_post_expiry=expire,
                        )

                        entity_data = entity_model(
                            m_scrap_file=self.__class__.__name__,
                            m_username=[username],
                            m_ip=ips,
                            m_email=emails,
                            m_weblink=domains,
                        )

                        self.append_leak_data(card_data, entity_data)

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))

