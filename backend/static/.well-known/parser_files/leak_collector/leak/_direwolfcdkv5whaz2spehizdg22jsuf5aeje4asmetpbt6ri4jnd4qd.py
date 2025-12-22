from abc import ABC
from typing import List
from datetime import datetime

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from crawler.crawler_services.log_manager.log_controller import log


class _direwolfcdkv5whaz2spehizdg22jsuf5aeje4asmetpbt6ri4jnd4qd(leak_extractor_interface, ABC):
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
            cls._instance = super(_direwolfcdkv5whaz2spehizdg22jsuf5aeje4asmetpbt6ri4jnd4qd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://direwolfcdkv5whaz2spehizdg22jsuf5aeje4asmetpbt6ri4jnd4qd.onion"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://direwolfcdkv5whaz2spehizdg22jsuf5aeje4asmetpbt6ri4jnd4qd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK, m_resoource_block=False)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://direwolfcdkv5whaz2spehizdg22jsuf5aeje4asmetpbt6ri4jnd4qd.onion"

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

            for _ in range(5):
                lm = page.query_selector(
                    "button.load-more, .load-more, a.load-more, button:has-text('Load More'), a:has-text('Load More')")
                if not lm:
                    break
                try:
                    lm.click()
                    page.wait_for_load_state("networkidle", timeout=60000)
                    page.wait_for_timeout(800)
                except Exception:
                    break

            cards = page.query_selector_all("div.card")
            items = []
            for c in cards:
                title_text = (c.query_selector("h2.card-title").inner_text() or "").strip() if c.query_selector(
                    "h2.card-title") else ""
                country = (c.query_selector(
                    "h2.card-title .country-flag").inner_text() or "").strip() if c.query_selector(
                    "h2.card-title .country-flag") else ""
                title = title_text.replace(country, "").strip() if title_text else ""

                summary_map = {"Company": "", "Website": "", "Industry": "", "Data Size": ""}
                for si in c.query_selector_all(".card-summary .card-summary-item"):
                    lbl = (si.query_selector(".card-summary-label").inner_text() or "").strip() if si.query_selector(
                        ".card-summary-label") else ""
                    val_el = si.query_selector(".card-summary-value")
                    val = (val_el.query_selector("a").get_attribute("href") if val_el.query_selector(
                        "a") else val_el.inner_text()) if val_el else ""
                    for key in summary_map:
                        if lbl.startswith(key):
                            summary_map[key] = val.strip() if val else ""

                published_text = (c.query_selector("div.card-meta").inner_text() or "").strip() if c.query_selector(
                    "div.card-meta") else ""

                items.append({
                    "title": title,
                    "country": country,
                    "published_text": published_text,
                    **summary_map
                })

            for it in items:
                title = it["title"]
                country = it["country"]
                company_name = it["Company"]
                website = it["Website"]
                industry = it["Industry"]
                data_size = it["Data Size"]
                published_text = it["published_text"]
                article_date = None

                if "Published:" in published_text:
                    try:
                        date_str = published_text.split("Published:", 1)[1].strip()
                        article_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                    except Exception:
                        pass

                clicked = False
                for a in page.query_selector_all("div.card a.card-link"):
                    parent_text = a.evaluate(
                        "el => el.closest('div.card')?.querySelector('h2.card-title')?.innerText || ''")
                    if title in parent_text:
                        try:
                            a.click()
                            clicked = True
                            break
                        except Exception:
                            continue

                if not clicked and page.query_selector("div.card a.card-link"):
                    try:
                        page.query_selector("div.card a.card-link").click()
                        clicked = True
                    except Exception:
                        pass

                article_title = title
                article_company = company_name
                article_website = website
                article_industry = industry
                article_data_size = data_size
                article_content = ""

                if clicked:
                    page.wait_for_selector("article.article-detail", timeout=60000)
                    ad = page.query_selector("article.article-detail")
                    if ad:
                        article_title = (ad.query_selector(
                            "h1.article-title").inner_text() or "").strip() if ad.query_selector(
                            "h1.article-title") else article_title
                        meta_text = (ad.query_selector(
                            "div.article-meta").inner_text() or "").strip() if ad.query_selector(
                            "div.article-meta") else ""
                        if "Published:" in meta_text:
                            try:
                                date_str = meta_text.split("Published:", 1)[1].strip()
                                article_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                            except Exception:
                                pass

                        summary_map = {"Company": article_company, "Website": article_website,
                                       "Industry": article_industry, "Data Size": article_data_size,
                                       "Leaked Data Types": article_content}
                        for si in ad.query_selector_all(".article-summary-content .summary-item"):
                            lbl = (si.query_selector(".summary-label").inner_text() or "").strip() if si.query_selector(
                                ".summary-label") else ""
                            val_el = si.query_selector(".summary-value")
                            val = (val_el.query_selector("a").get_attribute("href") if val_el.query_selector(
                                "a") else val_el.inner_text()) if val_el else ""
                            for key in summary_map:
                                if lbl.startswith(key):
                                    summary_map[key] = val.strip() if val else summary_map[key]
                        article_website = summary_map["Website"]
                        article_data_size = summary_map["Data Size"]
                        article_content = summary_map["Leaked Data Types"] or (
                            ad.query_selector(".article-content").inner_text() if ad.query_selector(
                                ".article-content") else "")


                full_content = "\n\n".join(
                    filter(None, [article_title, article_data_size, article_website, article_content]))
                important_content = full_content[:500]
                ref_html = helper_method.extract_refhtml(article_website, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)
                e=1

                card_data = leak_model(
                        m_ref_html=ref_html,
                        m_title=article_title,
                        m_url=page.url,
                        m_base_url=self.base_url,
                        m_content=article_content,
                        m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=important_content,
                        m_weblink=[article_website] if article_website else [],
                        m_dumplink=[],
                        m_content_type=["leaks"],
                        m_leak_date=article_date,
                        m_data_size=article_data_size
                    )

                entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_team="DireWolf",
                        m_country=[country] if country else [],
                        m_location=[country] if country else [],
                        m_company_name=company_name,
                        m_industry=industry,
                    )

                self.append_leak_data(card_data, entity_data)
                page.goto(self.seed_url)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))