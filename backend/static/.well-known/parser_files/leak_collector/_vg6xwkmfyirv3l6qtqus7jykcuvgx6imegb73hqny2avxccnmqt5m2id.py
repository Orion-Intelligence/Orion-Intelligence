from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import datetime

class _vg6xwkmfyirv3l6qtqus7jykcuvgx6imegb73hqny2avxccnmqt5m2id(leak_extractor_interface, ABC):
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
            cls._instance = super(_vg6xwkmfyirv3l6qtqus7jykcuvgx6imegb73hqny2avxccnmqt5m2id, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://vg6xwkmfyirv3l6qtqus7jykcuvgx6imegb73hqny2avxccnmqt5m2id.onion/"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://vg6xwkmfyirv3l6qtqus7jykcuvgx6imegb73hqny2avxccnmqt5m2id.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_resoource_block=False, m_timeout = 27200, m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://vg6xwkmfyirv3l6qtqus7jykcuvgx6imegb73hqny2avxccnmqt5m2id.onion/contact"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state('networkidle')
        elapsed = 0
        while elapsed < 10000:
            cards = page.query_selector_all("div[style*='background-color: var(--card)']")
            if len(cards) >= 3:
                break
            page.wait_for_timeout(5000)
            elapsed += 5000

        cards = page.query_selector_all("div[style*='background-color: var(--card)']")


        for card in cards:
            title_el = card.query_selector("h2")
            title = title_el.inner_text().strip() if title_el else "N/A"

            desc_el = card.query_selector("p")
            description = desc_el.inner_text().strip() if desc_el else "N/A"

            release_date_el = card.query_selector("div[style*='font-size: 0.875rem'] span")
            release_date_text = release_date_el.inner_text().strip() if release_date_el else "N/A"

            if release_date_text != "N/A":
                try:
                    date_obj = datetime.strptime(release_date_text, "%B %d, %Y").date()
                except ValueError:
                    date_obj = None
            else:
                date_obj = None

            card_data = leak_model(
                m_title=title,
                m_url=page.url,
                m_base_url=self.base_url,
                m_screenshot=helper_method.get_screenshot_base64(page,title,self.base_url),
                m_content=description,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=description[:500],
                m_dumplink=[page.url],
                m_content_type=["leaks"],
                m_leak_date=date_obj

            )

            entity_data = entity_model(
                m_team="GLOBAL GROUP",
            )

            self.append_leak_data(card_data, entity_data)





