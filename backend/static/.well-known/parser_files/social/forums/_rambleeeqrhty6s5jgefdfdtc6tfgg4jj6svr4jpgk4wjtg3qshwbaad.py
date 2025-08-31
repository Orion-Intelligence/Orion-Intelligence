import datetime
from datetime import  timedelta
from urllib.parse import urljoin
from abc import ABC
from typing import List
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
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
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.FORUM)

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
    def safe_find(page, selector, attr=None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    def parse_leak_data(self, page):


        base_urls = [
            "http://rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad.onion/f/Privacy",
            "http://rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad.onion/f/FreeSpeech",
            "http://rambleeeqrhty6s5jgefdfdtc6tfgg4jj6svr4jpgk4wjtg3qshwbaad.onion/f/Security"
        ]

        max_days = 500
        if self.is_crawled:
            max_days = 5

        DAYS_AGO = datetime.utcnow() - timedelta(days=max_days)

        for base_url in base_urls:
            current_url = base_url
            page_count = 0
            max_pages = 500

            while page_count < max_pages:
                page_count += 1

                try:
                    page.goto(current_url)
                    submission_headers = page.query_selector_all("header.submission__header")
                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))
                    break

                for idx in range(len(submission_headers)):
                    try:
                        submission_headers = page.query_selector_all("header.submission__header")
                        if idx >= len(submission_headers):
                            continue

                        header = submission_headers[idx]
                        title_row = header.query_selector("div.submission__title-row")
                        if not title_row:
                            continue

                        thread_link = title_row.query_selector("h1.submission__title a.submission__link")
                        if not thread_link:
                            continue

                        m_title = thread_link.text_content().strip()
                        thread_href = thread_link.get_attribute("href")
                        thread_url = urljoin(current_url, thread_href)

                        time_tag = header.query_selector("time.submission__timestamp")
                        m_message_date = ""
                        thread_date = None
                        if time_tag:
                            m_message_date_raw = time_tag.text_content().strip()
                            m_message_date = m_message_date_raw
                            if m_message_date.lower().startswith("on "):
                                m_message_date = m_message_date[3:].strip()
                            if " at " in m_message_date:
                                m_message_date = m_message_date.split(" at ")[0].strip()

                            try:
                                thread_date = datetime.strptime(m_message_date, "%B %d, %Y")
                                if thread_date < DAYS_AGO:
                                    continue
                            except Exception as ex:
                                log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))
                                continue

                        try:
                            page.goto(thread_url)
                        except Exception as ex:
                            log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))
                            continue

                        try:
                            content_div = page.query_selector("div.submission__content.flow-slim")
                            main_content = content_div.text_content().strip() if content_div else ""
                        except Exception as ex:
                            log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))
                            main_content = ""

                        try:
                            comment_rows = page.query_selector_all("div.comment__row")
                            m_sections = []
                            m_usernames = []

                            if main_content:
                                m_sections.append(main_content)

                            for cidx, comment_row in enumerate(comment_rows):
                                try:
                                    comment_body = comment_row.query_selector("div.comment__body p[lang]")
                                    comment_text = comment_body.text_content().strip() if comment_body else ""
                                    comment_text = helper_method.filter_comments(comment_text)
                                    if comment_text:
                                        m_sections.append(comment_text)

                                    comment_header_user = comment_row.query_selector(
                                        "header.comment__header h1.comment__info a.fg-inherit strong")
                                    m_username = ""
                                    if comment_header_user:
                                        m_username = comment_header_user.text_content().strip()
                                        m_usernames.append(m_username)
                                    else:
                                        user_link = comment_row.query_selector(
                                            "header.comment__header h1.comment__info a.fg-inherit")
                                        if user_link:
                                            m_username = user_link.text_content().strip()
                                            m_usernames.append(m_username)
                                except Exception as ex:
                                    log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))
                                    continue

                            m_content = "\n\n".join(m_sections)
                            usernames_str = ", ".join(set(m_usernames))
                        except Exception as ex:
                            log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))
                            m_content = ""
                            usernames_str = ""

                        try:
                            card_data = social_model(
                                m_title=m_title,
                                m_channel_url=page.url,
                                m_content=m_content,
                                m_network=helper_method.get_network_type(self.base_url),
                                m_message_date=helper_method.extract_and_convert_date(m_message_date),
                                m_content_type=["forum"],
                                m_platform="forum",
                                m_message_sharable_link=page.url
                            )
                            entity_data = entity_model(
                                m_name=usernames_str
                            )
                            self.append_leak_data(card_data, entity_data)
                        except Exception as ex:
                            log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))

                        try:
                            page.goto(current_url)
                        except Exception as ex:
                            log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))

                    except Exception as ex:
                        log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))
                        try:
                            page.goto(current_url)
                        except Exception as ex:
                            log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))

                try:
                    next_li = page.query_selector("li.next")
                    next_link = None
                    if next_li:
                        next_link = next_li.query_selector('a[rel="next"]')
                    if next_link:
                        next_href = next_link.get_attribute("href")
                        if next_href:
                            current_url = urljoin(current_url, next_href)
                        else:
                            break
                    else:
                        break
                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self._class.name_))
                    break
