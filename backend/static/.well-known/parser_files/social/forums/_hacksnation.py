import datetime

from abc import ABC
from typing import List
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from datetime import datetime
from datetime import timedelta
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
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
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_resoource_block=False, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.FORUM)

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
    def date_to_str(d):
        if not d:
            return ""
        if isinstance(d, datetime):
            d = d.date()
        return d.strftime("%Y%m%d")

    @staticmethod
    def extract_posts(page):
        results = []
        codes_all = []
        articles = page.locator("article.CommentPost")
        comment_count = int(articles.count())
        for i in range(comment_count):
            art = articles.nth(i)
            user = art.locator(".PostUser-name .username").first.inner_text().strip()
            body = art.locator(".Post-body").first
            paragraphs = [t.strip() for t in body.locator("p").all_text_contents()]
            codes = [t.strip() for t in body.locator("code").all_text_contents()]
            codes_all.extend(codes)
            parts = [p for p in paragraphs if p]
            text = "\n".join(parts) if parts else body.inner_text().strip()
            results.append((user, text))
        return "\n".join([r[1] for r in results]), [r[0] for r in results], codes_all,comment_count

    def parse_leak_data(self, page):
        forbidden_keywords = [
            "porn", "onlyfans", "sex", "horny", "pornography", "adult",
            "escort", "camgirl", "cam boy", "nudes", "nude", "xxx", "fetish", "bdsm",
            "pornhub", "stripchat", "livejasmin", "snapchat", "chaturbate", "leak",
            "incest", "taboo", "hardcore", "erotica", "sexcam", "adultwork",
            "escortservice", "hooker", "prostitute", "anal", "oral", "cum", "blowjob",
            "handjob", "dildo", "vibrator", "orgy", "gangbang", "deepfake", "onlyfansleak",
            "fansly", "amateur", "spank", "lust", "suck", "slut", "whore", "milf", "teen",
            "lolita", "hentai", "futa", "sextape", "sex tape"
        ]

        page.wait_for_load_state("domcontentloaded")
        discussion_items = page.query_selector_all(".DiscussionListItem")

        if self.is_crawled:
            max_days = 500
        else:
            max_days = 500

        latest_date = None
        last_seen_date_str = self.invoke_db(REDIS_COMMANDS.S_GET_STRING, helper_method.generate_data_hash(self.seed_url) + REDIS_KEYS.S_URL_TIMEOUT,"")
        if last_seen_date_str:
            last_seen_date = datetime.fromisoformat(last_seen_date_str.replace("Z", "+00:00"))
        else:
            last_seen_date = datetime.now() - timedelta(days=max_days)

        to_parse = []
        for post in discussion_items:
            try:
                post_meta = post.query_selector("a.DiscussionListItem-main")
                if not post_meta:
                    continue
                href = post_meta.get_attribute('href')
                href = urljoin(page.url, href)
                if not href:
                    continue
                body_text = post.text_content().strip()
                if not body_text:
                    continue
                if any(word in body_text.lower() for word in forbidden_keywords):
                    continue
                time_el = post.query_selector("time")
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
                    if m_date.date() <= last_seen_date.date():
                        continue
                    if latest_date is None or m_date > latest_date:
                        latest_date = m_date
                usernames = []
                user_span = post.query_selector("span.username")
                username = user_span.text_content().strip() if user_span else ""
                if username:
                    usernames.append(username)
                m_content = helper_method.filter_comments(body_text).replace("\n", " ")
                to_parse.append({"href": href, "m_date": m_date, "m_content": m_content, "usernames": usernames})
            except Exception as _:
                continue

        for item in to_parse:
            try:
                page.goto(item["href"])
                page.wait_for_load_state("domcontentloaded")
                content, m_username, code, comment_count= self.extract_posts(page)

                if code and len(code)>0:
                    code += "\n" + code[0]

                card_data = social_model(
                    m_title="Post",
                    m_channel_url=page.url,
                    m_content=content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_message_date=item["m_date"].date() if item["m_date"] else None,
                    m_content_type=["forum"],
                    m_platform="forum",
                    m_message_sharable_link=page.url,
                    m_post_comments_count=str(comment_count)
                )
                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_username=m_username,
                    m_code_snippet=code
                )
                self.append_leak_data(card_data, entity_data)
            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))

        if latest_date:
            self.invoke_db(REDIS_COMMANDS.S_SET_STRING, helper_method.generate_data_hash(self.seed_url) + REDIS_KEYS.S_URL_TIMEOUT, latest_date.strftime("%Y%m%d"))

        return True

