from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion"

    @property
    def base_url(self) -> str:
        return "http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion"

    def parse_leak_data(self, page: Page):
        self._card_data = []

        try:
            page.wait_for_selector("div.border.border-warning.card-body.shadow-lg",
                                   timeout=30000)
            cards = page.query_selector_all("div.border.border-warning.card-body.shadow-lg")

            if not cards:
                return

            for card in cards:
                try:
                    title_element = card.query_selector("h4.card-title")
                    company_name = title_element.inner_text().strip() if title_element else "Unknown"

                    website_element = card.query_selector("h6.card-subtitle a")
                    website = website_element.get_attribute("href").strip() if website_element else "N/A"

                    content_element = card.query_selector("p.card-text")
                    content_text = content_element.inner_text().strip() if content_element else "No content available"
                    imp_content = content_text[:500]

                    dumplinks = []
                    links = card.query_selector_all("h6.card-subtitle a")
                    if links:
                        dumplinks = [link.get_attribute("href").strip() for link in links if link.get_attribute("href")]

                    self._card_data.append(
                        leak_model(
                            m_screenshot=helper_method.get_screenshot_base64(page, company_name),
                            m_title=company_name,
                            m_url=page.url,
                            m_websites=[website],
                            m_base_url=self.base_url,
                            m_company_name=company_name,
                            m_content=content_text,
                            m_network=helper_method.get_network_type(self.base_url),
                            m_important_content=imp_content,
                            m_email_addresses=helper_method.extract_emails(content_text),
                            m_phone_numbers=helper_method.extract_phone_numbers(content_text),
                            m_content_type=["leaks"],
                            m_dumplink=dumplinks,
                        )
                    )

                except Exception as e:
                    print(f"Error processing card: {e}")

        except Exception as e:
            print(f"Error in parsing: {e}")



