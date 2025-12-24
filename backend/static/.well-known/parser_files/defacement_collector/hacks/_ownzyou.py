from abc import ABC
from datetime import datetime
from typing import List
from urllib.parse import urljoin

from playwright.sync_api import Page
from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.defacement_model import defacement_model
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _ownzyou(leak_extractor_interface, ABC):
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
            cls._instance = super(_ownzyou, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://ownzyou.com"

    @property
    def developer_signature(self) -> str:
        return "Usman Ali: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qDMP"

    @property
    def base_url(self) -> str:
        return "https://ownzyou.com/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_fetch_proxy=FetchProxy.NONE,
            m_fetch_config=FetchConfig.PLAYRIGHT,
            m_threat_type=ThreatType.DEFACEMENT,
            m_resoource_block=False)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://ownzyou.com/contact"

    def append_leak_data(self, leak: defacement_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    @staticmethod
    def safe_find(page: Page, selector: str, attr: str = None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception as e:
            print("Error type:", type(e).__name__)
            return ""

    def parse_leak_data(self, page):

        max_pages = 2 if self.is_crawled else 100
        current_page = 1
        consecutive_errors = 0

        while current_page <= max_pages:
            try:
                page.wait_for_load_state("domcontentloaded")
                page.wait_for_selector("table tbody tr", timeout=30000)

                mirror_links = []
                for a in page.query_selector_all("table tbody tr td a.btn.btn-outline-primary"):
                    href = a.get_attribute("href")
                    if href:
                        mirror_links.append(urljoin(self.base_url, href))

                for idx, mirror_url in enumerate(mirror_links, 1):
                    detail_page = None
                    try:
                        detail_page = page.context.new_page()
                        detail_page.goto(mirror_url, timeout=30000)
                        detail_page.wait_for_load_state("networkidle")
                        detail_page.wait_for_selector("#attacker_name, .card-body", timeout=20000)

                        reporter = self.safe_find(detail_page, "#attacker_name") or self.safe_find(
                            detail_page, "p:has(i.fa-user-secret) strong")
                        web_url = self.safe_find(detail_page, "#remote_zone_url", "href")
                        ip = self.safe_find(detail_page, "#zone_ip")
                        total_report = self.safe_find(detail_page, "#total_report")
                        report_date_str = self.safe_find(detail_page, "#report_date")
                        location = self.safe_find(detail_page, "#zone_location")
                        mode = self.safe_find(detail_page, "#mirror_path_full")
                        web_server = self.safe_find(detail_page, "#zone_web_server")

                        date_obj = None
                        if report_date_str:
                            for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M"):
                                try:
                                    date_obj = datetime.strptime(report_date_str, fmt).date()
                                    break
                                except ValueError:
                                    continue
                            if date_obj is None:
                                log.g().w(f"Date parse failed for {report_date_str}")

                        iframe_src = ""
                        iframe = detail_page.query_selector("iframe#mirror_path")
                        if iframe:
                            src = iframe.get_attribute("src")
                            if src:
                                iframe_src = urljoin(self.base_url, src)

                        content = helper_method.extract_refhtml(
                            ip,
                            self.invoke_db,
                            REDIS_COMMANDS,
                            CUSTOM_SCRIPT_REDIS_KEYS,
                            RAW_PATH_CONSTANTS,
                            detail_page)

                        card_data = defacement_model(
                            m_web_server=[web_server] if web_server else [],

                            m_source_url=[mirror_url],
                            m_content=content,
                            m_base_url=self.base_url,
                            m_url=mirror_url,
                            m_ioc_type=["hacked"],
                            m_mirror_links=[iframe_src] if iframe_src else [],
                            m_network=helper_method.get_network_type(self.base_url),
                            m_leak_date=date_obj)

                        entity_data = entity_model(
                            m_scrap_file=self.__class__.__name__,
                            m_ip=[ip] if ip else [],
                            m_attacker=[reporter] if reporter else [],
                            m_weblink=[web_url] if web_url else [],
                            m_vulnerability=mode if mode else "",
                            m_location=location,
                            m_total_report=total_report)

                        self.append_leak_data(card_data, entity_data)

                        detail_page.close()

                    except Exception as ex:
                        log.g().e(f"Mirror error {mirror_url}: {ex}")

                    finally:
                        if detail_page is not None:
                            try:
                                detail_page.close()
                            except Exception as ex:
                                log.g().e(f"Mirror error {mirror_url}: {ex}")
                                pass

                try:
                    next_button = (page.query_selector("ul.pagination li.next a") or page.query_selector(
                        "ul.pagination li a:has-text('Next')") or page.query_selector("a.page-link[rel='next']"))
                    if next_button:
                        first_row = page.query_selector("table tbody tr")
                        first_row_text = first_row.inner_text() if first_row else ""
                        next_button.click()
                        page.wait_for_load_state("networkidle")
                        page.wait_for_function(
                            "(prev) => document.querySelector('table tbody tr') && document.querySelector('table tbody tr').innerText !== prev",
                            arg=first_row_text,
                            timeout=20000, )
                        current_page += 1
                        consecutive_errors = 0
                    else:
                        log.g().i("No next button found — pagination finished.")
                        break

                except Exception as e:
                    log.g().w(f"Pagination failed on page {current_page}: {e}")
                    break

            except Exception as ex:
                log.g().e(f"Archive page error {current_page}: {ex}")
                consecutive_errors += 1
                if consecutive_errors >= 5:
                    log.g().e("Too many consecutive archive errors. Stopping.")
                    break
                current_page += 1
