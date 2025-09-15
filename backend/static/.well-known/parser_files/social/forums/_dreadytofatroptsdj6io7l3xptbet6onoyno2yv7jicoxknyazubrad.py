import datetime
import re

from datetime import timedelta
from typing import List
from urllib.parse import urljoin
from abc import ABC
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import datetime


class _dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad(leak_extractor_interface, ABC):
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
            cls._instance = super(_dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion"

    @property
    def developer_signature(self) -> str:
        return "Syed Ibrahim: owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"

    @property
    def base_url(self) -> str:
        return "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False, m_threat_type=ThreatType.FORUM)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/d/Dread/message/"

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
            "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/",
            "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/d/all",
        ]
        page.wait_for_selector("a.dreadLogo", state="visible", timeout=280000)
        if self.is_crawled:
            max_days = 500
            max_page = 10
        else:
            max_days = 1500
            max_page = 10

        for base_url in base_urls:
            current_url = base_url
            page_count = 0
            latest_date = None
            section_hash = helper_method.generate_data_hash(current_url)
            last_seen_date_str = self.invoke_db(REDIS_COMMANDS.S_GET_STRING, section_hash + REDIS_KEYS.S_URL_TIMEOUT, "")
            if last_seen_date_str:
                last_seen_date = datetime.fromisoformat(last_seen_date_str.replace("Z", "+00:00"))
            else:
                last_seen_date = datetime.now() - timedelta(days=max_days)
            next_href = ""

            while current_url:
                page_count += 1
                page.goto(current_url, timeout=120000)

                page.wait_for_selector("div.postTop")
                next_link = page.query_selector('a.next[href*="p="]')
                if next_link:
                    next_href = next_link.get_attribute("href")
                    next_href = urljoin(page.url, next_href)

                page.wait_for_selector("div.postTop", timeout=300000)

                post_tops = page.query_selector_all("div.postTop")
                valid_threads = []

                for idx, post in enumerate(post_tops):
                    atag = post.query_selector('a.title')
                    if not atag:
                        continue

                    span_title = atag.query_selector("span.title-text")
                    m_title = span_title.text_content().strip() if span_title else atag.text_content().strip()

                    date_span = post.query_selector("span[title]")
                    m_message_date = date_span.get_attribute("title").strip() if date_span else ""

                    parsed_date = helper_method.parse_date(m_message_date)
                    if not parsed_date:
                        continue

                    thread_date = parsed_date.date()
                    if not thread_date or thread_date <= last_seen_date.date():
                        continue

                    thread_href = atag.get_attribute("href")
                    if not thread_href:
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

                if not valid_threads:
                    break

                for thread_info in valid_threads:
                    thread_url = thread_info["thread_url"]
                    page.goto(thread_url)
                    page.wait_for_selector("div.commentBody, div.postContent.viewPostBody")

                    post_body_div = page.query_selector("div.postContent.viewPostBody")

                    post_body_text = post_body_div.text_content().strip() if post_body_div else ""

                    comment_divs = page.query_selector_all("div.commentBody")
                    count_comments= len(comment_divs)

                    first10 = comment_divs[:10]
                    last10 = comment_divs[-10:]
                    seen = set()
                    m_sections = []

                    if post_body_text:
                        m_sections.append(post_body_text)
                        seen.add(post_body_text)

                    for c in first10 + last10:
                        txt = c.text_content().strip()
                        if txt and txt not in seen:
                            m_sections.append(helper_method.filter_comments(txt))
                            seen.add(txt)

                    m_content = "\n\n".join(m_sections)
                    m_content = re.sub(r'\n+', '\n', m_content)

                    card_data = social_model(
                        m_title=thread_info["m_title"],
                        m_channel_url=page.url,
                        m_content=m_content,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_message_date=helper_method.extract_and_convert_date(thread_info["m_message_date"]),
                        m_content_type=["forum"],
                        m_platform="forum",
                        m_message_sharable_link=page.url,
                        m_post_comments_count=str(count_comments)
                    )
                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__
                    )
                    self.append_leak_data(card_data, entity_data)

                if not latest_date:
                    latest_thread = max(valid_threads, key=lambda t: t["thread_date"])
                    latest_date = latest_thread["thread_date"]
                    self.invoke_db(REDIS_COMMANDS.S_SET_STRING, section_hash + REDIS_KEYS.S_URL_TIMEOUT, latest_date.strftime("%Y%m%d"))


                if page_count >= max_page:
                    break

                if next_href:
                    current_url = next_href

