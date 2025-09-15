import datetime
import re
from abc import ABC
from typing import List
from urllib.parse import urljoin

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from datetime import datetime
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import timedelta

class _b1nd(leak_extractor_interface, ABC):
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
            cls._instance = super(_b1nd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://b1nd.net"

    @property
    def developer_signature(self) -> str:
        return "owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"

    @property
    def base_url(self) -> str:
        return "https://b1nd.net"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.FORUM)

    @property
    def card_data(self) -> List[social_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://b1nd.net/"

    def append_leak_data(self, leak: social_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    @staticmethod
    def extract_clean_text(post_divs):
        texts = []
        for div in post_divs[0:20]:
            div.eval_on_selector_all(".bbCodeBlock-expandLink", "els => els.forEach(e => e.remove())")
            text = div.inner_text()
            text = re.sub(r"\n+", "\n", text)
            texts.append(text)
        return texts

    def parse_leak_data(self, page):
        CATEGORY_URLS = {
            "leaks": ["https://b1nd.net/forums/official-datasets.2/"],
            "combolist": [
                "https://b1nd.net/forums/dehashed-combolists.3/",
                "https://b1nd.net/forums/combolists.6/"
            ],
            "databases": ["https://b1nd.net/forums/databases.5/"],
            "leads": ["https://b1nd.net/forums/leads.7/"],
        }

        if self.is_crawled:
            max_days = 1000
            max_page = 2
        else:
            max_days = 1500
            max_page = 5

        for category, url_list in CATEGORY_URLS.items():
            for seed_url in url_list:
                url = seed_url
                base_url = seed_url.split('/forums/')[0]
                try:
                    latest_date = None
                    last_seen_date_str = self.invoke_db(REDIS_COMMANDS.S_GET_STRING, helper_method.generate_data_hash(seed_url) + REDIS_KEYS.S_URL_TIMEOUT, "")
                    if last_seen_date_str:
                        last_seen_date = datetime.fromisoformat(last_seen_date_str.replace("Z", "+00:00"))
                    else:
                        last_seen_date = datetime.now() - timedelta(days=max_days)

                    c_page = 1
                    while url:
                        page.goto(url)

                        next_btn = page.locator("a.pageNav-jump--next").last
                        href = None
                        if next_btn.count() > 0:
                            val = next_btn.get_attribute("href")
                            if val:
                                href = urljoin(page.url, val)

                        next_btn = href

                        page.wait_for_load_state("domcontentloaded")
                        thread_divs = page.query_selector_all('div.structItem--thread')
                        last_thread_date = None
                        thread_infos = []

                        for idx, div in enumerate(thread_divs):
                            title_a = div.query_selector('div.structItem-title a')
                            if not title_a:
                                continue
                            thread_href = urljoin(base_url, title_a.get_attribute('href'))
                            m_title = (title_a.text_content() or "").strip()

                            replies_dd = div.query_selector('dl.pairs--justified dt:text("Replies") + dd')
                            if not replies_dd:
                                replies_dd = div.query_selector('dl.pairs--justified dd')
                            replies = int(replies_dd.text_content().strip()) if replies_dd else 0

                            date_el = div.query_selector('time.structItem-latestDate')
                            m_date = None
                            if date_el:
                                date_str = date_el.get_attribute('data-date-string')
                                m_date = helper_method.parse_date(date_str)
                                last_thread_date = m_date

                            thread_infos.append({
                                "thread_href": thread_href,
                                "m_title": m_title,
                                "replies": replies,
                                "m_date": m_date
                            })

                        if not latest_date:
                            latest_date = max(thread_infos, key=lambda x: x["m_date"])["m_date"]

                        m_limit_reahed = True

                        for info in thread_infos:
                            m_date = info["m_date"]
                            thread_url = info["thread_href"]

                            if not m_date:
                                continue
                            age_days = (datetime.now() - m_date).days

                            if m_date <= last_seen_date:
                                continue

                            if age_days > max_days:
                                continue

                            m_limit_reahed = False
                            page.goto(thread_url)
                            page.wait_for_load_state("domcontentloaded")

                            usernames = []
                            post_divs = page.query_selector_all('article.message-body div.bbWrapper')
                            post_divs_count = len(post_divs)
                            content = self.extract_clean_text(post_divs)

                            if category == "leaks":
                                m_content_type = ["leaks", category]
                            else:
                                m_content_type = [category]

                            card_data = social_model(
                                m_title=info["m_title"],
                                m_channel_url=thread_url,
                                m_content="\n".join(content),
                                m_network=helper_method.get_network_type(base_url),
                                m_message_date=m_date.date() if m_date else None,
                                m_content_type=m_content_type,
                                m_platform="forum",
                                m_message_sharable_link=thread_url,
                                m_post_comments_count = str(post_divs_count)
                            )
                            entity_data = entity_model(
                                m_scrap_file=self.__class__.__name__,
                                m_username=usernames[:15]
                            )

                            self.append_leak_data(card_data, entity_data)

                        if c_page<max_page and not m_limit_reahed and last_thread_date and (datetime.now() - last_thread_date).days <= max_days and next_btn:
                            url = next_btn
                            c_page+=1
                        else:
                            self.invoke_db(REDIS_COMMANDS.S_SET_STRING, helper_method.generate_data_hash(seed_url) + REDIS_KEYS.S_URL_TIMEOUT, latest_date.strftime("%Y%m%d"))
                            break
                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
