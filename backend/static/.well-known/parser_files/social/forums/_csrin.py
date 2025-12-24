from abc import ABC
from typing import List
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _csrin(leak_extractor_interface, ABC):
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
            cls._instance = super(_csrin, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def base_url(self) -> str:
        return "https://cs.rin.ru/forum/index.php"

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://cs.rin.ru/forum/viewforum.php?f=10"

    @property
    def developer_signature(self) -> str:
        return "Syed Ibrahim : owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.SOCIAL)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://cs.rin.ru/forum/chat.php"

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

        base_url = self.seed_url
        current_url = base_url

        if self.is_crawled:
            max_days = 365
            max_page = 2
        else:
            max_days = 365
            max_page = 5

        max_date = datetime.now(timezone.utc) - timedelta(days=max_days)

        try:
            latest_date = None
            last_seen_date_str = self.invoke_db(
                REDIS_COMMANDS.S_GET_STRING, helper_method.generate_data_hash(base_url) + REDIS_KEYS.S_URL_TIMEOUT, "")

            if last_seen_date_str:
                try:
                    last_seen_date = datetime.strptime(last_seen_date_str, "%Y%m%d").replace(tzinfo=timezone.utc)
                except:
                    last_seen_date = datetime.now(timezone.utc) - timedelta(days=max_days)
            else:
                last_seen_date = datetime.now(timezone.utc) - timedelta(days=max_days)

            page_count = 0

            while current_url and page_count < max_page:
                page_count += 1

                page.goto(current_url, timeout=120000)
                page.wait_for_load_state("domcontentloaded")

                threads_processed = 0
                thread_index = 0

                while True:
                    topic_links = page.query_selector_all("a.topictitle")

                    if len(topic_links) == 0:
                        break

                    if thread_index >= len(topic_links):
                        break

                    try:
                        topic_link = topic_links[thread_index]

                        thread_href = topic_link.get_attribute("href")
                        if not thread_href:
                            thread_index += 1
                            continue

                        thread_url = urljoin(base_url, thread_href)
                        m_title = topic_link.text_content().strip()

                        parent_tr = topic_link.query_selector("xpath=ancestor::tr[1]")

                        if not parent_tr:
                            thread_index += 1
                            continue

                        td_elements = parent_tr.query_selector_all("td")

                        thread_date = None

                        for td_idx, td in enumerate(td_elements):
                            td_class = td.get_attribute("class")
                            if td_class and "row1" in td_class:
                                first_date_para = td.query_selector("p.topicdetails[style*='white-space']")

                                if not first_date_para:
                                    first_date_para = td.query_selector("p.topicdetails")

                                if first_date_para:
                                    date_text = first_date_para.text_content().strip()

                                    try:
                                        thread_date = helper_method.parse_date(date_text)
                                        if thread_date:
                                            if thread_date.tzinfo is None:
                                                thread_date = thread_date.replace(tzinfo=timezone.utc)
                                            break
                                    except Exception:
                                        continue

                            if thread_date:
                                break

                        if not thread_date:
                            thread_index += 1
                            continue

                        if thread_date < max_date:
                            thread_index += 1
                            continue

                        if thread_date.date() <= last_seen_date.date():
                            thread_index += 1
                            continue

                        if not latest_date or thread_date > latest_date:
                            latest_date = thread_date

                        try:
                            page.goto(thread_url, timeout=120000)
                            page.wait_for_load_state("domcontentloaded")

                            postbody_divs = page.query_selector_all("div.postbody")
                            posts_to_extract = min(10, len(postbody_divs))
                            m_post_comments_count = len(postbody_divs)

                            m_content_parts = []
                            m_usernames = []

                            for i in range(posts_to_extract):
                                content_text = postbody_divs[i].text_content().strip()
                                if content_text:
                                    m_content_parts.append(content_text)

                            m_content = "\n\n".join(m_content_parts)

                            username_elements = page.query_selector_all("b.postauthor")
                            for username_el in username_elements[:15]:
                                username = username_el.text_content().strip()
                                if username and username not in m_usernames:
                                    m_usernames.append(username)

                            m_post_date = None
                            date_div = page.query_selector("td.gensmall div:has(b:text('Posted:'))")

                            if date_div:
                                date_text = date_div.text_content().strip()
                                if "Posted:" in date_text:
                                    date_str = date_text.split("Posted:")[1].strip().split("\u00a0")[0].strip()
                                    m_post_date = helper_method.parse_date(date_str)
                                    if m_post_date and m_post_date.tzinfo is None:
                                        m_post_date = m_post_date.replace(tzinfo=timezone.utc)

                            if not m_post_date:
                                m_post_date = thread_date

                            card_data = social_model(
                                m_title=m_title,
                                m_channel_url=thread_url,
                                m_content=m_content,
                                m_network=helper_method.get_network_type(base_url),
                                m_message_date=m_post_date.date() if m_post_date else None,
                                m_content_type=["forum"],
                                m_platform="forum",
                                m_message_sharable_link=thread_url,
                                m_post_comments_count=str(m_post_comments_count))

                            entity_data = entity_model(
                                m_scrap_file=self.__class__.__name__, m_username=m_usernames)

                            self.append_leak_data(card_data, entity_data)
                            threads_processed += 1

                            page.go_back(timeout=60000)
                            page.wait_for_load_state("domcontentloaded")

                        except Exception as thread_ex:
                            log.g().e(f"THREAD ERROR {thread_ex} " + str(self.__class__.__name__))
                            try:
                                page.goto(current_url, timeout=60000)
                                page.wait_for_load_state("domcontentloaded")
                            except:
                                pass

                        thread_index += 1

                    except Exception:
                        thread_index += 1
                        continue

                if threads_processed == 0:
                    break

                next_link = page.query_selector("a:has-text('Next')")
                if next_link and page_count < max_page:
                    next_href = next_link.get_attribute("href")
                    if next_href:
                        current_url = urljoin(base_url, next_href)
                    else:
                        break
                else:
                    break

            if latest_date:
                date_string = self.date_to_str(latest_date)
                self.invoke_db(
                    REDIS_COMMANDS.S_SET_STRING,
                    helper_method.generate_data_hash(base_url) + REDIS_KEYS.S_URL_TIMEOUT,
                    date_string)

            return True

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            return False
