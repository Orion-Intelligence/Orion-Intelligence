from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method

class _lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd.onion/leaks"

    @property
    def base_url(self) -> str:
        return "http://lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command:REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value):
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://weg7sdx54bevnvulapqu6bpzwztryeflq3s23tegbmnhkbpqz637f2yd.onion/?contact"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page:Page ):

        try:
            description = revenue = ""

            # Get all cards
            cardss = page.query_selector_all('.news_grid .chat_block')

            for card in cardss:
                # Extract title and date from the card
                title = card.query_selector('.chat__block-title').inner_text().strip() if card.query_selector(
                    '.chat__block-title') else "No Title"
                date = card.query_selector('.chat__block-date span').inner_text().strip() if card.query_selector(
                    '.chat__block-date span') else "No Date"

                # Extract the link to the publication page
                link = card.query_selector('.button.button-blue').get_attribute('href') if card.query_selector(
                    '.button.button-blue') else None

                if link:
                    # Open the linked page in a new tab
                    publication_page = page.context.new_page()
                    publication_page.goto(link)

                    # Extract information from the publication page
                    description = publication_page.query_selector(
                        '.detailed p').inner_text() if publication_page.query_selector(
                        '.detailed p') else "No description available"
                    revenue = publication_page.query_selector('text=Revenue:').locator('..').query_selector(
                        'p').inner_text() if publication_page.query_selector('text=Revenue:') else "No revenue info"
                    employees = publication_page.query_selector('text=Employees:').locator('..').query_selector(
                        'p').inner_text() if publication_page.query_selector('text=Employees:') else "No team size info"
                    download = publication_page.query_selector('text=Downloaded:').locator('..').query_selector(
                        'p').inner_text() if publication_page.query_selector('text=Downloaded:') else "No download data"
                    income = publication_page.query_selector('text=Income').locator('..').query_selector(
                        'p').inner_text() if publication_page.query_selector('text=Income') else "No income info"

                    # Close the publication page after extraction
                    publication_page.close()

                # Create the leak model to store the data
                card_data = leak_model(
                    m_title=title,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_screenshot="",
                    m_content=description,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=description,
                    m_content_type=["leaks"],
                    m_revenue=revenue,
                )

                # Create the entity model for emails and phone numbers
                entity_data = entity_model(
                    m_email_addresses=helper_method.extract_emails(description),
                    m_phone_numbers=helper_method.extract_phone_numbers(description),
                )

                # Append the extracted data to the collection
                self.append_leak_data(card_data, entity_data)

        except Exception as e:
            print(f"An error occurred while parsing leak data: {e}")