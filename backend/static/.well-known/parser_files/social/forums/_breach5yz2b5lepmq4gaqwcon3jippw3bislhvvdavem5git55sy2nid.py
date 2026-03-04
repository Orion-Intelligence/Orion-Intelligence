from abc import ABC
from typing import List
from playwright.sync_api import Page
from bs4 import BeautifulSoup
import re
from datetime import datetime

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model

from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid(leak_extractor_interface, ABC):
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

    def __new__(cls, callback=None):
        if cls._instance is None:
            cls._instance = super(_breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Hannan Zahid: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hOii"

    @property
    def base_url(self) -> str:
        return "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.SOCIAL,m_resoource_block=False)

    @property
    def card_data(self) -> List[social_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php?misc/contact"

    def append_leak_data(self, leak: social_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        outer_links = ["http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php?forums/giveaways-and-freebies.6/",
        "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php?forums/programming.4/",
        "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php?forums/databases.14/",
        "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php?forums/other-leaks.16/",
        "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php?forums/cracked-accounts.18/",
        "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php?forums/combolists.19/",
        "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php?forums/services.23/",
        "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php?forums/sellers-place.24/",
        "http://breach5yz2b5lepmq4gaqwcon3jippw3bislhvvdavem5git55sy2nid.onion/index.php?forums/buyers-place.25/"]

        usable_link = self.seed_url.replace('/index.php', '')

        for outer_link in outer_links:
            page.goto(outer_link)
            page.wait_for_selector('div.p-body-main  ')

            html = page.content()
            soup = BeautifulSoup(html, "html.parser")

            mid_links = []
            current_soup = soup

            next_btn_address = soup.select_one('div.pageNav  ')
            while True:
                mid_link_tags = current_soup.select("div.structItemContainer-group.js-threadList > div.structItem.structItem--thread")
                for mid_link_tag in mid_link_tags:
                    mid_link1 = mid_link_tag.select_one("div.structItem-title > a[href]").get('href')
                    complete_mid_link1 = usable_link + mid_link1
                    title = mid_link_tag.select_one("div.structItem-title > a[href]").text.strip()

                    date_element = mid_link_tag.select_one('div.structItem-cell.structItem-cell--latest time')
                    if date_element:
                        date1 = date_element.text.strip()
                        if date1.startswith("Today at "):
                            date1 = date1.replace("Today at ", datetime.now().strftime("%B %d, %Y ") + "at ")

                        parsed_date = helper_method.parse_date(date1)
                        if parsed_date:
                            mid_links.append((complete_mid_link1, parsed_date.date(), title))

                if self.is_crawled:
                    break

                if not next_btn_address or not next_btn_address.select_one('a.pageNav-jump.pageNav-jump--next'):
                    break

                next_btn = next_btn_address.select_one('a.pageNav-jump.pageNav-jump--next[href]').get('href')

                complete_next_btn = usable_link + next_btn
                page.goto(complete_next_btn)
                page.wait_for_selector('div.p-body-main  ')

                html2 = page.content()
                current_soup = BeautifulSoup(html2, "html.parser")

                next_btn_address = current_soup.select_one('div.pageNav  ')

            for mid_link, thread_date, title in mid_links:
                clean_text_var = ""

                page.goto(mid_link)
                page.wait_for_selector('div.p-body-main  ')

                html1 = page.content()
                soup1 = BeautifulSoup(html1, "html.parser")

                chat_addresses = soup1.select('div.block.block--messages > div.block-container.lbContainer > div.block-body.js-replyNewMessageContainer > article.message.message--post')
                chat_count = len(chat_addresses)
                if chat_count > 20:
                    chat_addresses = chat_addresses[:10] + chat_addresses[-10:]

                for chat_address in chat_addresses:
                    chat_messages = chat_address.select_one('div.bbWrapper')

                    for reply in chat_messages.select('blockquote'):
                        reply.decompose()

                    for smilie in chat_messages.select('.smilie'):
                        smilie.decompose()

                    raw_text = chat_messages.get_text()
                    clean_text_var = re.sub(r'\s+', ' ', raw_text).strip()

                    card_data = social_model(
                        m_weblink=[mid_link],
                        m_title=str([title]),
                        m_content=clean_text_var,
                        m_content_type=["leaks"],
                        m_network=helper_method.get_network_type(self.base_url),
                        m_platform="breachforums",
                        m_channel_url=page.url,
                        m_message_date=thread_date,
                        m_message_sharable_link=mid_link,
                        m_post_tags=[],
                    )

                    entity_data = entity_model(
                        m_team="breachforums",
                        m_leak_type="forum_thread",
                    )

                    self.append_leak_data(card_data, entity_data)