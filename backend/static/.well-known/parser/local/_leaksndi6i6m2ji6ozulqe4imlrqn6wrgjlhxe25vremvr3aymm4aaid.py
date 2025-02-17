from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _leaksndi6i6m2ji6ozulqe4imlrqn6wrgjlhxe25vremvr3aymm4aaid(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_leaksndi6i6m2ji6ozulqe4imlrqn6wrgjlhxe25vremvr3aymm4aaid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://leaksndi6i6m2ji6ozulqe4imlrqn6wrgjlhxe25vremvr3aymm4aaid.onion/"

    @property
    def base_url(self) -> str:
        return "http://leaksndi6i6m2ji6ozulqe4imlrqn6wrgjlhxe25vremvr3aymm4aaid.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "hackteam@dnmx.su"

    def parse_leak_data(self, page: Page):
        self._card_data = []

        while True:
            try:
                page.wait_for_selector(".list tbody tr", timeout=10000)
                rows = page.query_selector_all(".list tbody tr")

                for row in rows:
                    try:

                        year = row.query_selector("td:nth-child(1)").inner_text().strip()
                        database = row.query_selector("td:nth-child(2)").inner_text().strip()
                        site = row.query_selector("td:nth-child(3)").inner_text().strip()
                        records = row.query_selector("td:nth-child(4)").inner_text().strip()
                        price = row.query_selector("td:nth-child(5)").inner_text().strip()


                        buy_button = row.query_selector("td:nth-child(6) button")
                        if not buy_button:
                            continue

                        with page.expect_popup() as new_page_info:
                            buy_button.click()

                        buy_page = new_page_info.value
                        buy_page.wait_for_load_state("domcontentloaded")

                        #
                        description_element = buy_page.query_selector(".order-details tr:nth-child(4) td")
                        description = description_element.inner_text().strip() if description_element else "No description"


                        buy_page.close()
                        page.bring_to_front()


                        self._card_data.append(
                            card_extraction_model(
                                m_title=database,
                                m_url=page.url,
                                m_base_url=self.base_url,
                                m_content=description if description else f"{year} | {database} | {site} | {records} | {price}",
                                m_network=helper_method.get_network_type(self.base_url),
                                m_important_content=description if description else f"{year} | {database} | {site} | {records} | {price}",
                                m_weblink=[site],
                                m_email_addresses=helper_method.extract_emails(description),
                                m_phone_numbers=helper_method.extract_phone_numbers(description),
                                m_content_type=["leaks"],
                                m_leak_date=year,
                            )
                        )

                    except Exception as e:
                        print(f"Error processing row: {e}")

                break

            except Exception as e:
                print(f"Error parsing table: {e}")
                break