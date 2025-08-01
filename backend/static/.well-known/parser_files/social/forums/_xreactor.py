import datetime
from abc import ABC
from typing import List
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright

from crawler.crawler_services.shared.helper_method import helper_method


class _xreactor(leak_extractor_interface, ABC):
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
            cls._instance = super(_xreactor, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://xreactor.org"

    @property
    def developer_signature(self) -> str:
        return "Syed Ibrahim: owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"

    @property
    def base_url(self) -> str:
        return "https://xreactor.org"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.SOCIAL)

    @property
    def card_data(self) -> List[social_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://xreactor.org/contact"

    def append_leak_data(self, leak: social_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    @staticmethod
    def safe_find(page, selector, attr=None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    @staticmethod
    def parse_date(date_str):
        if date_str.startswith("Yesterday at "):
            t = datetime.strptime(date_str[13:], "%I:%M %p").time()
            y = datetime.now() - timedelta(days=1)
            return datetime.combine(y.date(), t)
        weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for day in weekdays:
            if date_str.startswith(day + " at "):
                t = datetime.strptime(date_str[len(day) + 4:], "%I:%M %p").time()
                today = datetime.now()
                target_weekday = weekdays.index(day)
                days_diff = (today.weekday() - target_weekday) % 7
                target_date = today - timedelta(days=days_diff)
                return datetime.combine(target_date.date(), t)
        for fmt in ("%b %d, %Y", "%B %d, %Y"):
            try:
                return datetime.strptime(date_str, fmt)
            except:
                pass
        try:
            return datetime.fromisoformat(date_str[:19])
        except:
            return None

    url_categories = {
        "leaks": [
            "https://xreactor.org/forums/tutorials-guides-etc.86/",
            "https://xreactor.org/forums/cracked-programs.87/",
            "https://xreactor.org/forums/source-codes.121/",
            "https://xreactor.org/forums/database.157/",
            "https://xreactor.org/forums/demolished.240/",
        ],
        "coding": [
            "https://xreactor.org/forums/website.7/",
            "https://xreactor.org/forums/site-templates.55/",
            "https://xreactor.org/forums/programming-discussions.79/",
            "https://xreactor.org/forums/plugins-and-styles.56/",
            "https://xreactor.org/forums/webhosting-discussions.170/"
        ],
        "hacking": [
            "https://xreactor.org/forums/kali-linux-section.255/",
            "https://xreactor.org/forums/spamming-section.253/",
            "https://xreactor.org/forums/general-hacking.74/",
            "https://xreactor.org/forums/hacking-tools-and-programs.75/",
            "https://xreactor.org/forums/hacking-tutorials.76/",
            "https://xreactor.org/forums/website-hackings.77/",
        ],
        "marketplace": [
            "https://xreactor.org/forums/sellers-marketplace.230/",
            "https://xreactor.org/forums/buyers-marketplace.231/",
        ]
    }

    def open_thread_in_new_tab(self, page, thread_url):
        page.goto(thread_url)
        page.wait_for_load_state("domcontentloaded")
        thread_info = page.locator("h1.p-title-value").inner_text()
        thread_parts = thread_info.split("Thread Name:")
        thread_type = thread_parts[0].strip()
        thread_title = thread_parts[1].strip() if len(thread_parts) > 1 else ""
        usernames = set()
        username_elements = page.locator("span[class*='tc-cus-username']")
        for i in range(min(username_elements.count(), 5)):
            usernames.add(username_elements.nth(i).inner_text())
        hashtags = []
        hashtag_elements = page.locator("dl.tagList span.js-tagList a.tagItem")
        for i in range(hashtag_elements.count()):
            tag = hashtag_elements.nth(i).inner_text().strip()
            if tag:
                hashtags.append(tag)
        latest_date_str = ""
        date_elements = page.locator("time.u-dt")
        if date_elements.count() > 0:
            latest_date_str = date_elements.last.inner_text()
        m_date = self.parse_date(latest_date_str)

        page_limit = 10
        current_page = 1
        comments = []

        while current_page <= page_limit:
            try:
                wrappers = page.locator("div.bbWrapper")
                for i in range(wrappers.count()):
                    wrapper = wrappers.nth(i)
                    html = wrapper.inner_html()
                    text = wrapper.inner_text().strip()
                    if "block-mhhide" in html or "bbCodeBlock" in html or len(text) < 10:
                        continue
                    comments.append(text)

                dates = page.locator("time.u-dt")
                if dates.count() == 0:
                    break
                last_date_str = dates.last.inner_text()
                parsed_date = self.parse_date(last_date_str)
                next_button = page.locator("a.pageNav-jump--next").nth(0)
                if not parsed_date or (datetime.now() - parsed_date).days > 5 or next_button.count() == 0:
                    break
                next_button.click(force=True)
                page.wait_for_load_state("domcontentloaded")
                current_page += 1
            except Exception:
                return
        if len(comments) == 0:
            comments = ["no comments"]

        card_data = social_model(
            m_title=thread_title,
            m_channel_url=page.url,
            m_content='\n'.join(comments),
            m_network=helper_method.get_network_type(self.base_url),
            m_message_date=m_date.date(),
            m_content_type=[thread_type],
            m_platform="forum",
            m_message_sharable_link=page.url
        )

        entity_data = entity_model(
            m_author=list(usernames),
            m_hashtags=hashtags
        )
        entity_data = helper_method.extract_entities(' '.join(comments), entity_data)
        self.append_leak_data(card_data, entity_data)

    def parse_leak_data(self, page: sync_playwright()):
        max_days = 500
        if self.is_crawled:
            max_days = 5

        for _, urls in self.url_categories.items():
            for url in urls:
                page.goto(url)
                while True:
                    try:
                        m_threads = []
                        m_current_page = page.url
                        blocks = page.locator("div.structItem--thread")
                        for i in range(blocks.count()):
                            date_str = blocks.nth(i).locator("time.structItem-latestDate").inner_text()
                            parsed_date = self.parse_date(date_str)
                            if parsed_date and (datetime.now() - parsed_date).days <= max_days:
                                thread_element = blocks.nth(i).locator("div.structItem-title a").last
                                thread_url = thread_element.get_attribute("href")
                                m_threads.append(self.base_url + thread_url)
                        for item in m_threads:
                            self.open_thread_in_new_tab(page, item)

                        if len(m_threads) > 0:
                            page.goto(m_current_page)
                        last_date_str = page.locator("time.structItem-latestDate").last.inner_text(timeout=5000)
                        parsed_date = self.parse_date(last_date_str)
                        next_button = page.locator("a.pageNav-jump--next").nth(0)
                        if not parsed_date or (
                                datetime.now() - parsed_date).days > max_days or next_button.count() == 0: break
                        next_button.click(force=True)
                        page.wait_for_load_state("domcontentloaded")
                    except Exception as ex:
                        log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                        break
