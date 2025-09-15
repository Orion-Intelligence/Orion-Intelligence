import datetime
from abc import ABC
from typing import List
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from datetime import datetime
from crawler.crawler_services.redis_manager.redis_enums import REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import timedelta


class _xreactor(leak_extractor_interface, ABC):
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
            cls._instance = super(_xreactor, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://xreactor.org"

    @property
    def developer_signature(self) -> str:
        return "Syed Ibrahim: owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"

    @property
    def base_url(self) -> str:
        return "https://xreactor.org"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_resoource_block=False,m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.FORUM)

    @property
    def card_data(self) -> List[social_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://xreactor.org/contact"

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

    def open_thread_in_new_tab(self, page, thread_url):
        global wrappers
        page.goto(thread_url)
        thread_info = page.locator("h1.p-title-value").inner_text()
        thread_parts = thread_info.split("Thread Name:")
        thread_type = thread_parts[0].strip()
        thread_title = thread_parts[1].strip() if len(thread_parts) > 1 else ""

        usernames = set()
        username_elements = page.locator("span[class*='tc-cus-username']")
        for i in range(min(username_elements.count(), 5)):
            usernames.add(username_elements.nth(i).inner_text())

        hashtags = []
        hashtag_elements = page.locator("dl.tagList span.js-tagList a.tagItem")
        for i in range(hashtag_elements.count()):
            tag = hashtag_elements.nth(i).inner_text().strip()
            if tag:
                hashtags.append(tag)

        latest_date_str = ""
        date_elements = page.locator("time.u-dt")
        if date_elements.count() > 0:
            latest_date_str = date_elements.first.inner_text()
        m_date = helper_method.parse_date(latest_date_str)

        page_limit = 10
        current_page = 1
        comments = []
        main_text = page.locator("div.bbWrapper").first.inner_text().strip()

        while current_page <= page_limit and len(comments) < 20:
            wrappers = page.locator(
                "div.bbWrapper, div.message-main.js-quickEditTarget, div.message-content.js-messageContent div.bbWrapper"
            )
            for i in range(wrappers.count()):
                if len(comments) >= 20:
                    break
                wrapper = wrappers.nth(i)
                text = wrapper.inner_text().strip()
                if len(text) < 10:
                    continue
                comments.append(helper_method.filter_comments(text))
            if len(comments) >= 20:
                break
            next_button = page.locator("a.pageNav-jump--next").nth(0)
            if next_button.count() == 0:
                break
            next_button.click(force=True)
            current_page += 1


        if len(comments) == 0:
            comments = ["no comments"]
        comments = "\n".join(comments[:20])
        main_text = main_text + comments
        main_text = main_text[0:5000]
        comments_count = wrappers.count()
        
        card_data = social_model(
            m_title=thread_title,
            m_channel_url=page.url,
            m_content=main_text,
            m_network=helper_method.get_network_type(self.base_url),
            m_message_date=m_date.date() if m_date else None,
            m_content_type=[thread_type],
            m_platform="forum",
            m_message_sharable_link=page.url,
            m_post_comments_count=str(comments_count),
        )
        entity_data = entity_model(
            m_scrap_file=self.__class__.__name__,
            m_author=list(usernames),
            m_hashtags=hashtags
        )
        self.append_leak_data(card_data, entity_data)

    def parse_leak_data(self, page):
        url_categories = {
            "leaks": [
                "https://xreactor.org/forums/tutorials-guides-etc.86/",
                "https://xreactor.org/forums/cracked-programs.87/",
                "https://xreactor.org/forums/source-codes.121/",
                "https://xreactor.org/forums/database.157/",
                "https://xreactor.org/forums/demolished.240/",
            ],
            "coding": [
                "https://xreactor.org/forums/website.7/",
                "https://xreactor.org/forums/site-templates.55/",
                "https://xreactor.org/forums/programming-discussions.79/",
                "https://xreactor.org/forums/plugins-and-styles.56/",
                "https://xreactor.org/forums/webhosting-discussions.170/"
            ],
            "hacking": [
                "https://xreactor.org/forums/kali-linux-section.255/",
                "https://xreactor.org/forums/spamming-section.253/",
                "https://xreactor.org/forums/general-hacking.74/",
                "https://xreactor.org/forums/hacking-tools-and-programs.75/",
                "https://xreactor.org/forums/hacking-tutorials.76/",
                "https://xreactor.org/forums/website-hackings.77/",
            ],
            "marketplace": [
                "https://xreactor.org/forums/sellers-marketplace.230/",
                "https://xreactor.org/forums/buyers-marketplace.231/",
            ]
        }

        if self.is_crawled:
            max_days = 100
            max_page = 2
        else:
            max_days = 500
            max_page = 5


        for category, urls in url_categories.items():
            for url in urls:
                page.goto(url)
                page.wait_for_load_state("networkidle")
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page_count = 0
                latest_date = None
                last_seen_date_str = self.invoke_db(REDIS_COMMANDS.S_GET_STRING, helper_method.generate_data_hash(url) + REDIS_KEYS.S_URL_TIMEOUT, "")
                if last_seen_date_str:
                    last_seen_date = datetime.fromisoformat(last_seen_date_str.replace("Z", "+00:00"))
                else:
                    last_seen_date = datetime.now() - timedelta(days=max_days)

                while page_count< max_page:
                    page_count += 1
                    valid_threads = []

                    blocks = page.locator("div.structItem--thread")
                    for i in range(blocks.count()):
                        date_str = blocks.nth(i).locator("time.structItem-latestDate").inner_text()
                        parsed_date = helper_method.parse_date(date_str)
                        if parsed_date and (datetime.now() - parsed_date).days <= max_days:
                            thread_element = blocks.nth(i).locator("div.structItem-title a").last
                            thread_url = self.base_url + thread_element.get_attribute("href")
                            thread_title = thread_element.inner_text().strip()
                            thread_hash = helper_method.generate_data_hash(thread_url)
                            thread_date_str = self.date_to_str(parsed_date)

                            if parsed_date.date() <= last_seen_date.date():
                                continue

                            valid_threads.append({
                                "thread_url": thread_url,
                                "thread_title": thread_title,
                                "thread_date": parsed_date,
                                "thread_hash": thread_hash,
                                "thread_date_str": thread_date_str
                            })

                    if len(valid_threads)==0:
                        break

                    if not latest_date:
                        latest_date = max(valid_threads, key=lambda x: x["thread_date"])["thread_date"]

                    for thread in valid_threads:
                        self.open_thread_in_new_tab(page, thread["thread_url"])

                    next_button = page.locator("a.pageNav-jump--next").nth(0)
                    if next_button.count() == 0 or not next_button.is_visible() or not next_button.is_enabled():
                        break
                    else:
                        next_button.click()

                    try:
                        next_button.click(timeout=5000, force=True)
                    except Exception:
                        print("Next button click timed out")
                        break

                if latest_date:
                    self.invoke_db(REDIS_COMMANDS.S_SET_STRING, helper_method.generate_data_hash(url) + REDIS_KEYS.S_URL_TIMEOUT, latest_date.strftime("%Y%m%d"))

        return True
