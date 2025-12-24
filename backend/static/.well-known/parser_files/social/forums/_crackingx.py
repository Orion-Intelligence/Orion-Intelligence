import datetime
import re
from abc import ABC
from typing import List
from datetime import timezone
from urllib.parse import urljoin
from datetime import datetime
from datetime import timedelta

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
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
  def date_to_str(d):
    if not d:
      return ""
    if isinstance(d, datetime):
      d = d.date()
    formatted = d.strftime("%Y%m%d")
    return formatted

  @staticmethod
  def extract_clean_text(bb_wrappers):
    texts = []
    for div in bb_wrappers.all()[:20]:
      text = div.inner_text()
      text = re.sub(r"\n+", "\n", text).strip()
      texts.append(text[:1000])
    return texts

  def parse_leak_data(self, page):
    if self.is_crawled:
      max_days = 30
      max_page = 2
    else:
      max_days = 500
      max_page = 5

    category_mapping = {"cracking": ["https://crackingx.com/forums/9/", "https://crackingx.com/forums/5/",
      "https://crackingx.com/forums/2/", "https://crackingx.com/forums/17/",
      "https://crackingx.com/forums/11/", ], "Marketplace": ["https://crackingx.com/forums/premium_section/",
      "https://crackingx.com/forums/14/", "https://crackingx.com/forums/13/",
      "https://crackingx.com/forums/16/", ], "Money": ["https://crackingx.com/forums/4/",
      "https://crackingx.com/forums/19/", ], }

    for category_name, section_urls in category_mapping.items():
      page_num = 1
      for section_url in section_urls:
        latest_date = None
        section_hash = helper_method.generate_data_hash(section_url)
        while section_url:
          page.goto(section_url)
          page.wait_for_load_state("domcontentloaded")

          thread_data = []
          thread_items = page.query_selector_all(".structItem")
          last_seen_date_str = self.invoke_db(REDIS_COMMANDS.S_GET_STRING, section_hash + REDIS_KEYS.S_URL_TIMEOUT, "")
          if last_seen_date_str:
            last_seen_date = datetime.fromisoformat(last_seen_date_str.replace("Z", "+00:00"))
          else:
            last_seen_date = datetime.now() - timedelta(days=max_days)

          for idx, item in enumerate(thread_items, start=1):
            title_el = item.query_selector("a[href^='/threads/']")
            if not title_el:
              continue
            href = title_el.get_attribute("href")
            title = title_el.inner_text().strip()
            date_el = item.query_selector("time.structItem-latestDate.u-dt")
            if not date_el:
              continue
            datetime_attr = date_el.get_attribute("datetime")
            dtime = datetime.strptime(datetime_attr, "%Y-%m-%dT%H:%M:%S%z").replace(tzinfo=None)

            if last_seen_date and dtime.date() <= last_seen_date.date():
              continue

            thread_url = "https://crackingx.com" + href if href and not href.startswith("http") else href
            if not thread_url:
              continue

            thread_hash = helper_method.generate_data_hash(thread_url)
            thread_data.append(
              {"href": thread_url, "title": title, "thread_dt": dtime, "thread_hash": thread_hash, "date_str": datetime_attr, })

          if not thread_data:
            break

          next_btn = page.locator("a.pageNav-jump--next").last
          href = None
          if next_btn.count() > 0:
            val = next_btn.get_attribute("href")
            if val:
              href = urljoin(page.url, val)

          next_btn = href

          if thread_data:
            for thread in thread_data:
              self.extract_thread_data(page, thread["href"], thread["title"], category_name)

          if not latest_date:
            latest_thread = max(thread_data, key=lambda t: t["thread_dt"])
            latest_date = latest_thread["thread_dt"]
            self.invoke_db(
              REDIS_COMMANDS.S_SET_STRING,
              section_hash + REDIS_KEYS.S_URL_TIMEOUT,
              latest_date.strftime("%Y%m%d"))

          if max_page < page_num:
            break

          section_url = next_btn
          page_num += 1

    return True

  def extract_thread_data(self, page, thread_url, thread_title, category_name):
    page.goto(thread_url)
    page.wait_for_load_state("domcontentloaded")

    date_tag = page.locator("time.u-dt").first
    thread_dt = None

    if date_tag.count() > 0:
      datetime_attr = date_tag.get_attribute("datetime")
      if datetime_attr:
        m_date = datetime_attr
        thread_dt = helper_method.parse_date(m_date)
      else:
        date_text = date_tag.inner_text()
        thread_dt = helper_method.parse_date(date_text)

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

    text_content = self.extract_clean_text(bb_wrappers)
    m_content = "\n".join(text_content)
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
      m_message_sharable_link=thread_url,
      m_post_comments_count=str(wrapper_count))

    entity_data = entity_model(
      m_scrap_file=self.__class__.__name__, m_author=list(usernames), m_hashtags=hashtags)

    self.append_leak_data(card_data, entity_data)
