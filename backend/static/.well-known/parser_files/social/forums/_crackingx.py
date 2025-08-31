import re
import datetime
from abc import ABC
from typing import List
from datetime import  timezone
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from datetime import datetime, timedelta
from crawler.crawler_services.shared.helper_method import helper_method


class _crackingx(leak_extractor_interface, ABC):
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
            cls._instance = super(_crackingx, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://crackingx.com"

    @property
    def developer_signature(self) -> str:
        return "Syed Ibrahim: owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"
    @property
    def base_url(self) -> str:
        return "https://crackingx.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.FORUM)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://crackingx.com/misc/contact"

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

    @staticmethod
    def parse_date(date_str):
        if not date_str:
            return None

        if date_str.startswith("Yesterday at "):
            try:
                t = datetime.strptime(date_str[13:], "%I:%M %p").time()
                y = datetime.now()
                return datetime.combine((y - timedelta(days=1)).date(), t)
            except:
                pass

        weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for day in weekdays:
            if date_str.startswith(day + " at "):
                try:
                    t = datetime.strptime(date_str[len(day) + 4:], "%I:%M %p").time()
                    today = datetime.now()
                    target_weekday = weekdays.index(day)
                    days_diff = (today.weekday() - target_weekday) % 7
                    target_date = today - timedelta(days=days_diff)
                    return datetime.combine(target_date.date(), t)
                except:
                    pass

        for fmt in ("%b %d, %Y", "%B %d, %Y"):
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                pass

        iso_like = (
                re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", date_str) or
                re.match(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", date_str)
        )
        if iso_like:
            try:
                if "Z" in date_str:
                    date_str = date_str.replace("Z", "+00:00")
                date_str = re.sub(r'([+-]\d{2})(\d{2})$', r'\1:\2', date_str)
                return datetime.fromisoformat(date_str)
            except:
                pass

        return None

    def parse_leak_data(self, page):
        max_days = 5 if self.is_crawled else 500
        MIN_REPLIES = 2

        category_mapping = {
            "information": ["https://crackingx.com/forums/Rules_announcements/"],
            "cracking": [
                "https://crackingx.com/forums/9/",
                "https://crackingx.com/forums/5/",
                "https://crackingx.com/forums/2/",
                "https://crackingx.com/forums/17/",
                "https://crackingx.com/forums/11/"
            ],
            "Marketplace": [
                "https://crackingx.com/forums/premium_section/",
                "https://crackingx.com/forums/14/",
                "https://crackingx.com/forums/13/",
                "https://crackingx.com/forums/16/"
            ],
            "Money": [
                "https://crackingx.com/forums/4/",
                "https://crackingx.com/forums/19/"
            ]
        }

        for category_name, section_urls in category_mapping.items():
            for section_url in section_urls:
                page.goto(section_url)
                page.wait_for_load_state("domcontentloaded")

                page_num = 1
                max_pages = 3

                while page_num <= max_pages:
                    thread_data = []
                    thread_items = page.query_selector_all(".structItem")

                    for item in thread_items:
                        try:
                            title_el = item.query_selector("a[href^='/threads/']")
                            if not title_el:
                                continue

                            href = title_el.get_attribute('href')
                            title = title_el.inner_text().strip()

                            replies_el = item.query_selector("dl.pairs--justified:has(dt:has-text('Replies')) dd")
                            num_replies = 0
                            if replies_el:
                                replies_text = replies_el.inner_text().strip()
                                if replies_text.isdigit():
                                    num_replies = int(replies_text)

                            if num_replies < MIN_REPLIES:
                                continue

                            date_el = item.query_selector("time.structItem-latestDate.u-dt")
                            date_str = None
                            datetime_attr = None
                            data_time = None
                            data_date_string = None

                            if date_el:
                                datetime_attr = date_el.get_attribute('datetime')
                                data_time = date_el.get_attribute('data-time')
                                data_date_string = date_el.get_attribute('data-date-string')
                                date_str = date_el.inner_text().strip()

                            thread_data.append({
                                'href': href,
                                'title': title,
                                'datetime': datetime_attr,
                                'data_time': data_time,
                                'data_date_string': data_date_string,
                                'dateStr': date_str
                            })
                        except:
                            continue

                    if not thread_data:
                        break

                    valid_threads = []
                    for thread in thread_data:
                        href = thread.get('href')
                        title = thread.get('title')

                        datetime_attr = thread.get('datetime')
                        data_time = thread.get('data_time')
                        data_date_string = thread.get('data_date_string')
                        date_str = thread.get('dateStr')

                        thread_dt = None

                        if datetime_attr:
                            try:
                                thread_dt = self.parse_date(datetime_attr)
                            except:
                                pass

                        if thread_dt is None and data_time:
                            try:
                                timestamp = int(data_time)
                                thread_dt = datetime.fromtimestamp(timestamp, timezone.utc)
                            except:
                                pass

                        if thread_dt is None and data_date_string:
                            try:
                                thread_dt = self.parse_date(data_date_string)
                            except:
                                pass

                        if thread_dt is None and date_str:
                            try:
                                thread_dt = self.parse_date(date_str)
                            except:
                                pass

                        if thread_dt:
                            now_dt = datetime.now(timezone.utc)
                            days_diff = (now_dt - thread_dt).days
                            if days_diff <= max_days:
                                valid_threads.append({'href': href, 'title': title})
                        else:
                            valid_threads.append({'href': href, 'title': title})

                    if valid_threads:
                        for thread in valid_threads:
                            href = thread.get('href')
                            title = thread.get('title')

                            thread_url = href
                            if not thread_url.startswith('http'):
                                thread_url = "https://crackingx.com" + href if not href.startswith(
                                    '/') else "https://crackingx.com" + href

                            self.extract_thread_data(page, thread_url, title, category_name)

                    should_continue = False

                    if thread_data:
                        last_thread = thread_data[-1]

                        last_datetime = last_thread.get('datetime')
                        last_data_time = last_thread.get('data_time')
                        last_data_date_string = last_thread.get('data_date_string')
                        last_date_str = last_thread.get('dateStr')

                        last_thread_dt = None

                        if last_datetime:
                            try:
                                last_thread_dt = self.parse_date(last_datetime)
                            except:
                                pass

                        if last_thread_dt is None and last_data_time:
                            try:
                                timestamp = int(last_data_time)
                                last_thread_dt = datetime.fromtimestamp(timestamp, timezone.utc)
                            except:
                                pass

                        if last_thread_dt is None and last_data_date_string:
                            try:
                                last_thread_dt = self.parse_date(last_data_date_string)
                            except:
                                pass

                        if last_thread_dt is None and last_date_str:
                            try:
                                last_thread_dt = self.parse_date(last_date_str)
                            except:
                                pass

                        if last_thread_dt:
                            now_dt = datetime.now(timezone.utc)
                            days_diff = (now_dt - last_thread_dt).days
                            if days_diff <= max_days:
                                should_continue = True
                        else:
                            should_continue = True

                    if not should_continue:
                        break

                    next_button_selectors = [
                        "a.pageNav-jump--next",
                        "a.pageNavSimple-el--next",
                        "li.pageNav-page--next a",
                        "a[rel='next']",
                        "a:has-text('Next')",
                        "a.structItem-pageJump:has-text('Next')"
                    ]

                    next_button = None
                    for selector in next_button_selectors:
                        try:
                            element = page.query_selector(selector)
                            if element:
                                next_button = selector
                                break
                        except:
                            continue

                    if not next_button or page_num >= max_pages:
                        break

                    try:
                        current_url = page.url
                        page.click(next_button)
                        page.wait_for_load_state("domcontentloaded")
                        new_url = page.url
                        if new_url == current_url:
                            break
                        else:
                            page_num += 1
                    except:
                        break

        return True

    def extract_thread_data(self, page, thread_url, thread_title, category_name):
        try:
            page.goto(thread_url)
            page.wait_for_load_state("domcontentloaded")

            date_tag = page.locator("time.u-dt").first
            thread_dt = None

            if date_tag.count() > 0:
                datetime_attr = date_tag.get_attribute("datetime")
                if datetime_attr:
                    m_date = datetime_attr
                    thread_dt = self.parse_date(m_date)
                else:
                    date_text = date_tag.inner_text()
                    thread_dt = self.parse_date(date_text)

            bb_wrappers = page.locator("div.bbWrapper")
            wrapper_count = bb_wrappers.count()

            max_days = 5 if self.is_crawled else 500
            if wrapper_count < 10:
                if thread_dt:
                    now_dt = datetime.now(timezone.utc)
                    days_diff = (now_dt - thread_dt).days
                    if days_diff > max_days:
                        return None
                else:
                    return None

            valid_sections = []
            for i in range(wrapper_count):
                wrapper = bb_wrappers.nth(i)
                html_content = wrapper.inner_html()
                text_content = helper_method.filter_comments(wrapper.inner_text().strip())

                if ("block-mhhide" in html_content or
                        "bbCodeBlock" in html_content or
                        len(text_content) < 10):
                    continue

                valid_sections.append(text_content)

            if len(valid_sections) > 20:
                selected_sections = valid_sections[:10] + valid_sections[-10:]
            else:
                selected_sections = valid_sections

            if not selected_sections:
                selected_sections = ["no comments"]

            m_content = "\n".join(selected_sections)
            m_content_type = ["leaks", category_name]

            usernames = set()
            username_elements = page.query_selector_all("a.username")
            for i in range(min(len(username_elements), 5)):
                username = username_elements[i].inner_text().strip()
                if username:
                    usernames.add(username)

            hashtags = []
            tag_elements = page.query_selector_all("a.tagItem")
            for i in range(len(tag_elements)):
                tag = tag_elements[i].inner_text().strip()
                if tag:
                    hashtags.append(tag)

            card_data = social_model(
                m_title=thread_title,
                m_channel_url=thread_url,
                m_content=m_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_message_date=thread_dt.date() if thread_dt else None,
                m_content_type=m_content_type,
                m_platform="forum",
                m_message_sharable_link=thread_url
            )

            entity_data = entity_model(
                m_author=list(usernames),
                m_hashtags=hashtags
            )

            self.append_leak_data(card_data, entity_data)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
