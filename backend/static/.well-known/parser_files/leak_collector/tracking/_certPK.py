import pdfplumber
import requests
from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method

class _certPK(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_certPK, cls).__new__(cls)
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
        return "https://pkcert.gov.pk/advisories.asp"

    @property
    def base_url(self) -> str:
        return "https://pkcert.gov.pk"

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

    def parse_leak_data(self, page: Page):
        try:
            page.goto(self.seed_url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_load_state("networkidle")
        except Exception as e:
            return

        for num in range(40, 3, -1):
            url = f"https://pkcert.gov.pk/advisory/25/{num}.pdf"
            self._process_pdf(url, year=2025, num=num)

        for num in range(23, 0, -1):
            url = f"https://pkcert.gov.pk/advisory/24-{num}.pdf"
            self._process_pdf(url, year=2024, num=num)

        self._is_crawled = True

    def _process_pdf(self, url: str, year: int, num: int):
        try:

            r = requests.get(url, timeout=30)
            if r.status_code != 200:
                return

            with open("temp.pdf", "wb") as f:
                f.write(r.content)

            all_text = []
            with pdfplumber.open("temp.pdf") as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        all_text.append(text.strip())

            if not all_text:
                return

            heading = all_text[0].split("\n")[0]
            content = "\n".join(all_text)

            card = leak_model(
                m_screenshot="",
                m_title=heading,
                m_weblink=[url],
                m_dumplink=[url],
                m_url=url,
                m_base_url=self.base_url,
                m_content=content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=content,
                m_content_type=["news"],
                m_leak_date=None,
            )
            entity_data = entity_model(m_team="pkcert advisories")
            self.append_leak_data(card, entity_data)

        except Exception as e:
            log.g().e(f"SCRIPT ERROR {e} " + str(self.__class__.__name__))