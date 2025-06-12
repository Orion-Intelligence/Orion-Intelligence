from abc import ABC
from typing import List

from bs4 import BeautifulSoup
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import datetime

class _47glxkuxyayqrvugfumgsblrdagvrah7gttfscgzn56eyss5wg3uvmqd(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls, callback=None):
        if cls._instance is None:
            cls._instance = super(_47glxkuxyayqrvugfumgsblrdagvrah7gttfscgzn56eyss5wg3uvmqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "https://47glxkuxyayqrvugfumgsblrdagvrah7gttfscgzn56eyss5wg3uvmqd.onion"

    @property
    def base_url(self) -> str:
        return "https://47glxkuxyayqrvugfumgsblrdagvrah7gttfscgzn56eyss5wg3uvmqd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT)

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

                    soup = BeautifulSoup(detail_page.content(), "html.parser")

                    title = soup.find("h1").get_text(strip=True)

                    def get_text_after_span(label):
                        span = soup.find("span", string=lambda s: s and label in s)
                        return span.find_next("p").get_text(strip=True) if span else ""

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
                    for link in soup.select(".buttons__column a.but_main[href]"):
                        href = link.get("href").strip()
                        full_url = base_url + href if href.startswith("/") else href
                        dump_links.append(full_url)

                    desc_div = soup.select_one("div.row.mt-3 div.filling")
                    description = desc_div.get_text(" ", strip=True) if desc_div else ""

                    full_text = f"Title: {title} | Revenue: {revenue} | Country: {country} | Date: {leak_date_raw} | Size: {size} | {description}"

                    is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
                    ref_html = None
                    if is_crawled != -1 and is_crawled < 5:
                        ref_html = helper_method.extract_refhtml(title)
                        if ref_html:
                            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
                        else:
                            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

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
                        m_email=helper_method.extract_emails(full_text),
                        m_company_name=title,
                        m_ip=[title],
                        m_country_name=country,
                        m_location=[country],
                        m_team="underground"
                    )
                    entity_data = helper_method.extract_entities(full_text, entity_data)

                    self.append_leak_data(card_data, entity_data)

                    detail_page.close()
                    error_count = 0

                except Exception:
                    error_count += 1
                    if error_count >= 3:
                        break

        except Exception as e:
            print(f"An error occurred while parsing leak data: {e}")
