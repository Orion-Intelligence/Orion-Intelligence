from abc import ABC
from typing import List
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
from urllib.parse import urljoin

class _4hpfzoj3tgyp2w7sbe3gnmphqiqpxwwyijyvotamrvojl7pkra7z7byd(leak_extractor_interface, ABC):
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
            cls._instance = super(_4hpfzoj3tgyp2w7sbe3gnmphqiqpxwwyijyvotamrvojl7pkra7z7byd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def base_url(self) -> str:
        return "http://4hpfzoj3tgyp2w7sbe3gnmphqiqpxwwyijyvotamrvojl7pkra7z7byd.onion"

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://4hpfzoj3tgyp2w7sbe3gnmphqiqpxwwyijyvotamrvojl7pkra7z7byd.onion"

    @property
    def developer_signature(self) -> str:
        return "Syed Ibrahim : owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.SOCIAL)

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
        current_url = base_url

        page.goto(current_url, timeout=120000)
        post_links = page.query_selector_all("a.post__title-link")

        urls = [urljoin(base_url, link.get_attribute("href")) for link in post_links[0:3]]

        for full_href in urls:
            page.goto(full_href, timeout=120000)
            page.wait_for_load_state("networkidle")

            time_el = page.query_selector("time.post__meta-published")
            post_date = helper_method.parse_date(time_el.text_content().strip()) if time_el else ""

            title_el = page.query_selector("h1.post__title")
            m_title = title_el.text_content().strip() if title_el else ""

            content_div = page.query_selector_all('div.post__content')
            m_content = "\n".join([div.text_content().strip() for div in content_div]) if content_div else ""
            content_div_count = len(content_div)

            user_link = page.query_selector("a.meta-categories__link[rel='category']")
            m_username = user_link.text_content().strip() if user_link else ""

            card_data = social_model(
                m_title=m_title,
                m_channel_url=full_href,
                m_content=m_content,
                m_network=helper_method.get_network_type(base_url),
                m_message_date=post_date,
                m_content_type=["leak"],
                m_platform="forum",
                m_message_sharable_link=full_href,
                m_post_comments_count=str(content_div_count),
            )
            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_name=m_username
            )
            self.append_leak_data(card_data, entity_data)
