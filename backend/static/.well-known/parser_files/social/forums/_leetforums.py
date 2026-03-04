from abc import ABC
from typing import List

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model

from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _leetforums(leak_extractor_interface, ABC):
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
            cls._instance = super(_leetforums, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://leetforums.cc"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Hannan Zahid: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hOii"

    @property
    def base_url(self) -> str:
        return "https://leetforums.cc"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.REQUESTS, m_threat_type= ThreatType.FORUM)

    @property
    def card_data(self) -> List[social_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://leetforums.cc/misc/contact"

    def append_leak_data(self, leak: social_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page):
        outer_links = ["https://leetforums.cc/forums/hacking.9/",
                       "https://leetforums.cc/forums/combos-worldlist.15/",
                       "https://leetforums.cc/forums/leak-softwares-database.16/",
                       "https://leetforums.cc/forums/random-free-accounts.18/",
                       "https://leetforums.cc/forums/discussions-about-anonymity.20/",
                       "https://leetforums.cc/forums/socks-proxy.21/",
                       "https://leetforums.cc/forums/http-proxy.22/",
                       "https://leetforums.cc/forums/leaked-vpn-rdp-stuff.23/",
                       "https://leetforums.cc/forums/earnings-methods.25/",
                       "https://leetforums.cc/forums/steam-games-accounts.29/",
                       "https://leetforums.cc/forums/carding-discussion.34/",
                       "https://leetforums.cc/forums/fake-id-documents-passports.36/",
                       "https://leetforums.cc/forums/carding-tools-carding-showoff.37/",
                       "https://leetforums.cc/forums/cardable-websites.39/",
                       "https://leetforums.cc/forums/verified-seller-services.59/",
                       "https://leetforums.cc/forums/unverified-sell-buy-open-source.64/",
                       "https://leetforums.cc/forums/unverified-services.66/"
        ]

        ADULT_KEYWORDS = [
            "nsfw", "adult content", "18+", "explicit", "porn", "pornography",
            "xxx", "sex", "sexual", "hardcore", "softcore",
            "adult video", "sex video", "porn video", "leaked sexvideo",
            "onlyfans", "fansly", "manyvids", "pornhub", "xvideos", "xnxx",
            "nude", "nudes", "naked", "explicit images", "leaked pics",
            "sex pics", "adult pics",
            "escort", "escorting", "call girl", "paid sex",
            "cam girl", "webcam model", "live cam", "sex cam",
            "blowjob", "handjob", "anal", "oral sex", "threesome",
            "selling nudes", "buy nudes", "paid content",
            "premium adult", "adult leaks", "sex leaks"
        ]

        for outer_link in outer_links:
            html = requests.get(outer_link).text
            soup = BeautifulSoup(html, "html.parser")

            threads = []
            current_soup = soup

            thread_links = current_soup.select_one('div.p-body-pageContent > div.block[data-type="thread"]')
            if thread_links.select_one("div.block-outer div.pageNav "):
                next_btn = thread_links.select_one("div.block-outer div.pageNav ")
            else:
                next_btn = False

            while True:
                thread_links1 = thread_links.select("div.block-container > div.block-body div.structItemContainer-group > div.structItem")
                for thread_link_title_date in thread_links1:
                    thread_link_title_date1 = thread_link_title_date.select_one("div.structItem-cell.structItem-cell--main")

                    thread_link_title1 = thread_link_title_date1.select("div.structItem-title > a[href]")

                    thread_link_partial = thread_link_title1[-1].get("href")
                    complete_thread_link = self.seed_url + thread_link_partial

                    thread_title = thread_link_title1[-1].text.strip()

                    thread_date = thread_link_title_date1.select_one("div.structItem-minor > ul.structItem-parts > li.structItem-startDate > a > time.u-dt").text.strip()

                    thread_date1 = None

                    if thread_date.startswith("Today at "):
                        time_str = thread_date.replace("Today at ", "").strip()
                        t = datetime.strptime(time_str, "%I:%M %p").time()
                        thread_date1 = datetime.combine(datetime.now().date(), t)
                    else:
                        thread_date1 = helper_method.parse_date(thread_date)

                    threads.append((complete_thread_link, thread_title, thread_date1.date()))

                if self.is_crawled:
                    break

                if not next_btn or not next_btn.select_one("a.pageNav-jump.pageNav-jump--next"):
                    break

                next_btn_partial = next_btn.select_one("a.pageNav-jump.pageNav-jump--next[href]").get("href")

                complete_next_link = self.seed_url + next_btn_partial

                html1 = requests.get(complete_next_link).text
                current_soup = BeautifulSoup(html1, "html.parser")

                thread_links = current_soup.select_one('div.p-body-pageContent > div.block[data-type="thread"]')
                if thread_links.select_one("div.block-outer div.pageNav"):
                    next_btn = thread_links.select_one("div.block-outer div.pageNav")
                else:
                    next_btn = False

            for thread_link, thread_title, thread_date in threads:
                html2 = requests.get(thread_link).text
                soup2 = BeautifulSoup(html2, "html.parser")

                first_msg = soup2.select_one("div.block.block--messages > div.block-container > div.block-body > article:first-of-type div.bbWrapper")

                first_text = first_msg.get_text(strip=True)
                if "To see this hidden content" in first_text:
                    continue

                first_text_lower = first_text.lower()
                if any(f" {keyword} " in f" {first_text_lower} " for keyword in ADULT_KEYWORDS):
                    continue

                page_msgs = soup2.select("div.block.block--messages > div.block-container > div.block-body > article")
                count = len(page_msgs)
                if count >= 10:
                    page_msgs = page_msgs[:5] + page_msgs[-5:]

                for msg in page_msgs:
                    thread_msg = msg.select_one("div.message-inner > div.message-cell.message-cell--main div.bbWrapper")

                    for smilie in thread_msg.select('.smilie'):
                        smilie.decompose()

                    raw_text = thread_msg.get_text()

                    tags_list = re.findall(r'#\w+', raw_text)

                    m_content = re.sub(r'\s+', ' ', raw_text).strip()

                    card_data = social_model(
                        m_weblink=[thread_link],
                        m_title=str([thread_title]),
                        m_channel_url=thread_link,
                        m_content=m_content,
                        m_content_type=["leaks"],
                        m_network=helper_method.get_network_type(self.base_url),
                        m_platform="leetforums",
                        m_message_sharable_link=thread_link,
                        m_post_tags=tags_list,
                        m_message_date = thread_date,
                    )

                    entity_data = entity_model(
                        m_team="leetforums",
                    )

                    self.append_leak_data(card_data, entity_data)