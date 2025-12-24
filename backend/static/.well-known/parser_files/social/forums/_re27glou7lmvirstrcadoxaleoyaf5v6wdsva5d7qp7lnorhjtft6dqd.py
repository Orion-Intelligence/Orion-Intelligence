from datetime import datetime, timedelta
from abc import ABC
import re
from typing import List
from urllib.parse import urljoin

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.data_model.social_model import social_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _re27glou7lmvirstrcadoxaleoyaf5v6wdsva5d7qp7lnorhjtft6dqd(leak_extractor_interface, ABC):
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
      cls._instance = super(_re27glou7lmvirstrcadoxaleoyaf5v6wdsva5d7qp7lnorhjtft6dqd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def base_url(self) -> str:
    return "http://re27glou7lmvirstrcadoxaleoyaf5v6wdsva5d7qp7lnorhjtft6dqd.onion/"

  @property
  def is_crawled(self) -> bool:
    return self._is_crawled

  @property
  def seed_url(self) -> str:
    return "http://re27glou7lmvirstrcadoxaleoyaf5v6wdsva5d7qp7lnorhjtft6dqd.onion"

  @property
  def developer_signature(self) -> str:
    return "Syed Ibrahim : owEBbgKR/ZANAwAKAZ6k986TaqHrAcsnYgBogoHBVmVyaWZpZWQgZGV2ZWxvcGVyOiBTeWVkIElicmFoaW0KiQIzBAABCgAdFiEE0cDJTTL9lGNCNy3mnqT3zpNqoesFAmiCgcEACgkQnqT3zpNqoeu+UxAAvORjme5u4ZXhva6MkNXPwRHrKLbhZrBBYHgkDra+reoSSRQnMQTlEGWEhRiBi3wGo4MyC2xwhCjRW1raFddBnv03LA59ro978LafPwpEO6cQYxnpqI8nDh6TIEbcJi2GLPIOc4xZm79GvxVZ6b9t5zoaNdSUPv/AwidjXGU4ACIkDo9LQW0RLiVUq8wvhPJRcvvwpmKGwLc9XRWSG95Vv172cv6KCh14EAW90sXSaDc4nIP9sr13j3YN1XGmQwTtmQo8ynmZpZ3JydmUud79ZnB+CfXZXKRehDlSfnTQH5TezsZCpshv5KbtuYwVsqgp/zDSMSZwGtgeaeD3M/yYgRdxbu0yt9RQ74yiwiqzBWa6yEkkECAkAb9QwRXGIqX3oWLFMadiBkCFMaILl+NH4phAVB4lual3H7bZEBgNasOjNm+SYqf/8FJrhBCSjVkLpkpQ71oEBUX06vX+tj2hXW42ZjWm4Lx9qHPh5JYyp9Th5DhnYONVvK96DQHxjYIpqbDTigVCS/rN6PFHolJHOFFivnzYqGeWZEzoI9U+2JhmuDwStKBMNWE+NWJHyyNsOFqEZ1Murl5sBpJEMeC4J4Vn//lPvQAo24hAULJAmOT9CjT00DdnXRdyl602fv0HfwzPf78NQ3LUuabyTLMQUgDKm8Gg8LlenlraOovjXgw==s7Wx"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(
      m_fetch_proxy=FetchProxy.TOR,
      m_fetch_config=FetchConfig.PLAYRIGHT,
      m_threat_type=ThreatType.SOCIAL)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "http://4hpfzoj3tgyp2w7sbe3gnmphqiqpxwwyijyvotamrvojl7pkra7z7byd.onion"

  def append_leak_data(self, leak: social_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page):

    base_url = self.base_url
    max_days = 365
    one_year_ago = datetime.now() - timedelta(days=max_days)

    last_seen_date_str = self.invoke_db(
      REDIS_COMMANDS.S_GET_STRING, helper_method.generate_data_hash(self.seed_url) + REDIS_KEYS.S_URL_TIMEOUT, "")
    if last_seen_date_str:
      last_seen_date = datetime.fromisoformat(last_seen_date_str.replace("Z", "+00:00"))
    else:
      last_seen_date = one_year_ago

    latest_date = None
    page_number = 1
    reached_end = False
    stop_pagination = False

    unwanted_text_indicator = "To see this hidden content"

    while not reached_end and not stop_pagination:
      current_url = f"{base_url}/page-{page_number}" if page_number > 1 else base_url
      page.goto(current_url, timeout=30000)
      page.wait_for_selector("div.structItem.structItem--thread", timeout=10000)

      thread_divs = page.query_selector_all("div.structItem.structItem--thread")
      threads_meta = []
      thread_dates = []
      for idx, thread in enumerate(thread_divs, start=1):
        date_a = thread.query_selector("li.structItem-startDate time.u-dt")
        if not date_a:
          continue
        thread_date_str = date_a.get_attribute("datetime")
        try:
          thread_date = datetime.strptime(thread_date_str[:19], "%Y-%m-%dT%H:%M:%S")
        except Exception:
          continue

        thread_dates.append(thread_date)

        if thread_date <= last_seen_date:
          continue

        if thread_date < one_year_ago:
          continue

        thread_title_a = thread.query_selector("div.structItem-title a")
        if not thread_title_a:
          continue
        thread_href = thread_title_a.get_attribute("href")
        full_thread_url = urljoin(base_url, thread_href)
        m_title = thread_title_a.text_content().strip()
        threads_meta.append(
          {"idx": idx, "full_thread_url": full_thread_url, "thread_date_str": thread_date_str, "thread_date": thread_date, "m_title": m_title})
        if latest_date is None or thread_date > latest_date:
          latest_date = thread_date

      if thread_dates:
        min_thread_date = min(thread_dates)
        if min_thread_date <= last_seen_date:
          stop_pagination = True

      for meta in threads_meta:
        page.goto(meta['full_thread_url'], timeout=30000)
        page.wait_for_selector("div.bbWrapper", timeout=10000)

        try:
          bb_divs = page.query_selector_all("div.bbWrapper")
        except Exception as _:
          continue

        m_content = ""
        valid_bbwrappers = 0
        stop_content = False
        for bb in bb_divs:
          if stop_content:
            break
          bb_text = bb.text_content().strip()
          if unwanted_text_indicator in bb_text:
            bb_text = bb_text.split(unwanted_text_indicator)[0].strip()
            stop_content = True
          bb_text = re.sub(r'[\n\t\r]+', ' ', bb_text)
          bb_text = re.sub(r'[ ]+', ' ', bb_text).strip()
          if not bb_text:
            continue
          m_content += bb_text + " "
          valid_bbwrappers += 1

        if valid_bbwrappers == 0 or not m_content.strip():
          continue

        m_content_clean = m_content.strip()

        username_span = page.query_selector("div.message-userName h4.message-name span.username")
        m_username = username_span.text_content().strip() if username_span else ""

        card_data = social_model(
          m_title=meta['m_title'],
          m_channel_url=meta['full_thread_url'],
          m_content=m_content_clean,
          m_network=helper_method.get_network_type(base_url),
          m_message_date=helper_method.extract_and_convert_date(meta['thread_date_str']),
          m_content_type=["leak"],
          m_platform="forum",
          m_message_sharable_link=meta['full_thread_url'],
          m_post_comments_count=str(valid_bbwrappers), )
        entity_data = entity_model(m_name=m_username)
        self.append_leak_data(card_data, entity_data)

      if not stop_pagination:
        next_page_a = page.query_selector("a.pageNav-jump--next")
        if next_page_a:
          page_number += 1
        else:
          reached_end = True
      else:
        reached_end = True

    if latest_date:
      self.invoke_db(
        REDIS_COMMANDS.S_SET_STRING,
        helper_method.generate_data_hash(self.seed_url) + REDIS_KEYS.S_URL_TIMEOUT,
        latest_date.strftime("%Y-%m-%dT%H:%M:%S"))

    return True
