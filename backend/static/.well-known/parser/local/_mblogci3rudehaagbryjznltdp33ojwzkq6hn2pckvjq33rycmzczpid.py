from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _mblogci3rudehaagbryjznltdp33ojwzkq6hn2pckvjq33rycmzczpid(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_mblogci3rudehaagbryjznltdp33ojwzkq6hn2pckvjq33rycmzczpid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://mblogci3rudehaagbryjznltdp33ojwzkq6hn2pckvjq33rycmzczpid.onion"

    @property
    def base_url(self) -> str:
        return "http://mblogci3rudehaagbryjznltdp33ojwzkq6hn2pckvjq33rycmzczpid.onion"

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
                page.wait_for_selector(".leak-card", timeout=10000)

                while True:
                    cards = page.query_selector_all(".leak-card")

                    if not cards or len(cards) == last_card_count:
                        no_new_card_attempts += 1
                        if no_new_card_attempts >= 3:
                            return
                    else:
                        no_new_card_attempts = 0

                    last_card_count = len(cards)

                    for index, card in enumerate(cards):
                        try:
                            cards = page.query_selector_all(".leak-card")
                            card = cards[index]

                            title = card.query_selector("h5")
                            content = card.query_selector("p")
                            datetime = card.query_selector(".published")

                            title_text = title.inner_text().strip() if title else "Unknown"
                            content_text = content.inner_text().strip() if content else "No content"
                            datetime_text = datetime.inner_text().strip() if datetime else "Unknown Date/Time"

                            card_url = card.get_attribute("href") or page.url
                            if card_url in processed_urls:
                                continue
                            processed_urls.add(card_url)

                            with page.expect_navigation(wait_until="domcontentloaded"):
                                card.click()

                            page.wait_for_timeout(2000)
                            dumplink_elements = page.query_selector_all(".download-links a")
                            dumplinks = [link.get_attribute("href").strip() for link in dumplink_elements if
                                         link.get_attribute("href")]

                            with page.expect_navigation(wait_until="domcontentloaded"):
                                page.go_back()
                            page.wait_for_load_state("domcontentloaded")
                            page.wait_for_selector(".leak-card", timeout=10000)

                            self._card_data.append(
                                card_extraction_model(
                                    m_title=title_text,
                                    m_url=page.url,
                                    m_base_url=self.base_url,
                                    m_content=content_text,
                                    m_network=helper_method.get_network_type(self.base_url),
                                    m_important_content=content_text,
                                    m_dumplink=dumplinks,
                                    m_email_addresses=helper_method.extract_emails(content_text),
                                    m_phone_numbers=helper_method.extract_phone_numbers(content_text),
                                    m_content_type=["leaks"],
                                    m_leak_date=datetime_text,
                                )
                            )

                        except Exception as e:
                            print({e})

                    for _ in range(3):
                        page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
                        page.wait_for_timeout(2000)

            except Exception as e:
                print({e})
                break




