from abc import ABC
from datetime import datetime
from typing import List

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _ijzn3sicrcy7guixkzjkib4ukbiilwc3xhnmby4mcbccnsd7j2rekvqd(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self._redis_instance = redis_controller()
        self._is_crawled = False

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls, callback=None):
        if cls._instance is None:
            cls._instance = super(_ijzn3sicrcy7guixkzjkib4ukbiilwc3xhnmby4mcbccnsd7j2rekvqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        # BYPASS: Feed the orchestrator a blank page so it doesn't crash on its wait_until="load" line.
        return "about:blank"

    @property
    def base_url(self) -> str:
        # Keep the base_url intact, as we need it for our actual manual navigation
        return "http://ijzn3sicrcy7guixkzjkib4ukbiilwc3xhnmby4mcbccnsd7j2rekvqd.onion"

    @property
    def rule_config(self) -> RuleModel:
        # SPEED BOOST: Set m_resoource_block to True to block heavy images over Tor
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=True,
                         m_threat_type=ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://ijzn3sicrcy7guixkzjkib4ukbiilwc3xhnmby4mcbccnsd7j2rekvqd.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback and self.callback():
            self._card_data.clear()
            self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            base_url = self.base_url

            # --- SAFE MANUAL INITIALIZATION (THE BYPASS HACK) ---
            # We are doing the job the orchestrator failed to do, but safely and with retries!
            initial_connect = False
            for attempt in range(3):
                try:
                    # wait_until="domcontentloaded" completely prevents the Tor timeout
                    page.goto(base_url, wait_until="domcontentloaded", timeout=60000)
                    initial_connect = True
                    break
                except Exception as e:
                    page.wait_for_timeout(5000)

            if not initial_connect:
                # Exit gracefully instead of crashing the whole collector
                return
                # ----------------------------------------------------

            visited_hrefs = set()
            max_page = 10000 if not self.is_crawled else 3

            # 1. Main Pagination Loop
            for current_page in range(1, max_page):
                try:
                    # FIX: Clear cookies to prevent 400 Bad Request header size limits
                    page.context.clear_cookies()
                    page.goto(f"{base_url}/?page={current_page}", timeout=60000)

                    try:
                        page.wait_for_selector('.item_box-title', timeout=15000)
                        href_elements = page.query_selector_all('.item_box-title')
                    except:
                        href_elements = page.query_selector_all("a:has-text('Learn More')")

                    if not href_elements:
                        break

                    current_page_hrefs = []
                    for element in href_elements:
                        href = element.get_attribute("href")
                        if href:
                            absolute_href = f"{base_url}{href}" if href.startswith('/') else href

                            if absolute_href not in visited_hrefs:
                                current_page_hrefs.append(absolute_href)
                                visited_hrefs.add(absolute_href)

                    if not current_page_hrefs:
                        break

                except Exception as ex:
                    break

                # 2. Extract Full Data From Detail Pages
                global_error_count = 0
                for index, href in enumerate(current_page_hrefs):
                    try:
                        page.goto(href, timeout=60000)

                        # Added fallback in case the detail page is also missing CSS
                        try:
                            page.wait_for_selector('.item_box', timeout=15000)
                            boxes = page.query_selector_all('.item_box')
                            box = boxes[0] if boxes else page
                        except:
                            box = page

                        description_element = box.query_selector('.col-md-8.col-xl-6')
                        description = description_element.inner_text().strip() if description_element else ""

                        title_element = page.query_selector('.page_title')
                        title = title_element.inner_text().strip() if title_element else ""

                        company_url = ""
                        company_url_element = box.query_selector('.item_box-info__link')
                        if company_url_element:
                            company_url = company_url_element.get_attribute("href")

                        if company_url and company_url.startswith("http://https://"):
                            company_url = company_url.replace("http://https://", "https://")

                        important_content = " ".join(description.split()[:500])

                        ref_html = helper_method.extract_refhtml(company_url, self.invoke_db, REDIS_COMMANDS,
                                                                 CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS,
                                                                 page) if company_url else ""

                        info_items = page.query_selector_all("div.item_box-info__item.d-flex.align-items-center")
                        parsed_date = None
                        if len(info_items) >= 2:
                            date_text = info_items[1].text_content().strip()
                            try:
                                parsed_date = datetime.strptime(date_text, "%b %d, %Y").date()
                            except:
                                parsed_date = None

                        card_data = leak_model(
                            m_ref_html=ref_html,
                            m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
                            m_title=title,
                            m_url=href,
                            m_base_url=base_url,
                            m_content=description,
                            m_network=helper_method.get_network_type(base_url),
                            m_important_content=important_content,
                            m_content_type=["leaks"],
                            m_weblink=[company_url] if company_url else [],
                            m_leak_date=parsed_date,
                        )

                        entity_data = entity_model(
                            m_scrap_file=self.__class__.__name__,
                            m_company_name=title,
                            m_team="qilin blog"
                        )

                        self.append_leak_data(card_data, entity_data)
                        global_error_count = 0

                    except Exception as ex:
                        global_error_count += 1
                        if global_error_count >= 3:
                            break

        except Exception as ex:
            raise