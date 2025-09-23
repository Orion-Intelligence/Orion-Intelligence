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
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _47glxkuxyayqrvugfumgsblrdagvrah7gttfscgzn56eyss5wg3uvmqd(leak_extractor_interface, ABC):
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
            cls._instance = super(_47glxkuxyayqrvugfumgsblrdagvrah7gttfscgzn56eyss5wg3uvmqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "https://47glxkuxyayqrvugfumgsblrdagvrah7gttfscgzn56eyss5wg3uvmqd.onion"

    @property
    def base_url(self) -> str:
        return "https://47glxkuxyayqrvugfumgsblrdagvrah7gttfscgzn56eyss5wg3uvmqd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://47glxkuxyayqrvugfumgsblrdagvrah7gttfscgzn56eyss5wg3uvmqd.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            cards = page.query_selector_all(".col-lg-6")
            base_url = self.base_url

            error_count = 0
            for card in cards:
                try:
                    link_el = card.query_selector("a.stretched-link")
                    if not link_el:
                        continue

                    href = link_el.get_attribute("href")
                    if not href:
                        continue

                    detail_url = href if href.startswith("http") else base_url.rstrip("/") + "/" + href.lstrip("/")

                    detail_page = page.context.new_page()
                    detail_page.goto(detail_url, wait_until="domcontentloaded", timeout=30000)

                    title_el = detail_page.locator("h1")
                    title = title_el.text_content().strip() if title_el.count() else ""

                    def get_text_after_span(label):
                        spans = detail_page.locator(f"span:has-text('{label}')")
                        for i in range(spans.count()):
                            span = spans.nth(i)
                            try:
                                next_p = span.evaluate_handle("el => el.parentElement.querySelector('p')")
                                if next_p:
                                    return next_p.evaluate("el => el.textContent").strip()
                            except:
                                continue
                        return ""

                    revenue = get_text_after_span("Revenue")
                    country = get_text_after_span("Country")
                    leak_date_raw = get_text_after_span("Date")
                    size = get_text_after_span("Size")

                    try:
                        leak_date = datetime.strptime(leak_date_raw, "%m/%d/%Y %H:%M").replace(
                            hour=0, minute=0, second=0, microsecond=0
                        ).date()
                    except Exception:
                        leak_date = None

                    dump_links = []
                    links = detail_page.locator(".buttons__column a.but_main[href]")
                    for i in range(links.count()):
                        href = links.nth(i).get_attribute("href")
                        if href:
                            full_url = base_url + href if href.startswith("/") else href
                            dump_links.append(full_url.strip())

                    desc_el = detail_page.locator("div.row.mt-3 div.filling")
                    description = desc_el.text_content().strip() if desc_el.count() else ""

                    full_text = f"Title: {title} | Revenue: {revenue} | Country: {country} | Date: {leak_date_raw} | Size: {size} | {description}"

                    ref_html = helper_method.extract_refhtml(title , self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                    card_data = leak_model(
                        m_ref_html=ref_html,
                        m_title=title,
                        m_url=detail_url,
                        m_base_url=base_url,
                        m_screenshot=helper_method.get_screenshot_base64(detail_page, None, self.base_url),
                        m_content=full_text,
                        m_network=helper_method.get_network_type(base_url),
                        m_important_content=description[:500],
                        m_weblink=[],
                        m_dumplink=dump_links,
                        m_content_type=["leaks"],
                        m_revenue=revenue,
                        m_leak_date=leak_date,
                        m_data_size=size,
                    )

                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_company_name=title,
                        m_country=[country],
                        m_location=[country],
                        m_team="underground"
                    )

                    self.append_leak_data(card_data, entity_data)

                    detail_page.close()
                    error_count = 0

                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                    error_count += 1
                    if error_count >= 3:
                        break

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            raise
