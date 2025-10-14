import re

from abc import ABC
from typing import List
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method

class _cert(leak_extractor_interface, ABC):
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
            cls._instance = super(_cert, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://cert.ir/security-alerts"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Hassan Arshad: owEBeAKH/ZANAwAKAbKjqaChU0IoAcsxYgBoei5jVmVyaWZpZWQgZGV2ZWxvcGVyOiBNdWhhbW1hZCBIYXNzYW4gQXJzaGFkCokCMwQAAQoAHRYhBD5p3c9aqX5fJ9SIZbKjqaChU0IoBQJoei5jAAoJELKjqaChU0Io2i8QAKRGGxAbMJGV97ym5wcir4mn2es2/npd+MFDa/LZFnkcoPOP9/fKtg9pZ1a2PVa0h9s5ewU6wGJ4HIvjP/2gxd1maDIjv6IM+5mtlpJvQJhzoqHdAg//IRwJU5QO2krqxBQrtcvNwfkW1IoNSEaJCr0EmXht3rkGhkJ3J3XqEvrBeH0DtaZLnCLOJ3eTIRleqbBOUdq2Uf9hDZZY9rdqynjjsADo1lhchdyPjwBz1g8M/q1Ud3sTUA+/8gas5l15jR9SGQZxbgnzZRjG19oq5GAhLwUYgKuoH+zANQEB7leF9jBudzYz2Ey/4BglnVE6kszUo7RxPoqtNOFvq6WzCcRKPLO323sLfFYtwXDwvJ0iviVTOwrbXlA80GFANcAbSR76nN0XrsaLM2L/KT6oe0wTVq35j1QZnt4Jq5PWALA8hQNr7w1KtuwnpN5PmE741h+9OfZP2ogd9ERbmGb10DROsd9t4RL4hpxpsCoekHRbLI3XmHFZqFAB/GgF194Tmh3LcoIAcwOYty/PVDuPYMGMmm5Nttg2vvVrMg82P0LeOrIN2Mq03HCiZm/HaOvePniPg+EeaWPMiVmGWvCJUOMI/TJRz4jVLR4BUlvoiUSNBWrJhxMRQZpViam2rVUaojPaZhzoIF4sqS6hYqzZbbXHwtYjJfNOHh00gucABJHw=gmDH"

    @property
    def base_url(self) -> str:
        return "https://cert.ir"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.REQUESTS, m_resoource_block=False, m_threat_type=ThreatType.TRACKING)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://cert.ir"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page):
        try:
            seed_url = self.seed_url
            base_url = self.base_url
            is_first_crawl = not self.is_crawled
            min_year = 2023 if is_first_crawl else 2024
            visited_urls = set()
            resp = getattr(page, "_seed_response", None)
            if resp and hasattr(resp, "text"):
                current_html = resp.text
            else:
                resp = page.get(seed_url, timeout=60)
                resp.raise_for_status()
                page._seed_response = resp
                current_html = resp.text
            has_next = True
            while has_next:
                soup = BeautifulSoup(current_html, "html.parser")
                rows = soup.select("tr.news-page")
                stop_pagination = False
                for row in rows:
                    title_td = row.select_one("td.alert-title a[href]")
                    card_url = urljoin(seed_url, title_td["href"]) if title_td and title_td.get("href") else None
                    title = title_td.get_text(strip=True) if title_td else ""
                    date_td = row.select_one("td.release-date time.datetime")
                    persian_date = date_td.get_text(strip=True) if date_td else ""
                    gregorian_datetime = date_td.get("datetime") if date_td and date_td.has_attr("datetime") else ""
                    gregorian_year = None
                    if gregorian_datetime:
                        m = re.match(r"(\d{4})", gregorian_datetime)
                        if m:
                            try:
                                gregorian_year = int(m.group(1))
                            except:
                                gregorian_year = None
                    else:
                        m = re.match(r"(1[34]\d{2})", persian_date)
                        if m:
                            try:
                                persian_year = int(m.group(1))
                                gregorian_year = persian_year - 1403 + 2024
                            except:
                                gregorian_year = None
                    if not gregorian_year or gregorian_year < min_year:
                        stop_pagination = True
                        break
                    if not card_url or card_url in visited_urls:
                        continue
                    visited_urls.add(card_url)
                    try:
                        detail_resp = page.get(card_url, timeout=60)
                        detail_resp.raise_for_status()
                        detail_soup = BeautifulSoup(detail_resp.text, "html.parser")
                        main_section = detail_soup.select_one("div.node__main-content-section")
                        content = ""
                        if main_section:
                            content_div = main_section.select_one("div[property='schema:text']")
                            content = content_div.get_text(strip=True) if content_div else ""
                        published_date = gregorian_datetime if gregorian_datetime else persian_date
                        if published_date and "T" in published_date:
                            published_date = published_date.split("T")[0]
                        date_obj = None
                        if published_date:
                            try:
                                date_obj = datetime.strptime(published_date, "%Y-%m-%d").date()
                            except:
                                date_obj = None
                        weblinks = []
                        if main_section:
                            for a in main_section.select("a[href]"):
                                href = a.get("href")
                                if href and (href.startswith("http://") or href.startswith("https://")):
                                    weblinks.append(href)
                        card_data = leak_model(
                            m_title=title,
                            m_url=card_url,
                            m_base_url=base_url,
                            m_content=content,
                            m_network=helper_method.get_network_type(base_url),
                            m_important_content=content[:500],
                            m_weblink=weblinks,
                            m_content_type=["news", "tracking"],
                            m_leak_date=date_obj,
                        )
                        entity_data = entity_model(
                            m_scrap_file=self.__class__.__name__,
                            m_team="cert",
                            m_country=["iran"],
                        )
                        self.append_leak_data(card_data, entity_data)
                    except Exception as ex:
                        log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                if stop_pagination:
                    break
                next_btn = soup.select_one("li.pager__item.pager__item--next a[rel='next']")
                if next_btn and next_btn.get("href"):
                    next_url = urljoin(seed_url, next_btn.get("href"))
                    try:
                        resp = page.get(next_url, timeout=60)
                        resp.raise_for_status()
                        current_html = resp.text
                    except Exception as ex:
                        log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                        break
                else:
                    has_next = False
        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))