import datetime
from abc import ABC
from typing import List
from datetime import timezone
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from datetime import datetime
from playwright.sync_api import sync_playwright

from crawler.crawler_services.shared.helper_method import helper_method


class _hacksnation(leak_extractor_interface, ABC):
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
            cls._instance = super(_hacksnation, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://hacksnation.com/t/cracked"

    @property
    def developer_signature(self) -> str:
        return "Syed Ibrahim : owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"
    @property
    def base_url(self) -> str:
        return "https://hacksnation.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.FORUM)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://hacksnation.com/contact-us"

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

    def parse_leak_data(self, page: sync_playwright()):
        max_days = 5 if self.is_crawled else 500
        page.goto(self.seed_url)
        page.wait_for_load_state("domcontentloaded")

        forbidden_keywords = [
            "porn", "onlyfans", "sex", "horny", "pornography", "adult",
            "escort", "camgirl", "cam boy", "nudes", "nude", "xxx", "fetish", "bdsm",
            "pornhub", "stripchat", "livejasmin", "snapchat", "chaturbate", "leak",
            "leaked", "incest", "taboo", "hardcore", "erotica", "sexcam", "adultwork",
            "escortservice", "hooker", "prostitute", "anal", "oral", "cum", "blowjob",
            "handjob", "dildo", "vibrator", "orgy", "gangbang", "deepfake", "onlyfansleak",
            "fansly", "amateur", "spank", "lust", "suck", "slut", "whore", "milf", "teen",
            "lolita", "hentai", "futa", "sextape", "sex tape"
        ]
        processed_urls = set()
        context = page.context
        context.on("page", lambda new_page: (None, new_page.close()))
        more_data = True

        while more_data:
            discussion_items = page.query_selector_all(".DiscussionListItem")
            discussion_urls = []
            all_dates = []

            for item in discussion_items:
                main_a = item.query_selector("a.DiscussionListItem-main")
                if not main_a:
                    continue
                href = main_a.get_attribute('href')
                if not href:
                    continue
                full_url = href if href.startswith("http") else f"https://hacksnation.com{href}"
                if full_url in processed_urls:
                    continue
                title_el = main_a.query_selector("h2.DiscussionListItem-title")
                thread_title = title_el.text_content().strip() if title_el else ""
                title_lower = thread_title.lower()
                if any(word in title_lower for word in forbidden_keywords):
                    continue
                time_el = item.query_selector("time")
                date_val = time_el.get_attribute("datetime") if time_el else None
                m_date = None
                if date_val:
                    try:
                        m_date = datetime.fromisoformat(date_val.replace("Z", "+00:00"))
                    except Exception:
                        try:
                            m_date = datetime.fromisoformat(date_val[:19])
                        except Exception:
                            m_date = None
                if m_date:
                    all_dates.append(m_date)
                discussion_urls.append((full_url, thread_title, m_date))

            for url_info in discussion_urls:
                full_url, thread_title, m_date = url_info
                page.goto(full_url)
                page.wait_for_load_state("domcontentloaded")
                if not page.url.startswith("https://hacksnation.com"):
                    page.goto(self.seed_url)
                    page.wait_for_load_state("domcontentloaded")
                    continue
                comment_posts = page.query_selector_all("article.CommentPost.Post")
                usernames = []
                comments = []
                for post in comment_posts:
                    user_span = post.query_selector("span.username")
                    username = user_span.text_content().strip() if user_span else ""
                    if username and username not in usernames:
                        usernames.append(username)
                    body_div = post.query_selector("div.Post-body")
                    content_text = body_div.text_content().strip() if body_div else ""
                    content_text = helper_method.filter_comments(content_text)
                    comments.append(content_text)
                m_username = ", ".join(usernames[:5])
                m_content = '\n'.join(comment.replace('\n', ' ') for comment in comments)
                card_data = social_model(
                    m_title=thread_title,
                    m_channel_url=page.url,
                    m_content=m_content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_message_date=m_date.date() if m_date else None,
                    m_content_type=["forum"],
                    m_platform="forum",
                    m_message_sharable_link=page.url
                )
                entity_data = entity_model(
                    m_username=[m_username]
                )
                self.append_leak_data(card_data, entity_data)

                processed_urls.add(full_url)
                page.goto(self.seed_url)
                page.wait_for_load_state("domcontentloaded")

            load_more_btn = page.query_selector("div.DiscussionList-loadMore button.Button")
            should_load_more = False
            if all_dates:
                oldest_date = min(all_dates)
                days_diff = (datetime.now(timezone.utc) - oldest_date).days
                if days_diff <= max_days:
                    should_load_more = True
            if load_more_btn and should_load_more:
                old_hrefs = set()
                for item in page.query_selector_all(".DiscussionListItem"):
                    a_tag = item.query_selector("a.DiscussionListItem-main")
                    if a_tag:
                        href = a_tag.get_attribute("href")
                        if href:
                            full_url = href if href.startswith("http") else f"https://hacksnation.com{href}"
                            old_hrefs.add(full_url)
                load_more_btn.click()
                new_item_selector = ".DiscussionListItem"
                page.wait_for_selector(new_item_selector, state="attached")
                tries = 0
                while tries < 5:
                    new_items = page.query_selector_all(".DiscussionListItem")
                    temp_hrefs = set()
                    for item in new_items:
                        a_tag = item.query_selector("a.DiscussionListItem-main")
                        if a_tag:
                            href = a_tag.get_attribute("href")
                            if href:
                                full_url = href if href.startswith("http") else f"https://hacksnation.com{href}"
                                temp_hrefs.add(full_url)
                    new_hrefs = temp_hrefs - old_hrefs
                    if len(new_hrefs) > 0:
                        break
                    page.wait_for_selector(new_item_selector, state="attached")
                    tries += 1
                more_data = True
            else:
                more_data = False
