
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
from crawler.crawler_services.shared.helper_method import helper_method


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
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT,
                         m_threat_type=ThreatType.SOCIAL)

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
    def safe_find(page, selector, attr=None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    @staticmethod
    def parse_forum_date(date_str):
        parsed_date = None
        if date_str:
            for fmt in ("%b %d, %Y", "%Y-%m-%dT%H:%M:%S%z"):
                try:
                    parsed_date = datetime.strptime(date_str, fmt)
                    break
                except Exception:
                    continue
            if not parsed_date:
                m = re.search(r"(\w{3}) (\d{1,2}), (\d{4})", date_str)
                if m:
                    try:
                        parsed_date = datetime.strptime(m.group(0), "%b %d, %Y")
                    except Exception:
                        pass
        return parsed_date

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

        max_days = 5 if self.is_crawled else 500

        for category, url_list in CATEGORY_URLS.items():
            for seed_url in url_list:
                url = seed_url
                base_url = seed_url.split('/forums/')[0]
                while url:
                    try:
                        page.goto(url)
                        page.wait_for_load_state("domcontentloaded")
                        thread_divs = page.query_selector_all('div.structItem--thread')
                        last_thread_date = None
                        thread_infos = []

                        for idx, div in enumerate(thread_divs):
                            try:
                                title_a = div.query_selector('div.structItem-title a')
                                if not title_a:
                                    continue
                                thread_href = urljoin(base_url, title_a.get_attribute('href'))
                                m_title = title_a.text_content().strip()

                                replies_dd = div.query_selector('dl.pairs--justified dt:text("Replies") + dd')
                                if not replies_dd:
                                    replies_dd = div.query_selector('dl.pairs--justified dd')
                                try:
                                    replies = int(replies_dd.text_content().strip()) if replies_dd else 0
                                except Exception:
                                    replies = 0

                                date_el = div.query_selector('time.structItem-latestDate')
                                m_date = None
                                if date_el:
                                    date_str = date_el.get_attribute('data-date-string')
                                    m_date = self.parse_forum_date(date_str)
                                    last_thread_date = m_date

                                thread_infos.append({
                                    "thread_href": thread_href,
                                    "m_title": m_title,
                                    "replies": replies,
                                    "m_date": m_date
                                })
                            except Exception as ex:
                                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))

                        for thread_idx, info in enumerate(thread_infos):
                            try:
                                m_date = info["m_date"]
                                if not m_date or (datetime.now() - m_date).days > max_days:
                                    continue

                                page.goto(info['thread_href'])
                                page.wait_for_load_state("domcontentloaded")

                                m_content = ""
                                usernames = []
                                comment_count = 0
                                while comment_count < 20:
                                    post_divs = page.query_selector_all('article.message-body div.bbWrapper')
                                    for post_div in post_divs:
                                        txt = post_div.text_content()
                                        if txt:
                                            txt = txt.replace('\u200b', '').replace('\xa0', ' ')
                                            txt = re.sub(r'[ \t\r\f\v]+', ' ', txt)
                                            txt = re.sub(r'[\n]+', ' ', txt)
                                            m_content += txt.strip() + ' '
                                            comment_count += 1
                                            if comment_count >= 20:
                                                break
                                    user_links = page.query_selector_all('a.username')
                                    for user_a in user_links:
                                        uname = user_a.text_content().strip()
                                        if uname and uname not in usernames:
                                            usernames.append(uname)
                                    if comment_count >= 20:
                                        break
                                    next_btn = page.query_selector('a.pageNav-jump--next')
                                    if next_btn:
                                        next_href = urljoin(base_url, next_btn.get_attribute('href'))
                                        page.goto(next_href)
                                        page.wait_for_load_state("domcontentloaded")
                                    else:
                                        break

                                if category == "leaks":
                                    m_content_type = ["leaks", category]
                                else:
                                    m_content_type = [category]

                                card_data = social_model(
                                    m_title=info["m_title"],
                                    m_channel_url=info["thread_href"],
                                    m_content=m_content.strip(),
                                    m_network=helper_method.get_network_type(base_url),
                                    m_message_date=m_date.date() if m_date else None,
                                    m_content_type=m_content_type,
                                    m_platform="forum",
                                    m_message_sharable_link=info["thread_href"]
                                )
                                entity_data = entity_model(
                                    m_usernames=usernames[:5]
                                )

                                entity_data = helper_method.extract_entities(m_content.strip(), entity_data)
                                self.append_leak_data(card_data, entity_data)
                            except Exception as ex:
                                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))

                        if last_thread_date and (datetime.now() - last_thread_date).days <= max_days:
                            next_btn = page.query_selector('a.pageNav-jump--next')
                            url = urljoin(base_url, next_btn.get_attribute('href')) if next_btn else None
                        else:
                            url = None
                    except Exception as ex:
                        log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))




