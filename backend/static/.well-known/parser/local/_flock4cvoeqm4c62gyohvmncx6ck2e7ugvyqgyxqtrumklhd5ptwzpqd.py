from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _flock4cvoeqm4c62gyohvmncx6ck2e7ugvyqgyxqtrumklhd5ptwzpqd(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_flock4cvoeqm4c62gyohvmncx6ck2e7ugvyqgyxqtrumklhd5ptwzpqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://flock4cvoeqm4c62gyohvmncx6ck2e7ugvyqgyxqtrumklhd5ptwzpqd.onion"

    @property
    def base_url(self) -> str:
        return "http://flock4cvoeqm4c62gyohvmncx6ck2e7ugvyqgyxqtrumklhd5ptwzpqd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "https://www.iana.org/help/example-domains"

    def parse_leak_data(self, page: Page):
        self._card_data = []
        processed_urls = set()
        last_card_count = 0
        no_new_card_attempts = 0

        while True:
            try:
                page.wait_for_selector("article.post", timeout=10000)

                while True:
                    cards = page.query_selector_all("article.post")

                    if not cards or len(cards) == last_card_count:
                        no_new_card_attempts += 1
                        if no_new_card_attempts >= 3:
                            return
                    else:
                        no_new_card_attempts = 0

                    last_card_count = len(cards)

                    for index, card in enumerate(cards):
                        try:
                            cards = page.query_selector_all("article.post")
                            card = cards[index]

                            title_element = card.query_selector("h2.entry-title a")
                            date_element = card.query_selector("span.published")

                            title_text = title_element.inner_text().strip() if title_element else "Unknown"
                            date_text = date_element.inner_text().strip() if date_element else "Unknown Date"
                            card_url = title_element.get_attribute("href") if title_element else None

                            if not card_url or card_url in processed_urls:
                                continue
                            processed_urls.add(card_url)

                            with page.expect_navigation(wait_until="domcontentloaded"):
                                title_element.click()

                            content_element = page.query_selector("div.entry-content")

                            paragraphs = content_element.query_selector_all("p") if content_element else []
                            content_text = "\n".join(
                                p.inner_text().strip() for p in paragraphs if p.inner_text().strip())

                            links = [a.get_attribute("href") for a in content_element.query_selector_all("a") if
                                     a.get_attribute("href")]

                            for link in links:
                                content_text = content_text.replace(link, "")

                            self._card_data.append(
                                card_extraction_model(
                                    m_title=title_text,
                                    m_url=page.url,
                                    m_base_url=self.base_url,
                                    m_content=content_text.strip(),
                                    m_network=helper_method.get_network_type(self.base_url),
                                    m_important_content=content_text.strip(),
                                    m_dumplink=links,
                                    m_email_addresses=helper_method.extract_emails(content_text),
                                    m_phone_numbers=helper_method.extract_phone_numbers(content_text),
                                    m_content_type=["leaks"],
                                    m_leak_date=date_text,
                                )
                            )

                            with page.expect_navigation(wait_until="domcontentloaded"):
                                page.go_back()
                            page.wait_for_selector("article.post", timeout=10000)

                        except Exception as e:
                            print({e})

                    for _ in range(3):
                        page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
                        page.wait_for_timeout(2000)

            except Exception as e:
                print({e})
                break



