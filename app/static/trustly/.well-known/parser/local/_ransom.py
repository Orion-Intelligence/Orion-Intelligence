from abc import ABC
from typing import Tuple, Set
from bs4 import BeautifulSoup

from crawler.crawler_instance.local_interface_model.collector_interface import collector_interface
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from crawler.crawler_instance.local_shared_model.leak_data_model import leak_data_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig

class _ransom(collector_interface, ABC):
    _instance = None

    def _init_(self):
        self.soup = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_ransom, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def base_url(self) -> str:
        return "https://ransom.wiki/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    def parse_leak_data(self, page, browser, context, p_data_url: str) -> Tuple[leak_data_model, Set[str]]:
        self.soup = BeautifulSoup(page.content(), 'html.parser')
        data_model = leak_data_model(
            cards_data=[],  # Initialize an empty list for storing cards data
            contact_link=self.contact_page(),
            base_url=self.base_url,
            content_type=["leak"]
        )

        pass
        return data_model, set()

    def contact_page(self) -> str:
        return "https://github.com/soufianetahiri"