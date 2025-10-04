from datetime import datetime, timedelta, UTC
from abc import ABC
from typing import List

from crawler.crawler_instance.genbot_service.helpers.reddit.reddit_helper_method import RedditHelperMethod
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller


class _reddit(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()
        self._is_crawled = False
        self.m_seed_url = ""
        self._subreddit_metadata = {}

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_reddit, cls).__new__(cls)
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
        return "https://www.reddit.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_fetch_proxy=FetchProxy.TOR,
            m_fetch_config=FetchConfig.PLAYRIGHT,
            m_threat_type=ThreatType.REDDIT
        )

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(
            command, [key + self.__class__.__name__, default_value, expiry]
        )

    def contact_page(self) -> str:
        return "https://www.reddit.com/contact"

    def append_leak_data(self, leak: social_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback and self.callback():
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
    def data_parsre(s):
        return datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None

    def parse_leak_data(self, page):
        try:
            subreddit_name = RedditHelperMethod.extract_subreddit_name(self.seed_url)
        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            return

        self._subreddit_metadata = RedditHelperMethod.get_subreddit_metadata(page, subreddit_name)

        desired_posts = 100
        max_comments = 5
        if self.is_crawled:
            desired_posts = 10

        one_year_ago = datetime.now(UTC) - timedelta(days=60)
        posts = RedditHelperMethod.scroll_and_collect_posts(
            page, subreddit_name, desired_posts, max_scrolls=1000, filter_date=one_year_ago
        )
        if len(posts) < 3:
            raise Exception("response empty")

        for post in posts:
            comments = RedditHelperMethod.get_comments_from_post(page, post['url'], max_comments=max_comments)
            locator = page.locator('div[property="schema:articleBody"]').first
            post['content'] = ""
            if locator.count():
                post['content'] = locator.inner_text(timeout=0)

            post['comments'] = comments

            parsed_date = None
            if post.get('timestamp'):
                try:
                    parsed_date = datetime.fromisoformat(post['timestamp'].replace('Z', '+00:00')).date()
                except:
                    parsed_date = None

            full_content = "\n".join(item['content'] for item in post['comments'])
            if post.get('content'):
                full_content += f"{post['content']}"
            full_content = full_content.replace("\n\n", "\n")

            card_data = social_model(
                m_title=post['title'],
                m_channel_url=self.seed_url,
                m_sender_name=post.get('username') or "unknown",
                m_message_sharable_link=post['url'],
                m_weblink=post.get('weblinks', []),
                m_content=full_content[:500],
                m_content_type=["social_collector"],
                m_network="clearnet",
                m_message_date=parsed_date,
                m_message_id=post['id'],
                m_platform="reddit",
                m_group_name=subreddit_name,
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_name=post.get('username') or "unknown",
            )

            self.append_leak_data(card_data, entity_data)
