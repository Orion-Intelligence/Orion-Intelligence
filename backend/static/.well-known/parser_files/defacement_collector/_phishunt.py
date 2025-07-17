import re
from abc import ABC
from datetime import date
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.defacement_model import defacement_model
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _phishunt(leak_extractor_interface, ABC):
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
            cls._instance = super(_phishunt, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:

        return "https://phishunt.io/feed.txt"

    @property
    def base_url(self) -> str:

        return "https://phishunt.io/feed.txt"

    @property
    def rule_config(self) -> RuleModel:

        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False, m_threat_type=ThreatType.DEFACEMENT)

    @property
    def card_data(self) -> List[defacement_model]:

        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:

        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:

        return "https://phishunt.io/feed.txt"

    def append_leak_data(self, leak: defacement_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            text_content = page.content()
            urls = re.findall(r'https?://[^\s"\'>]+', text_content)

            for i, link in enumerate(urls):
                if not link.startswith(("http://", "https://")):
                    continue

                card_data = defacement_model(
                    m_source_url=[page.url],
                    m_base_url=self.base_url,
                    m_screenshot="",
                    m_content="",
                    m_network=helper_method.get_network_type(self.base_url),
                    m_url=link,
                    m_date_of_leak=date.today(),
                    m_ioc_type=["phishing"],
                )
                entity_data = entity_model(
                    m_team="phishunt",
                    m_ip=[link]
                )

                self.append_leak_data(card_data, entity_data)

        except Exception as e:
            print(f"❌ Error in parse_leak_data: {e}")
