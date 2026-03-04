from datetime import datetime
from abc import ABC
import re
from typing import List
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
from urllib.parse import urljoin


class _re27glou7lmvirstrcadoxaleoyaf5v6wdsva5d7qp7lnorhjtft6dqd(leak_extractor_interface, ABC):
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
            cls._instance = super(_re27glou7lmvirstrcadoxaleoyaf5v6wdsva5d7qp7lnorhjtft6dqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def base_url(self) -> str:
        return "http://re27glou7lmvirstrcadoxaleoyaf5v6wdsva5d7qp7lnorhjtft6dqd.onion/"

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://re27glou7lmvirstrcadoxaleoyaf5v6wdsva5d7qp7lnorhjtft6dqd.onion/whats-new/posts/"

    @property
    def developer_signature(self) -> str:
        return "Syed Ibrahim : owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT,
                         m_threat_type=ThreatType.SOCIAL)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://4hpfzoj3tgyp2w7sbe3gnmphqiqpxwwyijyvotamrvojl7pkra7z7byd.onion"

    def append_leak_data(self, leak: social_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page):
        base_url = self.base_url
        unwanted_text_indicator = "To see this hidden content"
        current_url = self.seed_url

        for page_number in range(1, 501):
            page.goto(current_url, timeout=0)

            try:
                page.wait_for_selector("div.structItem.structItem--thread", timeout=60000)
            except Exception:
                break

            thread_divs = page.query_selector_all("div.structItem.structItem--thread")
            threads_meta = []

            for idx, thread in enumerate(thread_divs, start=1):
                thread_title_a = thread.query_selector("div.structItem-title a")
                if not thread_title_a:
                    continue

                thread_href = thread_title_a.get_attribute("href")
                full_thread_url = urljoin(base_url, thread_href)
                m_title = thread_title_a.text_content().strip()

                date_a = thread.query_selector("li.structItem-startDate time.u-dt")
                thread_date_str = datetime.now().isoformat()

                if date_a:
                    extracted_date = date_a.get_attribute("datetime")
                    if extracted_date:
                        thread_date_str = extracted_date

                threads_meta.append({
                    "full_thread_url": full_thread_url,
                    "thread_date_str": thread_date_str,
                    "m_title": m_title
                })

            next_btn = page.query_selector("a.pageNav-jump--next")
            next_page_href = next_btn.get_attribute("href") if next_btn else None

            for meta in threads_meta:
                try:
                    page.goto(meta['full_thread_url'], timeout=0)
                except Exception:
                    continue

                try:
                    page.wait_for_selector("div.bbWrapper", timeout=60000)
                    bb_divs = page.query_selector_all("div.bbWrapper")
                except Exception:
                    continue

                m_content = ""
                valid_bbwrappers = 0
                stop_content = False

                for bb in bb_divs:
                    if stop_content:
                        break
                    bb_text = bb.text_content().strip()
                    if unwanted_text_indicator in bb_text:
                        bb_text = bb_text.split(unwanted_text_indicator)[0].strip()
                        stop_content = True

                    bb_text = re.sub(r'[\n\t\r]+', ' ', bb_text)
                    bb_text = re.sub(r'[ ]+', ' ', bb_text).strip()

                    if not bb_text:
                        continue

                    m_content += bb_text + " "
                    valid_bbwrappers += 1

                if valid_bbwrappers == 0 or not m_content.strip():
                    continue

                username_span = page.query_selector("div.message-userName h4.message-name span.username")
                m_username = username_span.text_content().strip() if username_span else "Anonymous"

                card_data = social_model(
                    m_title=meta['m_title'],
                    m_channel_url=meta['full_thread_url'],
                    m_content=m_content.strip(),
                    m_network=helper_method.get_network_type(base_url),
                    m_message_date=helper_method.extract_and_convert_date(meta['thread_date_str']),
                    m_content_type=["leak"],
                    m_platform="forum",
                    m_message_sharable_link=meta['full_thread_url'],
                    m_post_comments_count=str(valid_bbwrappers),
                )
                entity_data = entity_model(m_name=m_username)
                self.append_leak_data(card_data, entity_data)

            if next_page_href:
                current_url = urljoin(base_url, next_page_href)
            else:
                break

        return True