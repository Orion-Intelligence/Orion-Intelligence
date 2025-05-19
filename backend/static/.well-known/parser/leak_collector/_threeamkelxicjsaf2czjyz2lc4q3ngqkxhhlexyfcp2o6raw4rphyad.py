from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method

class _threeamkelxicjsaf2czjyz2lc4q3ngqkxhhlexyfcp2o6raw4rphyad(leak_extractor_interface, ABC):
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
            cls._instance = super(_threeamkelxicjsaf2czjyz2lc4q3ngqkxhhlexyfcp2o6raw4rphyad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://threeamkelxicjsaf2czjyz2lc4q3ngqkxhhlexyfcp2o6raw4rphyad.onion/"

    @property
    def base_url(self) -> str:
        return "http://threeamkelxicjsaf2czjyz2lc4q3ngqkxhhlexyfcp2o6raw4rphyad.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://threeamkelxicjsaf2czjyz2lc4q3ngqkxhhlexyfcp2o6raw4rphyad.onion/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        self._card_data = []
        processed_urls = set()
        post_links = []

        try:

            if not page.is_visible(".post-more-link.f_left"):
                print("No posts found! Exiting parser.")
                return


            page.wait_for_selector(".post-more-link.f_left", timeout=15000)


            post_elements = page.query_selector_all(".post-more-link.f_left")

            for post_element in post_elements:
                onclick_attr = post_element.get_attribute("onclick")
                if onclick_attr and "location.href=" in onclick_attr:
                    relative_url = onclick_attr.split("location.href='")[1].split("'")[0]
                    full_url = self.base_url + relative_url
                    post_links.append(full_url)

            if not post_links:
                print("No post links extracted! Exiting parser.")
                return


            for post_link in post_links:
                if post_link in processed_urls:
                    continue

                processed_urls.add(post_link)
                try:

                    page.goto(post_link, wait_until="domcontentloaded", timeout=15000)


                    def safe_get_text(selector):
                        element = page.query_selector(selector)
                        return element.inner_text().strip() if element else "Unknown"

                    title_text = safe_get_text(".bord-header h2")
                    description_text = safe_get_text(".full-bord p")
                    date_text = safe_get_text(".meta_full.noselect.f_left")
                    file_size_text = safe_get_text(".file-size")


                    profile_element = page.query_selector(".avatar.bg-transparent.shadow-none img")
                    profile_img = profile_element.get_attribute("src") if profile_element else "Unknown"


                    file_name = page.query_selector(".file-name")
                    download_link = None
                    if file_name:
                        onclick_attr = file_name.get_attribute("onclick")
                        if onclick_attr and "window.open" in onclick_attr:
                            download_link = onclick_attr.split("window.open('")[1].split("', '_blank')")[0]

                    card_data = leak_model(
                        m_screenshot=helper_method.get_screenshot_base64(page, description_text),
                        m_title=title_text if title_text != "Unknown" else "Extracted Post",
                        m_url=post_link,
                        m_base_url=self.base_url,
                        m_content=f"Description: {description_text}\nFile Size: {file_size_text}" + " " + self.base_url + " " + post_link,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=description_text,
                        m_dumplink=[download_link] if download_link else [],
                        m_content_type=["leaks"],
                        m_leak_date=helper_method.extract_and_convert_date(date_text),
                        m_data_size=file_size_text,
                        m_logo_or_images=[profile_img] if profile_img != "Unknown" else []
                    )

                    entity_data = entity_model(
                        m_email=helper_method.extract_emails(description_text),
                    )
                    entity_data = helper_method.extract_entities(description_text, entity_data)
                    self.append_leak_data(card_data, entity_data)

                except Exception as e:
                    print(f"Error navigating to {post_link}: {e}")
                    continue


                try:
                    page.go_back()
                    page.wait_for_selector(".post-more-link.f_left", timeout=15000)
                except Exception as e:
                    print(f"Error going back: {e}")

        except Exception as e:
            print(f"Error: {e}")
