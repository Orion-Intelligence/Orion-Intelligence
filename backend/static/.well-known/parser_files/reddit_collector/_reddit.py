from datetime import datetime, timedelta, UTC
from abc import ABC
from typing import List

from crawler.crawler_instance.genbot_service.helpers.reddit.reddit_helper_method import RedditHelperMethod
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
import json


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
        return "https://www.reddit.com/r/privacy"

    @property
    def base_url(self) -> str:
        return "https://www.reddit.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(
            m_fetch_proxy=FetchProxy.NONE,
            m_fetch_config=FetchConfig.PLAYRIGHT,
            m_threat_type=ThreatType.REDDIT,
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

    def parse_leak_data(self, page):
        subreddit_url = self.seed_url
        try:
            subreddit_name =  RedditHelperMethod.extract_subreddit_name(subreddit_url)
        except ValueError:
            return

        self._subreddit_metadata = RedditHelperMethod.get_subreddit_metadata(page, subreddit_name)
        page.wait_for_timeout(3000)

        if not self.is_crawled:
            desired_posts = 1000
            max_comments = 5
            one_year_ago = datetime.now(UTC) - timedelta(days=365)
            posts = RedditHelperMethod.scroll_and_collect_posts(
                page, subreddit_name, desired_posts, max_scrolls=1000, filter_date=one_year_ago
            )
        else:
            desired_posts = 30
            max_comments = 5
            posts = RedditHelperMethod.scroll_and_collect_posts(
                page, subreddit_name, desired_posts, max_scrolls=30
            )

        for post in posts:
            comments = RedditHelperMethod.get_comments_from_post(page, post['url'], max_comments=max_comments)
            post['comments'] = comments

            parsed_date = None
            if post.get('timestamp'):
                try:
                    parsed_date = datetime.fromisoformat(post['timestamp'].replace('Z', '+00:00')).date()
                except:
                    parsed_date = None

            full_content = "\n".join(item['content'] for item in post['comments'])
            if post.get('content'):
                full_content += f"\n\n{post['content']}"

            card_data = social_model(
                m_title=post['title'],
                m_channel_url=subreddit_url,
                m_sender_name=post.get('username') or "unknown",
                m_message_sharable_link=post['url'],
                m_weblink=post.get('weblinks', []),
                m_content=full_content[:500],
                m_content_type=["social"],
                m_network="clearnet",
                m_message_date=parsed_date,
                m_message_id=post['id'],
                m_platform="reddit",
                m_group_name=subreddit_name,
            )

            entity_data = entity_model(
                m_name=post.get('username') or "unknown",
            )

            self.append_leak_data(card_data, entity_data)

        self._is_crawled = True