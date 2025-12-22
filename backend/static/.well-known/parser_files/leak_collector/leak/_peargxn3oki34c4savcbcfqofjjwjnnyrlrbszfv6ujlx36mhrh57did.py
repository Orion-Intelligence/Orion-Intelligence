import datetime
import re
from abc import ABC
from typing import List
from urllib.parse import urljoin

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _peargxn3oki34c4savcbcfqofjjwjnnyrlrbszfv6ujlx36mhrh57did(leak_extractor_interface, ABC):
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
            cls._instance = super(_peargxn3oki34c4savcbcfqofjjwjnnyrlrbszfv6ujlx36mhrh57did, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://peargxn3oki34c4savcbcfqofjjwjnnyrlrbszfv6ujlx36mhrh57did.onion"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://peargxn3oki34c4savcbcfqofjjwjnnyrlrbszfv6ujlx36mhrh57did.onion"

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
        return "http://peargxn3oki34c4savcbcfqofjjwjnnyrlrbszfv6ujlx36mhrh57did.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_load_state("networkidle", timeout=60000)

            processed_cards = set()
            processed_details = set()

            emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]', flags=re.UNICODE)

            page_num = 1
            while True:

                rows = page.query_selector_all("table.es-left")
                cards = []

                for row in rows:
                    title_el = row.query_selector("p strong")
                    raw_title = (title_el.inner_text() or "").strip() if title_el else ""
                    title = emoji_pattern.sub("", raw_title).strip()

                    if not title:
                        continue

                    content = ""
                    paras = row.query_selector_all("p")
                    for p in paras:
                        txt = (p.inner_text() or "").strip()
                        txt_clean = emoji_pattern.sub("", txt).strip()

                        if not txt_clean or txt_clean == title or "SAMPLES POSTED" in txt_clean:
                            continue

                        content = txt_clean
                        break

                    try:
                        checkbox = row.query_selector("input.info__switch[type='checkbox']")
                        cid = checkbox.get_attribute("id") if checkbox else None

                        if cid:
                            lbl = row.query_selector(f"label[for='{cid}']")
                            if lbl:
                                lbl.click()
                                page.wait_for_timeout(200)
                    except:
                        pass

                    info = {
                        "date_notified": "",
                        "website": "",
                        "industry": "",
                        "location": "",
                        "revenue": "",
                        "details_href": ""
                    }

                    info_body = row.query_selector(".info__body")
                    if info_body:
                        for p in info_body.query_selector_all("p"):
                            txt = emoji_pattern.sub("", (p.inner_text() or "")).strip()

                            if "Date Company Notified:" in txt:
                                info["date_notified"] = txt.split(":", 1)[1].strip()
                            elif "Site:" in txt:
                                a = p.query_selector("a")
                                if a:
                                    info["website"] = (a.get_attribute("href") or "").strip()
                            elif "Industry:" in txt:
                                info["industry"] = txt.split(":", 1)[1].strip()
                            elif "Location:" in txt:
                                info["location"] = txt.split(":", 1)[1].strip()
                            elif "Revenue:" in txt:
                                info["revenue"] = txt.split(":", 1)[1].strip()
                            elif "Details" in txt:
                                a = p.query_selector("a")
                                if a:
                                    info["details_href"] = (a.get_attribute("href") or "").strip()

                    cards.append({
                        "title": title,
                        "content": content,
                        **info
                    })

                for card in cards:
                    unique_key = card["title"] + "|" + card["details_href"]
                    if unique_key in processed_cards:
                        continue
                    processed_cards.add(unique_key)

                    leak_date = None
                    if card["date_notified"]:
                        try:
                            leak_date = datetime.datetime.strptime(card["date_notified"], "%m/%d/%Y").date()
                        except:
                            pass

                    data_volume = ""
                    data_description = ""
                    dumplinks = []

                    if card["details_href"]:
                        detail_url = urljoin(page.url, card["details_href"])

                        if detail_url and detail_url not in processed_details:
                            processed_details.add(detail_url)

                            try:
                                page.goto(detail_url, wait_until="networkidle", timeout=60000)

                                html = page.content()

                                vol_match = re.search(r'Data Volume:</strong>\s*(.*?)</p>', html, re.I | re.S)
                                if vol_match:
                                    data_volume = re.sub(r'<.*?>', '', vol_match.group(1)).strip()

                                desc_match = re.search(r'Data Description:</strong>\s*(.*?)</p>', html, re.I | re.S)
                                if desc_match:
                                    data_description = re.sub(r'<.*?>', '', desc_match.group(1)).strip()

                                for a in page.query_selector_all("span.es-button-border a"):
                                    href = (a.get_attribute("href") or "").strip()
                                    if href:
                                        dumplinks.append(urljoin(detail_url, href))

                                try:
                                    page.go_back(wait_until="networkidle", timeout=60000)
                                except:
                                    page.goto(self.seed_url, wait_until="networkidle")

                            except:
                                try:
                                    page.goto(self.seed_url, wait_until="networkidle")
                                except:
                                    pass

                    full_content = "\n\n".join(filter(None, [card["content"], data_description]))
                    ref_html = helper_method.extract_refhtml(card["website"], self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS,page)

                    card_data = leak_model(
                        m_ref_html=ref_html,
                        m_title=card["title"],
                        m_url=page.url,
                        m_base_url=self.base_url,
                        m_content=full_content,
                        m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=full_content[:500],
                        m_weblink=[card["website"]] if card["website"] else [],
                        m_dumplink=dumplinks,
                        m_leak_date=leak_date,
                        m_data_size=data_volume,
                        m_revenue=card["revenue"],
                        m_content_type=["leaks"]
                    )

                    entity = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_team="PEAR",
                        m_industry=card["industry"],
                        m_location=[card["location"]] if card["location"] else [],
                        m_country=[card["location"]] if card["location"] else [],
                    )

                    self.append_leak_data(card_data, entity)

                next_link = None
                for a in page.query_selector_all("a.underline-one"):
                    txt = (a.inner_text() or "").strip()
                    if txt.isdigit() and int(txt) == page_num + 1:
                        next_link = a.get_attribute("href")
                        break

                if next_link:
                    page.goto(urljoin(page.url, next_link), wait_until="networkidle", timeout=60000)
                    page_num += 1
                else:
                    break

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} {self.__class__.__name__}")
