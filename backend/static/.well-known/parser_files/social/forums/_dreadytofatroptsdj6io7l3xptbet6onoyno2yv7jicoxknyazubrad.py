import datetime

import time

from datetime import  timedelta
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from abc import ABC
from typing import List
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
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
        return "https://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion"

    @property
    def developer_signature(self) -> str:
        return "Syed Ibrahim: owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"

    @property
    def base_url(self) -> str:
        return "https://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT)

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
    def safe_find(page, selector, attr=None):
        try:
            element = page.query_selector(selector)
            if element:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    def parse_leak_data(self, page):


        base_urls = [
            "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/",
            "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/d/all",
            "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/d/Dread"
        ]

        TWO_YEARS_AGO = datetime.utcnow() - timedelta(days=2 * 365)

        for base_url in base_urls:
            current_url = base_url
            page_count = 0
            max_pages = 500

            while page_count < max_pages:
                page_count += 1
                loaded = False
                for attempt in range(5):
                    try:
                        page.goto(current_url, timeout=120000)
                        page.wait_for_selector("div.postTop", timeout=300000)
                        loaded = True
                        break
                    except Exception as e:
                        log.g().e(f"SCRIPT ERROR {e} " + str(self._class.name_))
                        time.sleep(15)

                if not loaded:
                    break

                post_tops = page.query_selector_all("div.postTop")

                for idx in range(len(post_tops)):
                    try:
                        current_post_tops = page.query_selector_all("div.postTop")
                        if idx >= len(current_post_tops):
                            continue

                        post = current_post_tops[idx]

                        atag = post.query_selector('a.title')
                        if not atag:
                            continue

                        span_title = atag.query_selector("span.title-text")
                        m_title = span_title.text_content().strip() if span_title else atag.text_content().strip()

                        post_html = post.inner_html()
                        soup = BeautifulSoup(post_html, "html.parser")

                        soup_atag = soup.find("a", class_="title")
                        m_message_date = ""
                        if soup_atag:
                            prev = soup_atag.find_previous_sibling()
                            while prev:
                                if prev.name == "span" and prev.has_attr("title"):
                                    m_message_date = prev["title"].strip()
                                    break
                                prev = prev.find_previous_sibling()
                        if not m_message_date:
                            date_span = soup.find("span", attrs={"title": True})
                            if date_span:
                                m_message_date = date_span["title"].strip()

                        date_is_valid = True
                        if m_message_date:
                            try:
                                thread_date = datetime.strptime(m_message_date, "%dth %B, %Y - %H:%M")
                            except ValueError:
                                try:
                                    thread_date = datetime.strptime(m_message_date, "%d %B, %Y - %H:%M")
                                except ValueError:
                                    thread_date = None
                            if thread_date and thread_date < TWO_YEARS_AGO:
                                date_is_valid = False

                        if not date_is_valid:
                            continue

                        thread_href = atag.get_attribute("href")
                        if not thread_href:
                            continue
                        thread_url = urljoin(current_url, thread_href)

                        try:
                            page.goto(thread_url)
                            page.wait_for_selector("div.commentBody, div.postContent.viewPostBody")
                        except Exception as e:
                            log.g().e(f"SCRIPT ERROR {e} " + str(self._class.name_))
                            continue

                        post_body_div = page.query_selector("div.postContent.viewPostBody")
                        post_body_text = post_body_div.text_content().strip() if post_body_div else ""

                        comment_divs = page.query_selector_all("div.commentBody")

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
                                m_sections.append(txt)
                                seen.add(txt)
                        m_content = "\n\n".join(m_sections)

                        try:
                            card_data = social_model(
                                m_title=m_title,
                                m_channel_url=page.url,
                                m_content=m_content,
                                m_network=helper_method.get_network_type(self.base_url),
                                m_message_date=helper_method.extract_and_convert_date(m_message_date),
                                m_content_type=["leak"],
                                m_platform="forum",
                                m_message_sharable_link=page.url
                            )
                            entity_data = entity_model(
                                m_name=""
                            )
                            self.append_leak_data(card_data, entity_data)
                        except Exception as e:
                            log.g().e(f"SCRIPT ERROR {e} " + str(self._class.name_))

                        page.goto(current_url)
                        page.wait_for_selector("div.postTop")

                    except Exception as e:
                        log.g().e(f"SCRIPT ERROR {e} " + str(self._class.name_))
                        try:
                            page.goto(current_url)
                            page.wait_for_selector("div.postTop")
                        except Exception as e:
                            log.g().e(f"SCRIPT ERROR {e} " + str(self._class.name_))

                next_link = page.query_selector('a.next[href*="p="]')
                if next_link:
                    next_href = next_link.get_attribute("href")
                    if next_href:
                        current_url = urljoin(current_url, next_href)
                    else:
                        break
                else:
                    break
