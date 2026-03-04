import datetime
import re
from abc import ABC
from typing import List
from datetime import  timezone
from urllib.parse import urljoin

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from datetime import datetime
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import timedelta


class _crackingx(leak_extractor_interface, ABC):
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

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_crackingx, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://crackingx.com"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Hannan Zahid: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hOii"
    @property
    def base_url(self) -> str:
        return "https://crackingx.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.FORUM)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://crackingx.com/misc/contact"

    def append_leak_data(self, leak: social_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    @staticmethod
    def date_to_str(d):
        if not d:
            return ""
        if isinstance(d, datetime):
            d = d.date()
        formatted = d.strftime("%Y%m%d")
        return formatted

    @staticmethod
    def extract_clean_text(bb_wrappers):
        texts = []
        for div in bb_wrappers.all()[:20]:
            text = div.inner_text()
            text = re.sub(r"\n+", "\n", text).strip()
            texts.append(text[:1000])
        return texts

    def parse_leak_data(self, page):
        if self.is_crawled:
            max_days = 30
            max_page = 2
        else:
            max_days = 500
            max_page = 5

        category_mapping = {
            "cracking": [
                "https://crackingx.com/forums/9/",
                "https://crackingx.com/forums/5/",
                "https://crackingx.com/forums/2/",
                "https://crackingx.com/forums/17/",
                "https://crackingx.com/forums/11/",
            ],
            "Marketplace": [
                "https://crackingx.com/forums/premium_section/",
                "https://crackingx.com/forums/14/",
                "https://crackingx.com/forums/13/",
                "https://crackingx.com/forums/16/",
            ],
            "Money": [
                "https://crackingx.com/forums/4/",
                "https://crackingx.com/forums/19/",
            ],
        }

        for category_name, section_urls in category_mapping.items():
            page_num = 1
            for section_url in section_urls:
                latest_date = None
                section_hash = helper_method.generate_data_hash(section_url)
                while section_url:
                    page.goto(section_url)
                    page.wait_for_load_state("domcontentloaded")

                    thread_data = []
                    thread_items = page.query_selector_all(".structItem")
                    last_seen_date_str = self.invoke_db(REDIS_COMMANDS.S_GET_STRING, section_hash + REDIS_KEYS.S_URL_TIMEOUT, "")
                    if last_seen_date_str:
                        last_seen_date = datetime.fromisoformat(last_seen_date_str.replace("Z", "+00:00"))
                    else:
                        last_seen_date = datetime.now() - timedelta(days=max_days)

                    for idx, item in enumerate(thread_items, start=1):
                        title_el = item.query_selector("a[href^='/threads/']")
                        if not title_el:
                            continue
                        href = title_el.get_attribute("href")
                        title = title_el.inner_text().strip()
                        date_el = item.query_selector("time.structItem-latestDate.u-dt")
                        if not date_el:
                            continue
                        datetime_attr = date_el.get_attribute("datetime")
                        dtime = datetime.strptime(datetime_attr, "%Y-%m-%dT%H:%M:%S%z").replace(tzinfo=None)

                        if last_seen_date and dtime.date() <= last_seen_date.date():
                            continue

                        thread_url = "https://crackingx.com" + href if href and not href.startswith("http") else href
                        if not thread_url:
                            continue

                        thread_hash = helper_method.generate_data_hash(thread_url)
                        thread_data.append({
                            "href": thread_url,
                            "title": title,
                            "thread_dt": dtime,
                            "thread_hash": thread_hash,
                            "date_str": datetime_attr,
                        })

                    if not thread_data:
                        break

                    next_btn = page.locator("a.pageNav-jump--next").last
                    href = None
                    if next_btn.count() > 0:
                        val = next_btn.get_attribute("href")
                        if val:
                            href = urljoin(page.url, val)

                    next_btn = href

                    if thread_data:
                        for thread in thread_data:
                            self.extract_thread_data(page, thread["href"], thread["title"], category_name)


                    if not latest_date:
                        latest_thread = max(thread_data, key=lambda t: t["thread_dt"])
                        latest_date = latest_thread["thread_dt"]
                        self.invoke_db(REDIS_COMMANDS.S_SET_STRING, section_hash + REDIS_KEYS.S_URL_TIMEOUT, latest_date.strftime("%Y%m%d"))

                    if max_page < page_num:
                        break

                    section_url = next_btn
                    page_num += 1

        return True

    def extract_thread_data(self, page, thread_url, thread_title, category_name):
        page.goto(thread_url)
        page.wait_for_load_state("domcontentloaded")

        date_tag = page.locator("time.u-dt").first
        thread_dt = None

        if date_tag.count() > 0:
            datetime_attr = date_tag.get_attribute("datetime")
            if datetime_attr:
                m_date = datetime_attr
                thread_dt = helper_method.parse_date(m_date)
            else:
                date_text = date_tag.inner_text()
                thread_dt = helper_method.parse_date(date_text)

        bb_wrappers = page.locator("div.bbWrapper")
        wrapper_count = bb_wrappers.count()


        max_days = 5 if self.is_crawled else 500
        if wrapper_count < 10:
            if thread_dt:
                now_dt = datetime.now(timezone.utc)
                days_diff = (now_dt - thread_dt).days
                if days_diff > max_days:
                    return None
            else:
                return None

        text_content = self.extract_clean_text(bb_wrappers)
        m_content = "\n".join(text_content)
        m_content_type = ["leaks", category_name]

        usernames = set()
        username_elements = page.query_selector_all("a.username")
        for i in range(min(len(username_elements), 5)):
            username = username_elements[i].inner_text().strip()
            if username:
                usernames.add(username)

        hashtags = []
        tag_elements = page.query_selector_all("a.tagItem")
        for i in range(len(tag_elements)):
            tag = tag_elements[i].inner_text().strip()
            if tag:
                hashtags.append(tag)

        card_data = social_model(
            m_title=thread_title,
            m_channel_url=thread_url,
            m_content=m_content,
            m_network=helper_method.get_network_type(self.base_url),
            m_message_date=thread_dt.date() if thread_dt else None,
            m_content_type=m_content_type,
            m_platform="forum",
            m_message_sharable_link=thread_url,
            m_post_comments_count=str(wrapper_count)
        )

        entity_data = entity_model(
            m_scrap_file=self.__class__.__name__,
            m_author=list(usernames),
            m_hashtags=hashtags
        )

        self.append_leak_data(card_data, entity_data)
