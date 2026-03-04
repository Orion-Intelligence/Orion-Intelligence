from datetime import datetime, timedelta, UTC
from abc import ABC
from typing import List

from crawler.crawler_instance.genbot_service.helpers.reddit.reddit_helper_method import RedditHelperMethod
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
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
        return "https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/r/conspiracy/"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Hassan Arshad: owEBeAKH/ZANAwAKAbKjqaChU0IoAcsxYgBoei5jVmVyaWZpZWQgZGV2ZWxvcGVyOiBNdWhhbW1hZCBIYXNzYW4gQXJzaGFk..."

    @property
    def base_url(self) -> str:
        return "https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_fetch_proxy=FetchProxy.TOR,
            m_fetch_config=FetchConfig.PLAYRIGHT,
            m_threat_type=ThreatType.REDDIT
        )

    @property
    def card_data(self) -> List[social_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def contact_page(self) -> str:
        return "https://www.reddit.com/contact"

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(
            command, [key + self.__class__.__name__, default_value, expiry]
        )

    def append_leak_data(self, leak: social_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback and self.callback():
            self._card_data.clear()
            self._entity_data.clear()

    @staticmethod
    def data_parsre(s):
        try:
            if not s:
                return None
            return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
        except Exception:
            return None

    def parse_leak_data(self, page):
        try:
            raw_url = self.seed_url.rstrip('/')
            subreddit_name = raw_url.split("/r/")[-1].split('/')[0]
            log.g().i(f"Starting deep extraction for r/{subreddit_name}")

            last_height = page.evaluate("document.body.scrollHeight")

            for i in range(15):
                page.mouse.wheel(0, 1500)
                page.wait_for_timeout(3000)

                new_height = page.evaluate("document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height

            desired_posts = 100 if not self.is_crawled else 20
            filter_date = datetime.now(UTC) - timedelta(days=60)

            posts = RedditHelperMethod.scroll_and_collect_posts(
                page, subreddit_name, desired_posts, max_scrolls=100, filter_date=filter_date
            )

            if not posts:
                return

            for post in posts:
                try:
                    content_locator = page.locator('div[slot="text-body"]').first
                    post_content = ""
                    if content_locator.count() > 0:
                        post_content = content_locator.inner_text(timeout=3000)

                    comments = RedditHelperMethod.get_comments_from_post(page, post['url'], max_comments=3)
                    comment_text = "\n".join([c.get('content', '') for c in comments])

                    full_body = f"{post_content}\n{comment_text}".strip()

                    card_data = social_model(
                        m_title=post.get('title', 'No Title'),
                        m_channel_url=self.seed_url,
                        m_sender_name=post.get('username') or "unknown",
                        m_message_sharable_link=post.get('url'),
                        m_content=full_body[:1000],
                        m_content_type=["social_collector"],
                        m_network="tor" if ".onion" in self.seed_url else "clearnet",
                        m_message_date=self.data_parsre(post.get('timestamp')),
                        m_message_id=post.get('id'),
                        m_platform="reddit",
                        m_group_name=subreddit_name,
                    )

                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_name=post.get('username') or "unknown",
                    )

                    self.append_leak_data(card_data, entity_data)

                except Exception as post_ex:
                    log.g().e(f"Skipping post {post.get('id')}: {post_ex}")
                    continue

        except Exception as ex:
            log.g().e(f"CRITICAL SCRIPT ERROR: {ex}")