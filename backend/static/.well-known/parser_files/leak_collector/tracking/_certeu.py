from abc import ABC
from typing import List
from playwright.sync_api import Page
from urllib.parse import urljoin
from datetime import datetime

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _certeu(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_certeu, cls).__new__(cls)
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
        return "https://cert.europa.eu/blog"

    @property
    def base_url(self) -> str:
        return "https://cert.europa.eu"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Abdullah:owGbwMvMwMEYdOzLoajv79gZTxskMWRU6bi8370 / LLUoMy0zNUUhJbUsNSe / ILXISsG3NCMxNzcxRcExKaU0Jycxg5erYzMLAyMHg6yYIkuQ4M9 / l7siYpT2b / oFM5GVCWQcAxenAEykRYSFYcHRJWUetXMKmo78Ec5ueHZq52rX / vuHpJTf / G31ULsywdC23 + fM4tmaUbP2cXYm7y9kPHnAdbXgspWerkeXW8ZYmm2xrpdTF / Yyvi0aGdn5iMne8PQGgSgWxeOMKUo8IQvL3W1PN4gtYYkxfr6kMZ3t0tmSRR2qnu / fZ2yfqfdm9szOQpt2AA ===weDX"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_fetch_proxy=FetchProxy.NONE,m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False, m_threat_type=ThreatType.TRACKING)

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
        return self._redis_instance.invoke_trigger(
            command, [key + self.__class__.__name__, default_value, expiry]
        )

    def contact_page(self) -> str:
        return self.base_url

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback and self.callback():
            self._card_data.clear()
            self._entity_data.clear()


    @staticmethod
    def _format_date(dt: str) -> str:
        return datetime.fromisoformat(dt.replace("Z", "")).strftime("%Y-%m-%d")

    def parse_leak_data(self, page: Page):
        targets = [
            {
                "url": "https://cert.europa.eu/blog",
                "country": "European Union",
                "team": "CERT-EU",
                "card_selector": "article.news--articles--item",
                "link_selector": "a",
                "date_selector": "time.news--articles--item--time",
                "date_format": "iso",
                "content_date_selector": "time.text-grey"
            },
            {
                "url": "https://cert.europa.eu/publications/threat-intelligence/2025",
                "country": "European Union",
                "team": "CERT-EU",
                "card_selector": "div.c-teaser__content",
                "link_selector": "h3 > a",
                "date_selector": "p.c-meta",
                "date_format": "%d %b %Y",
                "content_date_selector": ""
            }
        ]

        for target in targets:
            page.goto(target["url"], wait_until="domcontentloaded", timeout=60000)
            page.wait_for_load_state("networkidle")

            cards = page.query_selector_all(target["card_selector"])
            articles = []

            for card in cards[:30]:
                try:
                    link_elem = card.query_selector(target["link_selector"])
                    if not link_elem:
                        continue

                    url = urljoin(self.base_url, link_elem.get_attribute("href"))
                    title = link_elem.inner_text().strip()

                    raw_date = ""
                    if target["date_selector"]:
                        date_elem = card.query_selector(target["date_selector"])
                        if target["date_format"] == "iso" and date_elem:
                            raw_date = date_elem.get_attribute("datetime").strip()
                        elif date_elem:
                            raw_date = date_elem.inner_text().strip()

                    try:
                        date = (
                            datetime.fromisoformat(raw_date.replace("Z", "")).date()
                            if target["date_format"] == "iso"
                            else datetime.strptime(raw_date, target["date_format"]).date()
                        )
                    except Exception:
                        date = None

                    articles.append(
                        (url, title, date, target["country"], target["team"], target["content_date_selector"]))
                except Exception:
                    continue

            for index, (url, title, _, country, team, _) in enumerate(articles):
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=60000)
                    page.wait_for_load_state("networkidle")

                    date = None
                    try:
                        content_date_elem = page.query_selector("time.text-grey[datetime]")
                        if content_date_elem:
                            content_date_raw = content_date_elem.get_attribute("datetime")
                            if content_date_raw:
                                date = datetime.fromisoformat(content_date_raw.replace("Z", "")).date()
                    except Exception:
                        pass

                    content_elems = page.query_selector_all("main p, article p")
                    paragraphs = [p.inner_text().strip() for p in content_elems if p.inner_text().strip()]
                    full_content = "\n".join(paragraphs)

                    leak_obj = leak_model(
                        m_title=title,
                        m_weblink=[url],
                        m_dumplink=[url],
                        m_url=url,
                        m_base_url=self.base_url,
                        m_content=full_content,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=f"{title}\n{full_content}",
                        m_content_type=["news", "tracking"],
                        m_leak_date=date,
                    )

                    entity_data = entity_model(
                        m_team=team,
                        m_country_name=country
                    )

                    entity_data = helper_method.extract_entities(full_content, entity_data)
                    self.append_leak_data(leak_obj, entity_data)

                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} in {self.__class__.__name__}")

