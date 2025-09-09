from abc import ABC
from datetime import datetime
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _foorilla(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_foorilla, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self._redis_instance = redis_controller()
        self._is_crawled = False

    def contact_page(self) -> str:
        return self.base_url

    def init_callback(self, callback=None):
        self.callback = callback

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://foorilla.com/media/"

    @property
    def base_url(self) -> str:
        return "https://foorilla.com"

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(
            command, [key + self.__class__.__name__, default_value, expiry]
        )

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_threat_type=ThreatType.NEWS,m_fetch_proxy=FetchProxy.NONE,m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False)

    @property
    def card_data(self) -> List[RuleModel]:
        return self._card_data

    @property
    def entity_data(self) -> List[RuleModel]:
        return self._entity_data

    @property
    def developer_signature(self) -> str:
        return "Muhammad Abdullah:owGbwMvMwMEYdOzLoajv79gZTxskMWRU6bi8370 / LLUoMy0zNUUhJbUsNSe / ILXISsG3NCMxNzcxRcExKaU0Jycxg5erYzMLAyMHg6yYIkuQ4M9 / l7siYpT2b / oFM5GVCWQcAxenAEykRYSFYcHRJWUetXMKmo78Ec5ueHZq52rX / vuHpJTf / G31ULsywdC23 + fM4tmaUbP2cXYm7y9kPHnAdbXgspWerkeXW8ZYmm2xrpdTF / Yyvi0aGdn5iMne8PQGgSgWxeOMKUo8IQvL3W1PN4gtYYkxfr6kMZ3t0tmSRR2qnu / fZ2yfqfdm9szOQpt2AA ===weDX"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    @staticmethod
    def _text_or_empty(locator):
        try:
            return locator.inner_text(timeout=2000).strip()
        except:
            return ""

    def parse_leak_data(self, page: Page):

        page.goto(self.seed_url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_load_state("networkidle")

        sidebar_items = page.locator("#mc_1 > ul > li")
        total_items = sidebar_items.count()

        for i in range(total_items):
            try:

                title_text = self._text_or_empty(sidebar_items.nth(i))
                content = self._text_or_empty(page.locator("#mc_2 div.px-1.border-bottom.pb-2"))
                date_raw = self._text_or_empty(page.locator("#mc_2 em.text-body-secondary"))

                first_two = ". ".join(content.split(". ")[:2]) if content else ""
                parsed_date = None
                if date_raw:
                    for fmt in ("%b %d, %Y", "%B %d, %Y"):
                        try:
                            parsed_date = datetime.strptime(date_raw, fmt).date()
                            break
                        except:
                            continue

                card = leak_model(
                    m_screenshot="",
                    m_title=title_text,
                    m_weblink=[self.seed_url],
                    m_dumplink=[self.seed_url],
                    m_url=self.seed_url,
                    m_base_url=self.base_url,
                    m_content=content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=first_two,
                    m_content_type=["news"],
                    m_leak_date=parsed_date,
                )
                entity_data = entity_model(m_team="foorilla media")
                self.append_leak_data(card, entity_data)

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))