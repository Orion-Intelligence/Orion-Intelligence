from abc import ABC
from typing import List
from playwright.sync_api import Page
from datetime import datetime
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method

class _bsigermany(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_bsigermany, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, callback=None):
        if self._initialized:
            return
        self.callback = callback
        self._card_data: List[leak_model] = []
        self._entity_data: List[entity_model] = []
        self._redis_instance = redis_controller()
        self._is_crawled = False
        self._initialized = True

    def init_callback(self, callback=None):
        self.callback = callback

    @property
    def seed_url(self) -> str:
        return "https://www.bsi.bund.de/EN"

    @property
    def base_url(self) -> str:
        return "https://www.bsi.bund.de"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Abdullah:owGbwMvMwMEYdOzLoajv79gZTxskMWRU6bi8370 / LLUoMy0zNUUhJbUsNSe / ILXISsG3NCMxNzcxRcExKaU0Jycxg5erYzMLAyMHg6yYIkuQ4M9 / l7siYpT2b / oFM5GVCWQcAxenAEykRYSFYcHRJWUetXMKmo78Ec5ueHZq52rX / vuHpJTf / G31ULsywdC23 + fM4tmaUbP2cXYm7y9kPHnAdbXgspWerkeXW8ZYmm2xrpdTF / Yyvi0aGdn5iMne8PQGgSgWxeOMKUo8IQvL3W1PN4gtYYkxfr6kMZ3t0tmSRR2qnu / fZ2yfqfdm9szOQpt2AA ===weDX"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE,m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False,m_threat_type=ThreatType.TRACKING)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return self.base_url

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback and self.callback():
            self._card_data.clear()
            self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.goto(self.seed_url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_load_state("networkidle")

            all_messages = page.query_selector("span.c-more__button-text--forward")
            if all_messages:
                all_messages.click()
                page.wait_for_load_state("networkidle")

            all_links = []
            teaser_count = len(page.query_selector_all("div.c-search-result-teaser__wrapper"))

            for i in range(teaser_count):
                teasers = page.query_selector_all("div.c-search-result-teaser__wrapper")
                if i < len(teasers):
                    teasers[i].click()
                    page.wait_for_load_state("networkidle")
                    url = page.url
                    if "/Presse" in url:
                        all_links.append(url)

                    page.go_back()
                    page.wait_for_load_state("networkidle")

            forward_btn = page.query_selector("a.forward.button")
            if forward_btn:
                forward_btn.click()
                page.wait_for_load_state("networkidle")

                teaser_count = len(page.query_selector_all("div.c-search-result-teaser__wrapper"))

                for i in range(teaser_count):
                    teasers = page.query_selector_all("div.c-search-result-teaser__wrapper")
                    if i < len(teasers):
                        teasers[i].click()
                        page.wait_for_load_state("networkidle")

                        url = page.url
                        if "/Presse" in url:
                            all_links.append(url)

                        page.go_back()
                        page.wait_for_load_state("networkidle")

            all_links = all_links[:25]

            for idx, url in enumerate(all_links, 1):
                page.goto(url, wait_until="domcontentloaded", timeout=30000)

                title = page.query_selector("h1.c-intro__headline").text_content().strip()

                date_obj = None
                city_elements = page.query_selector_all("p.docData span.value")
                if len(city_elements) > 1:
                    date_text = city_elements[1].inner_text().strip()
                    for fmt in ["%d.%m.%Y", "%Y-%m-%d", "%d/%m/%Y"]:
                        try:
                            date_obj = datetime.strptime(date_text, fmt).date()
                            break
                        except:
                            continue

                content_lines = []

                paragraphs = page.query_selector_all("div.l-content-wrapper p, div.s-richtext p, #content p")
                for p in paragraphs:
                    text = p.inner_text().strip()
                    if (text and len(text) > 20 and
                            not text.startswith("Navigation") and
                            not "Pressekontakt:" in text and
                            not "Tel.:" in text and
                            not "E-Mail:" in text and
                            not text.startswith("city") and
                            not text.startswith("date")):
                        content_lines.append(text)

                content = "\n\n".join(content_lines) if content_lines else "No content"
                first_two_lines = "\n".join(content_lines[:2]) if content_lines else "No content"

                leak_obj = leak_model(
                    m_title=title,
                    m_weblink=[url],
                    m_dumplink=[url],
                    m_url=url,
                    m_base_url=self.base_url,
                    m_content=content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=first_two_lines,
                    m_content_type=["news", "tracking"],
                    m_leak_date=date_obj
                )

                entity_data = entity_model(
                    m_company_name="BSI",
                    m_country=["Germany"],
                    m_team="Federal Office for Information Security"
                )

                self.append_leak_data(leak_obj, entity_data)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} [{self.__class__.__name__}]")