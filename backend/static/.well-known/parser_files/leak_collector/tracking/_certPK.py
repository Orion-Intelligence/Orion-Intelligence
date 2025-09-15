import datetime, re, pdfplumber
import io
from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller


class _certPK(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, callback=None):
        if cls._instance is None:
            cls._instance = super(_certPK, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
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
        return "https://pkcert.gov.pk/get-advisories.asp"

    @property
    def base_url(self) -> str:
        return "https://pkcert.gov.pk"

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_threat_type=ThreatType.TRACKING, m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_javascript=False, m_resoource_block=False)

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
        seen_urls = set()
        start_year = 2020
        current_year = datetime.datetime.now().year
        any_success = False

        for year in range(start_year, current_year + 1):
            cat_id = year % 100
            url = self.seed_url + f"?catId={cat_id}"
            urls_to_process = []

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                anchors = page.locator('div.card-2 a[href$=".pdf"]')
                count = anchors.count()
                for i in range(count):
                    href = anchors.nth(i).get_attribute("href") or ""
                    if not href:
                        continue
                    if not href.startswith("http"):
                        href = self.base_url + href.lstrip("/")
                    if href in seen_urls:
                        continue
                    seen_urls.add(href)

                    title_text = anchors.nth(i).inner_text().strip()
                    m = re.search(r'(\d+)(?:\.pdf)?$', href)
                    num = m.group(1) if m else "unknown"
                    key = f"ADVISORY_PARSED_{year}_{num}"
                    already_parsed = self.invoke_db(command=0, key=key, default_value=False)
                    if not already_parsed:
                        urls_to_process.append((href, year, num, key, title_text))
            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} while fetching advisory list {year}")

            if year == 2025:
                if not any_success:
                    pass
                else:
                    urls_to_process = urls_to_process[:6]

            for href, year, num, key, title_text in urls_to_process:
                try:
                    if href.lower().endswith(".pdf"):
                        response = page.request.get(href, timeout=60000)
                    else:
                        page.goto(href, wait_until="load", timeout=60000)
                        response = page.request.get(href, timeout=60000)

                    if response.status != 200 or "application/pdf" not in response.headers.get("content-type", "").lower():
                        continue

                    all_text = ""
                    try:
                        with pdfplumber.open(io.BytesIO(response.body())) as pdf:
                            for p in pdf.pages:
                                text = p.extract_text()
                                if text:
                                    all_text += text + "\n"
                    except:
                        continue

                    if not all_text.strip():
                        continue

                    heading = title_text or f"Advisory {year}-{num}"
                    card = leak_model(
                        m_screenshot="",
                        m_title=heading,
                        m_weblink=[href],
                        m_dumplink=[href],
                        m_url=href,
                        m_base_url=self.base_url,
                        m_content=all_text,
                        m_network="clearnet",
                        m_important_content=all_text[:200],
                        m_content_type=["tracking"],
                        m_leak_date=None,
                    )
                    entity = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_name=f"PKCERT Advisory {year}-{num}"
                    )
                    self.append_leak_data(card, entity)

                    self.invoke_db(command=1, key=key, default_value=True)
                    any_success = True

                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
