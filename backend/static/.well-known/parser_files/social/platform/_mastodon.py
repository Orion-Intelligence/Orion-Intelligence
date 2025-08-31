from abc import ABC
from datetime import datetime
from typing import List

from crawler.crawler_instance.genbot_service.helpers.mastodon.mastodon_helper_methods import MastodonHelperMethods
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _mastodon(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self.m_seed_url = ""
        self._redis_instance = redis_controller()
        self._is_crawled = False
        self._helper_methods = MastodonHelperMethods()

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_mastodon, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return self.m_seed_url

    @property
    def developer_signature(self) -> str:
        return "Muhammad Hassan Arshad: owEBeAKH/ZANAwAKAbKjqaChU0IoAcsxYgBoei5jVmVyaWZpZWQgZGV2ZWxvcGVyOiBNdWhhbW1hZCBIYXNzYW4gQXJzaGFkCokCMwQAAQoAHRYhBD5p3c9aqX5fJ9SIZbKjqaChU0IoBQJoei5jAAoJELKjqaChU0Io2i8QAKRGGxAbMJGV97ym5wcir4mn2es2/npd+MFDa/LZFnkcoPOP9/fKtg9pZ1a2PVa0h9s5ewU6wGJ4HIvjP/2gxd1maDIjv6IM+5mtlpJvQJhzoqHdAg//IRwJU5QO2krqxBQrtcvNwfkW1IoNSEaJCr0EmXht3rkGhkJ3J3XqEvrBeH0DtaZLnCLOJ3eTIRleqbBOUdq2Uf9hDZZY9rdqynjjsADo1lhchdyPjwBz1g8M/q1Ud3sTUA+/8gas5l15jR9SGQZxbgnzZRjG19oq5GAhLwUYgKuoH+zANQEB7leF9jBudzYz2Ey/4BglnVE6kszUo7RxPoqtNOFvq6WzCcRKPLO323sLfFYtwXDwvJ0iviVTOwrbXlA80GFANcAbSR76nN0XrsaLM2L/KT6oe0wTVq35j1QZnt4Jq5PWALA8hQNr7w1KtuwnpN5PmE741h+9OfZP2ogd9ERbmGb10DROsd9t4RL4hpxpsCoekHRbLI3XmHFZqFAB/GgF194Tmh3LcoIAcwOYty/PVDuPYMGMmm5Nttg2vvVrMg82P0LeOrIN2Mq03HCiZm/HaOvePniPg+EeaWPMiVmGWvCJUOMI/TJRz4jVLR4BUlvoiUSNBWrJhxMRQZpViam2rVUaojPaZhzoIF4sqS6hYqzZbbXHwtYjJfNOHh00gucABJHw=gmDH"

    @property
    def base_url(self) -> str:
        return "https://mastodon.social"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.MASTODON)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return self.seed_url

    def append_leak_data(self, leak: social_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page):
        page.wait_for_selector('.account__header', timeout=30000)
        profile_info = self._helper_methods.get_profile_info(page)

        account_url = helper_method.generate_data_hash(self.seed_url)
        username = profile_info.get("username", "")
        existing_ids = set()

        desired_count = 20 if self.is_crawled else 200
        last_seen_date_str = self.invoke_db(REDIS_COMMANDS.S_GET_STRING, account_url + REDIS_KEYS.S_URL_TIMEOUT, "")
        last_seen_date = None
        if last_seen_date_str:
            try:
                last_seen_date = datetime.fromisoformat(last_seen_date_str.replace("Z", "+00:00")).date()
            except Exception:
                last_seen_date = None

        posts = self._helper_methods.scroll_and_collect(page, username, existing_ids, desired_count)
        parsed_post = []

        for post_id in posts:
            article = page.locator(f'article[data-id="{post_id}"]')
            article.scroll_into_view_if_needed()
            post = self._helper_methods.extract_post_details(page, post_id)
            parsed_post.append(post)

        new_posts = []
        for p in parsed_post:
            ds = p.get("date", "")
            try:
                d = datetime.fromisoformat(ds.replace("Z", "+00:00")).date() if ds else None
            except Exception:
                continue
            if not last_seen_date or (d and d > last_seen_date):
                new_posts.append(p)

        for post in new_posts:
            try:
                date_str = post.get("date", "")
                parsed_date = None
                if date_str:
                    try:
                        parsed_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")).date()
                    except Exception:
                        continue

                if not post.get("url", ""):
                    continue

                card_data = social_model(
                    m_channel_url=self.seed_url,
                    m_title=post.get("card_title", ""),
                    m_sender_name=post.get("username", ""),
                    m_message_sharable_link=post.get("url", ""),
                    m_weblink=post.get("weblinks", []),
                    m_content=post.get("content", ""),
                    m_content_type=["social"],
                    m_network="clearnet",
                    m_message_date=parsed_date,
                    m_message_id=post.get("id"),
                    m_platform="mastodon",
                )
                entity_data = entity_model(
                    m_username=[post.get("username", "")],
                )

                self.append_leak_data(card_data, entity_data)
            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))

        if new_posts:
            max_seen_date = new_posts[0].get("date", "")
            self.invoke_db(REDIS_COMMANDS.S_SET_STRING, account_url + REDIS_KEYS.S_URL_TIMEOUT, max_seen_date)
