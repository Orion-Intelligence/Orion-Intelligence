import datetime

from datetime import  timezone
from datetime import timedelta
from urllib.parse import urljoin
from abc import ABC
from typing import List
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import datetime

class _rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self._class = None
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
            cls._instance = super(_rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad.onion/forums"

    @property
    def developer_signature(self) -> str:
        return "Syed Ibrahim: owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"

    @property
    def base_url(self) -> str:
        return "http://rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_resoource_block=False, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.FORUM)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad.onion"

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
            return d.strftime("%Y%m%d")

    def parse_leak_data(self, page):
        base_urls = [
            "http://rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad.onion/f/Privacy",
            "http://rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad.onion/f/FreeSpeech",
            "http://rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad.onion/f/Security"
        ]

        if self.is_crawled:
            max_days = 30
            max_page = 2
        else:
            max_days = 500
            max_page = 5

        max_date = datetime.now(timezone.utc) - timedelta(days=max_days)

        for base_url in base_urls:
            current_url = base_url
            page_count = 0
            next_href = ""

            latest_date = None
            last_seen_date_str = self.invoke_db(REDIS_COMMANDS.S_GET_STRING, helper_method.generate_data_hash(base_url) + REDIS_KEYS.S_URL_TIMEOUT, "")
            if last_seen_date_str:
                last_seen_date = datetime.fromisoformat(last_seen_date_str.replace("Z", "+00:00"))
            else:
                last_seen_date = datetime.now() - timedelta(days=max_days)

            while current_url:
                page_count += 1
                page.goto(current_url, timeout=120000)

                post_tops = page.query_selector_all("div.submission__row")
                valid_threads = []

                next_li = page.query_selector("li.next")
                next_link = next_li.query_selector('a[rel="next"]') if next_li else None
                if next_link:
                    next_href = next_link.get_attribute("href")

                for idx, post in enumerate(post_tops):
                    atag = post.query_selector('h1.submission__title a.submission__link')
                    if not atag:
                        continue

                    m_title = atag.inner_text().strip()

                    date_el = post.query_selector('time.submission__timestamp')
                    m_message_date = date_el.get_attribute("datetime").strip() if date_el else ""

                    thread_date = helper_method.parse_date(m_message_date)
                    if not thread_date or thread_date < max_date:
                        continue

                    thread_href = atag.get_attribute("href")
                    if not thread_href:
                        continue

                    if thread_date.date() <=last_seen_date.date():
                        continue

                    thread_url = urljoin(current_url, thread_href)
                    thread_hash = helper_method.generate_data_hash(thread_url)
                    current_date_str = self.date_to_str(thread_date) if thread_date else ""

                    valid_threads.append({
                        "thread_url": thread_url,
                        "m_title": m_title,
                        "m_message_date": m_message_date,
                        "thread_date": thread_date,
                        "thread_hash": thread_hash,
                        "current_date_str": current_date_str
                    })

                if len(valid_threads)==0:
                    break

                if not latest_date:
                    latest_date = max(valid_threads, key=lambda x: x["thread_date"])["thread_date"]

                for thread_info in valid_threads:
                    thread_url = thread_info["thread_url"]
                    page.goto(thread_url)
                    page.wait_for_selector("div.submission__content.flow-slim, div.comment__row")

                    content_div = page.query_selector("div.submission__content.flow-slim div.submission__body")
                    if content_div:
                        paras = content_div.query_selector_all("p[lang]")
                        main_content = "\n".join([p.text_content().strip() for p in paras]) if paras else content_div.text_content().strip()
                    else:
                        main_content = ""

                    comment_rows = page.query_selector_all("div.comment__row")
                    first10 = comment_rows[:10]
                    last10 = comment_rows[-10:]
                    seen = set()
                    m_sections = []

                    if main_content:
                        m_sections.append(main_content)
                        seen.add(main_content)

                    for c in first10 + last10:
                        comment_body = c.query_selector("div.comment__body p[lang]")

                        txt = comment_body.text_content().strip() if comment_body else ""
                        if txt and txt not in seen:
                            m_sections.append(helper_method.filter_comments(txt))
                            seen.add(txt)

                    m_content = "\n".join(m_sections)
                    count_comments = len(comment_rows)




                    card_data = social_model(
                        m_title=thread_info["m_title"],
                        m_channel_url=page.url,
                        m_content=m_content,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_message_date=helper_method.extract_and_convert_date(thread_info["m_message_date"]),
                        m_content_type=["forum"],
                        m_platform="forum",
                        m_message_sharable_link=page.url,
                        m_post_comments_count=str(count_comments),
                    )
                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__
                    )
                    self.append_leak_data(card_data, entity_data)

                if page_count < max_page:
                    break

                if next_href:
                    current_url = urljoin(current_url, next_href)
            if latest_date:
                self.invoke_db(REDIS_COMMANDS.S_SET_STRING, helper_method.generate_data_hash(base_url) + REDIS_KEYS.S_URL_TIMEOUT, latest_date.strftime("%Y%m%d"))
