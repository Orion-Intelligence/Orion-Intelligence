from abc import ABC
from typing import List
from datetime import datetime
from playwright.sync_api import Page
import re

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method

class _ransomfeed(leak_extractor_interface, ABC):
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
            cls._instance = super(_ransomfeed, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://ransomfeed.it/frontend-core-v2/?page=dash-table"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Hannan Zahid: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hOii"

    @property
    def base_url(self) -> str:
        return "https://ransomfeed.it"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK, m_resoource_block=False)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://cert.ransomfeed.it/contact_page.php"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        if self.is_crawled:
            max_pages=10
        else:
            page.wait_for_selector('ul.pagination.justify-content-center', timeout=10000)
            last_page_location = page.locator('nav.mt-3 > ul.pagination.justify-content-center > li').last
            last_page_url = last_page_location.locator('a.page-link').get_attribute('href')

            match = re.search(r"x=(\d+)", last_page_url)

            if match:
                max_pages = int(match.group(1))
                log.g().i(f"Max pages found: {max_pages}")
            else:
                max_pages = 117
                log.g().w("Regex failed to find number. Defaulting to 117.")

        for i in range(1, max_pages + 1):
            target_url = f"https://ransomfeed.it/frontend-core-v2/?page=dash-table&x={i}"
            page.goto(target_url, wait_until="networkidle")

            try:
                page.wait_for_selector("table#dashTable", timeout=15000)
            except Exception:
                log.g().e("Cloudflare challenge took too long or blocked the script.")
                continue

            victim_urls = []
            rows = page.locator("table#dashTable tbody > tr").all()
            for row in rows:
                cells = row.locator("td").all()

                if len(cells) < 3:
                    continue

                victim_url = cells[2].locator("a").get_attribute("href")
                url = 'https://ransomfeed.it/' + victim_url
                victim_urls.append(url)

            for url in victim_urls:
                try:
                    page.goto(url, wait_until="networkidle")

                    victim_name = page.locator("p.mb-0.text-muted").first.inner_text().strip()
                    group = page.locator("p.mb-0 a").first.inner_text().strip()

                    rows = page.locator("table.table.table-striped.table-hover.rsf-table > tbody > tr").all()

                    description = "N/D"
                    post_date = None
                    country = None
                    domain_name = "N/D"
                    domain_links = None
                    industry_sector = None
                    publish_datasize = None

                    if len(rows) < 7:
                        description = "N/D"

                    for row01 in rows:
                        cell = row01.locator("td").all()
                        key = cell[0].inner_text().strip()
                        value = cell[1].inner_text().strip()
                        if "Data Rilevamento" in key:
                            if value is None or len(value) == 0:
                                post_date = None
                            else:
                                dt_object = datetime.strptime(value, "%d-%m-%Y %H:%M:%S")
                                post_date = dt_object.date()

                        elif "Località Obiettivo" in key:
                            if value is None or len(value) == 0:
                                country = ""
                            else:
                                country = value

                        elif "Dominio Obiettivo" in key:
                            code_tag = cell[1].locator("code")
                            domain = code_tag.inner_text().strip()
                            if domain is None or len(domain) == 0:
                                domain_name = "N/D"
                            else:
                                domain_name = domain

                            link_tag = cell[1].locator("a")
                            link = link_tag.get_attribute("href")
                            if link is None or len(link) == 0:
                                domain_links = None
                            else:
                                domain_links = "https://ransomfeed.it" + link

                        elif "Settore Economico" in key:
                            if value is None or len(value) == 0:
                                industry_sector = None
                            else:
                                industry_sector = value

                        elif "Dati Pubblicati" in key:
                            if value is None or len(value) == 0:
                                publish_datasize = None
                            else:
                                publish_datasize = value

                        elif "Descrizione" in key:
                            if value is None or len(value) == 0:
                                description = "N/D"
                            else:
                                description = value
                    ref_html = helper_method.extract_refhtml(domain_links, self.invoke_db, REDIS_COMMANDS,CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)
                    card_data = leak_model(
                        m_ref_html=ref_html,
                        m_title = victim_name,
                        m_url = url,
                        m_base_url = self.base_url,
                        m_content = description,
                        m_leak_date = post_date,
                        m_network = helper_method.get_network_type(self.base_url),
                        m_important_content = description[:150],
                        m_weblink = [domain_links],
                        m_content_type = ["leaks"],
                        m_screenshot=helper_method.get_screenshot_base64(page, victim_name, self.base_url),
                        m_data_size = publish_datasize
                    )

                    entity_data = entity_model(
                        m_scrap_file = self.__class__.__name__,
                        m_team = group,
                        m_company_name = victim_name,
                        m_country = [country] if country else [],
                        m_industry = industry_sector,
                    )

                    self.append_leak_data(card_data, entity_data)

                except Exception as e:
                    log.g().e(f"Error processing victim page {url}: {e}")
                    continue