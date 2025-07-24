from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _akiral2iz6a7qgd3ayp3l6yub7xx2uep76idk3u2kollpj5z3z636bad(leak_extractor_interface, ABC):
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
            cls._instance = super(_akiral2iz6a7qgd3ayp3l6yub7xx2uep76idk3u2kollpj5z3z636bad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "https://akiral2iz6a7qgd3ayp3l6yub7xx2uep76idk3u2kollpj5z3z636bad.onion/"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "https://akiral2iz6a7qgd3ayp3l6yub7xx2uep76idk3u2kollpj5z3z636bad.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_timeout=57200, m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://akiral2iz6a7qgd3ayp3l6yub7xx2uep76idk3u2kollpj5z3z636bad.onion/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state('networkidle')
        page.wait_for_selector('textarea.cmd-clipboard', timeout=30000)
        page.fill('textarea.cmd-clipboard', 'leaks')

        def handle_response(responses):
            try:
                if "application/json" in responses.headers.get("content-type", ""):
                    json_data = responses.json()
                    if isinstance(json_data, list):
                        for item in json_data:
                            name = item.get("name", "").replace("\n", "").strip()
                            desc = item.get("desc", "").replace("\n", "").strip()
                            url = item.get("url", "")

                            if url:
                                if url.startswith("[[!;;;;") and "]" in url:
                                    url = url.split("]")[0].replace("[[!;;;;", "").strip()
                                else:
                                    url = url.strip()

                            magnet = ""
                            if "magnet:?" in desc:
                                idx = desc.find("magnet:?")
                                magnet = desc[idx:].split()[0]

                            m_content = f"Name: {name}\nDescription: {desc}\nMagnet: {magnet}\nURL: {url}"
                            dump_links = [magnet, url]

                            card_data = leak_model(
                                m_title=name,
                                m_url=page.url,
                                m_base_url=self.base_url,
                                m_screenshot=helper_method.get_screenshot_base64(page, name, self.base_url),
                                m_content=m_content,
                                m_network=helper_method.get_network_type(self.base_url),
                                m_important_content=desc[:500],
                                m_dumplink=dump_links,
                                m_content_type=["leaks"],
                            )

                            entity_data = entity_model(
                                m_team="akira",
                            )

                            self.append_leak_data(card_data, entity_data)

            except(ValueError,KeyError,TypeError) as e:
                print(f"Error parsing response: {e}")



        context = page.context
        page.keyboard.press("Enter")
        response = context.wait_for_event("response", timeout=30000)
        handle_response(response)
        self._is_crawled = True
